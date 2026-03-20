<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function base_path(string $path = ''): string
{
    $base = dirname(__DIR__);
    return $path === '' ? $base : $base . '/' . ltrim($path, '/');
}

function load_env(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }

    $envPath = base_path('.env');
    if (is_file($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $trimmed, 2);
            $key = trim($key);
            $value = trim($value);
            $value = trim($value, "\"'");

            if ($key !== '' && getenv($key) === false) {
                putenv("{$key}={$value}");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }

    $loaded = true;
}

function env_value(string $key, ?string $default = null): ?string
{
    load_env();
    $value = getenv($key);
    return $value === false ? $default : $value;
}

function json_response(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function html_response(string $html): never
{
    http_response_code(200);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('JSON inválido en el body de la petición.');
    }

    return $decoded;
}

function data_store_path(): string
{
    return base_path('local-data/dark-ranch.json');
}

function read_json_store(): array
{
    $path = data_store_path();
    if (!is_file($path)) {
        throw new RuntimeException('No se encontró local-data/dark-ranch.json para el modo JSON.');
    }

    $payload = json_decode((string) file_get_contents($path), true);
    if (!is_array($payload)) {
        throw new RuntimeException('No se pudo leer el store JSON local.');
    }

    return $payload;
}

function write_json_store(array $store): void
{
    $path = data_store_path();
    if (!is_dir(dirname($path))) {
        mkdir(dirname($path), 0777, true);
    }
    file_put_contents($path, json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function database_mode(): string
{
    return strtolower(env_value('DB_CONNECTION', 'json') ?? 'json');
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = env_value('DB_HOST', '127.0.0.1');
    $port = env_value('DB_PORT', '3306');
    $database = env_value('DB_DATABASE', 'dark_ranch');
    $username = env_value('DB_USERNAME', 'root');
    $password = env_value('DB_PASSWORD', '');
    $charset = env_value('DB_CHARSET', 'utf8mb4');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $database, $charset);
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

function format_product(array $product): array
{
    return [
        'id' => $product['id'],
        'name' => $product['name'],
        'slug' => $product['slug'],
        'description' => $product['description'],
        'price' => (float) $product['price'],
        'salePrice' => $product['sale_price'] !== null ? (float) $product['sale_price'] : null,
        'category' => $product['category_name'],
        'images' => json_decode($product['images_json'] ?? '[]', true) ?: [],
        'sizes' => json_decode($product['sizes_json'] ?? '[]', true) ?: [],
        'colors' => json_decode($product['colors_json'] ?? '[]', true) ?: [],
        'tags' => json_decode($product['tags_json'] ?? '[]', true) ?: [],
        'stock' => (int) $product['stock'],
        'isNew' => (bool) $product['is_new'],
        'isFeatured' => (bool) $product['is_featured'],
    ];
}

function get_products(): array
{
    if (database_mode() === 'mysql') {
        $statement = db()->query(
            'SELECT p.*, c.name AS category_name
             FROM products p
             INNER JOIN categories c ON c.id = p.category_id
             WHERE p.is_active = 1
             ORDER BY p.is_featured DESC, p.created_at DESC'
        );
        return array_map('format_product', $statement->fetchAll());
    }

    $store = read_json_store();
    $products = array_values(array_filter($store['products'] ?? [], static fn (array $product): bool => ($product['isActive'] ?? true) !== false));
    usort($products, static function (array $a, array $b): int {
        return ((int) ($b['isFeatured'] ?? false) <=> (int) ($a['isFeatured'] ?? false))
            ?: strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
    });

    return array_map(static function (array $product): array {
        unset($product['isActive'], $product['createdAt']);
        $product['salePrice'] = $product['salePrice'] ?? null;
        $product['isNew'] = (bool) ($product['isNew'] ?? false);
        $product['isFeatured'] = (bool) ($product['isFeatured'] ?? false);
        return $product;
    }, $products);
}

function get_categories(): array
{
    if (database_mode() === 'mysql') {
        $rows = db()->query('SELECT id, name, slug, image_url FROM categories ORDER BY name ASC')->fetchAll();
        return array_map(static fn (array $row): array => [
            'id' => $row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
            'imageUrl' => $row['image_url'],
        ], $rows);
    }

    $categories = read_json_store()['categories'] ?? [];
    usort($categories, static fn (array $a, array $b): int => strcmp($a['name'], $b['name']));
    return $categories;
}

function get_settings(): array
{
    if (database_mode() === 'mysql') {
        $settings = db()->query('SELECT * FROM store_settings WHERE id = 1 LIMIT 1')->fetch();
        $banners = db()->query(
            'SELECT b.*, c.name AS category_name
             FROM banners b
             LEFT JOIN categories c ON c.id = b.category_id
             WHERE b.is_active = 1
             ORDER BY b.display_order ASC, b.id ASC'
        )->fetchAll();

        return [
            'hero' => [
                'title' => $settings['hero_title'],
                'subtitle' => $settings['hero_subtitle'],
                'imageUrl' => $settings['hero_image_url'],
            ],
            'banners' => array_map(static fn (array $banner): array => [
                'id' => $banner['id'],
                'title' => $banner['title'],
                'subtitle' => $banner['subtitle'],
                'buttonText' => $banner['button_text'],
                'imageUrl' => $banner['image_url'],
                'categoryLink' => $banner['category_name'],
            ], $banners),
            'aboutText' => $settings['about_text'],
            'contactEmail' => $settings['contact_email'],
        ];
    }

    return read_json_store()['settings'] ?? [];
}

function get_orders(): array
{
    if (database_mode() === 'mysql') {
        $rows = db()->query('SELECT * FROM orders ORDER BY created_at DESC')->fetchAll();
        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'order_number' => $row['order_number'],
            'customer_name' => $row['customer_name'],
            'customer_email' => $row['customer_email'],
            'address' => $row['address'],
            'city' => $row['city'],
            'zip' => $row['zip'],
            'status' => $row['status'],
            'payment_status' => $row['payment_status'],
            'total' => (float) $row['total'],
            'created_at' => $row['created_at'],
            'cancellation_reason' => $row['cancellation_reason'],
            'refund_amount' => $row['refund_amount'] !== null ? (float) $row['refund_amount'] : null,
            'cancelled_at' => $row['cancelled_at'],
        ], $rows);
    }

    $orders = read_json_store()['orders'] ?? [];
    usort($orders, static fn (array $a, array $b): int => strcmp($b['created_at'], $a['created_at']));
    return $orders;
}

function format_currency(float $value): string
{
    return number_format($value, 2, '.', '');
}

function build_reports(array $orders): array
{
    $now = new DateTimeImmutable('now');
    $periods = [
        ['id' => 'pr-day', 'periodType' => 'day', 'periodLabel' => 'Día (Hoy)', 'start' => $now->setTime(0, 0)],
        ['id' => 'pr-week', 'periodType' => 'week', 'periodLabel' => 'Semana actual', 'start' => $now->modify('monday this week')->setTime(0, 0)],
        ['id' => 'pr-month', 'periodType' => 'month', 'periodLabel' => 'Mes actual', 'start' => $now->modify('first day of this month')->setTime(0, 0)],
        ['id' => 'pr-bimester', 'periodType' => 'bimester', 'periodLabel' => 'Bimestre actual', 'start' => (new DateTimeImmutable(sprintf('%s-%02d-01 00:00:00', $now->format('Y'), ((int) floor(((int) $now->format('n') - 1) / 2) * 2) + 1)))],
        ['id' => 'pr-quarter', 'periodType' => 'quarter', 'periodLabel' => 'Trimestre actual', 'start' => (new DateTimeImmutable(sprintf('%s-%02d-01 00:00:00', $now->format('Y'), ((int) floor(((int) $now->format('n') - 1) / 3) * 3) + 1)))],
        ['id' => 'pr-semester', 'periodType' => 'semester', 'periodLabel' => 'Semestre actual', 'start' => (new DateTimeImmutable(sprintf('%s-%02d-01 00:00:00', $now->format('Y'), (int) $now->format('n') < 7 ? 1 : 7)))],
        ['id' => 'pr-year', 'periodType' => 'year', 'periodLabel' => 'Año actual', 'start' => $now->setDate((int) $now->format('Y'), 1, 1)->setTime(0, 0)],
    ];

    return array_map(static function (array $period) use ($orders): array {
        $periodOrders = array_values(array_filter($orders, static fn (array $order): bool => new DateTimeImmutable($order['created_at']) >= $period['start']));
        $cancelledOrders = array_values(array_filter($periodOrders, static fn (array $order): bool => ($order['status'] ?? '') === 'cancelled'));
        $grossSales = array_reduce($periodOrders, static fn (float $sum, array $order): float => $sum + (float) $order['total'], 0.0);
        $refunds = array_reduce($cancelledOrders, static fn (float $sum, array $order): float => $sum + (float) ($order['refund_amount'] ?? 0), 0.0);

        return [
            'id' => $period['id'],
            'periodType' => $period['periodType'],
            'periodLabel' => $period['periodLabel'],
            'totalPurchases' => count($periodOrders),
            'cancelledPurchases' => count($cancelledOrders),
            'grossSales' => $grossSales,
            'netSales' => $grossSales - $refunds,
        ];
    }, $periods);
}

function get_dashboard(): array
{
    $orders = get_orders();
    $products = get_products();
    $today = (new DateTimeImmutable('now'))->format('Y-m-d');

    return [
        'stats' => [
            'totalSales' => format_currency(array_reduce(array_filter($orders, static fn (array $order): bool => ($order['status'] ?? '') !== 'cancelled'), static fn (float $sum, array $order): float => $sum + (float) $order['total'], 0.0)),
            'ordersToday' => count(array_filter($orders, static fn (array $order): bool => str_starts_with($order['created_at'], $today))),
            'products' => count($products),
            'lowStock' => count(array_filter($products, static fn (array $product): bool => ((int) $product['stock']) <= 5)),
        ],
        'purchaseHistory' => array_map(static fn (array $order): array => [
            'id' => (string) $order['id'],
            'orderId' => $order['order_number'],
            'customer' => $order['customer_name'],
            'status' => $order['status'],
            'paymentStatus' => $order['payment_status'],
            'total' => (float) $order['total'],
            'purchasedAt' => $order['created_at'],
        ], $orders),
        'cancelledPurchases' => array_map(static fn (array $order): array => [
            'id' => 'cancel-' . $order['id'],
            'orderId' => $order['order_number'],
            'customer' => $order['customer_name'],
            'reason' => $order['cancellation_reason'] ?: 'Sin motivo registrado',
            'cancelledAt' => $order['cancelled_at'] ?: $order['created_at'],
            'refundAmount' => (float) ($order['refund_amount'] ?? 0),
        ], array_values(array_filter($orders, static fn (array $order): bool => ($order['status'] ?? '') === 'cancelled'))),
        'purchaseReports' => build_reports($orders),
    ];
}

function get_bootstrap_payload(): array
{
    return [
        'categories' => get_categories(),
        'products' => get_products(),
        'settings' => get_settings(),
        'dashboard' => get_dashboard(),
    ];
}

function login_admin(string $email, string $password): ?array
{
    if (database_mode() === 'mysql') {
        $statement = db()->prepare('SELECT id, email, name, role FROM admin_users WHERE email = :email AND password = :password LIMIT 1');
        $statement->execute(['email' => $email, 'password' => $password]);
        $user = $statement->fetch();
        if (!$user) {
            return null;
        }

        return [
            'id' => (int) $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
        ];
    }

    $store = read_json_store();
    foreach ($store['adminUsers'] ?? [] as $user) {
        if (($user['email'] ?? '') === $email && ($user['password'] ?? '') === $password) {
            return [
                'id' => (int) $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
            ];
        }
    }

    return null;
}

function create_order(array $payload): array
{
    $customerName = trim(($payload['firstName'] ?? '') . ' ' . ($payload['lastName'] ?? ''));
    $items = $payload['items'] ?? [];
    $total = array_reduce($items, static fn (float $sum, array $item): float => $sum + ((float) $item['price'] * (int) $item['quantity']), 0.0);

    if (database_mode() === 'mysql') {
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $nextId = (int) $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM orders')->fetchColumn();
            $orderNumber = sprintf('DR-%s-%05d', (new DateTimeImmutable('now'))->format('Y'), $nextId);

            $statement = $pdo->prepare('INSERT INTO orders (id, order_number, customer_name, customer_email, address, city, zip, status, payment_status, total, created_at, cancellation_reason, refund_amount, cancelled_at) VALUES (:id, :order_number, :customer_name, :customer_email, :address, :city, :zip, :status, :payment_status, :total, :created_at, NULL, NULL, NULL)');
            $statement->execute([
                'id' => $nextId,
                'order_number' => $orderNumber,
                'customer_name' => $customerName,
                'customer_email' => $payload['email'] ?? '',
                'address' => $payload['address'] ?? '',
                'city' => $payload['city'] ?? '',
                'zip' => $payload['zip'] ?? '',
                'status' => 'paid',
                'payment_status' => 'paid',
                'total' => $total,
                'created_at' => (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM),
            ]);

            $insertItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, product_name, price, quantity, selected_size, selected_color) VALUES (:order_id, :product_id, :product_name, :price, :quantity, :selected_size, :selected_color)');
            $updateStock = $pdo->prepare('UPDATE products SET stock = GREATEST(stock - :quantity, 0), updated_at = CURRENT_TIMESTAMP WHERE id = :product_id');

            foreach ($items as $item) {
                $insertItem->execute([
                    'order_id' => $nextId,
                    'product_id' => $item['id'],
                    'product_name' => $item['name'],
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'selected_size' => $item['selectedSize'] ?? null,
                    'selected_color' => $item['selectedColor'] ?? null,
                ]);
                $updateStock->execute([
                    'quantity' => (int) $item['quantity'],
                    'product_id' => $item['id'],
                ]);
            }

            $pdo->commit();
            return ['orderNumber' => $orderNumber, 'total' => $total];
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }
    }

    $store = read_json_store();
    $currentMaxId = array_reduce($store['orders'] ?? [], static fn (int $max, array $order): int => max($max, (int) $order['id']), 0);
    $nextId = $currentMaxId + 1;
    $orderNumber = sprintf('DR-%s-%05d', (new DateTimeImmutable('now'))->format('Y'), $nextId);
    $store['orders'][] = [
        'id' => $nextId,
        'order_number' => $orderNumber,
        'customer_name' => $customerName,
        'customer_email' => $payload['email'] ?? '',
        'address' => $payload['address'] ?? '',
        'city' => $payload['city'] ?? '',
        'zip' => $payload['zip'] ?? '',
        'status' => 'paid',
        'payment_status' => 'paid',
        'total' => $total,
        'created_at' => (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM),
        'cancellation_reason' => null,
        'refund_amount' => null,
        'cancelled_at' => null,
    ];

    foreach ($items as $item) {
        $store['orderItems'][] = [
            'orderId' => $nextId,
            'productId' => $item['id'],
            'productName' => $item['name'],
            'price' => $item['price'],
            'quantity' => $item['quantity'],
            'selectedSize' => $item['selectedSize'] ?? null,
            'selectedColor' => $item['selectedColor'] ?? null,
        ];

        foreach ($store['products'] as &$product) {
            if (($product['id'] ?? '') === ($item['id'] ?? '')) {
                $product['stock'] = max((int) $product['stock'] - (int) $item['quantity'], 0);
            }
        }
        unset($product);
    }

    write_json_store($store);
    return ['orderNumber' => $orderNumber, 'total' => $total];
}

function category_id_by_name(?string $name): ?string
{
    if ($name === null || trim($name) === '') {
        return null;
    }

    $statement = db()->prepare('SELECT id FROM categories WHERE name = :name LIMIT 1');
    $statement->execute(['name' => $name]);
    $categoryId = $statement->fetchColumn();
    return $categoryId === false ? null : (string) $categoryId;
}

function save_store_settings(array $payload): array
{
    if (database_mode() === 'mysql') {
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $hero = $payload['hero'] ?? [];
            $statement = $pdo->prepare(
                'INSERT INTO store_settings (id, hero_title, hero_subtitle, hero_image_url, about_text, contact_email, updated_at)
                 VALUES (1, :title, :subtitle, :image_url, :about_text, :contact_email, CURRENT_TIMESTAMP)
                 ON DUPLICATE KEY UPDATE hero_title = VALUES(hero_title), hero_subtitle = VALUES(hero_subtitle), hero_image_url = VALUES(hero_image_url), about_text = VALUES(about_text), contact_email = VALUES(contact_email), updated_at = CURRENT_TIMESTAMP'
            );
            $statement->execute([
                'title' => $hero['title'] ?? '',
                'subtitle' => $hero['subtitle'] ?? '',
                'image_url' => $hero['imageUrl'] ?? '',
                'about_text' => $payload['aboutText'] ?? '',
                'contact_email' => $payload['contactEmail'] ?? '',
            ]);

            $pdo->exec('DELETE FROM banners');
            $insertBanner = $pdo->prepare('INSERT INTO banners (id, title, subtitle, button_text, image_url, category_id, display_order, is_active) VALUES (:id, :title, :subtitle, :button_text, :image_url, :category_id, :display_order, 1)');
            foreach (($payload['banners'] ?? []) as $index => $banner) {
                $insertBanner->execute([
                    'id' => $banner['id'] ?? ('b' . ($index + 1)),
                    'title' => $banner['title'] ?? '',
                    'subtitle' => $banner['subtitle'] ?? '',
                    'button_text' => $banner['buttonText'] ?? '',
                    'image_url' => $banner['imageUrl'] ?? '',
                    'category_id' => category_id_by_name($banner['categoryLink'] ?? null),
                    'display_order' => $index,
                ]);
            }

            $pdo->commit();
            return get_settings();
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }
    }

    $store = read_json_store();
    $store['settings'] = [
        'hero' => [
            'title' => $payload['hero']['title'] ?? '',
            'subtitle' => $payload['hero']['subtitle'] ?? '',
            'imageUrl' => $payload['hero']['imageUrl'] ?? '',
        ],
        'banners' => array_map(static fn (array $banner, int $index): array => [
            'id' => $banner['id'] ?? ('b' . ($index + 1)),
            'title' => $banner['title'] ?? '',
            'subtitle' => $banner['subtitle'] ?? '',
            'buttonText' => $banner['buttonText'] ?? '',
            'imageUrl' => $banner['imageUrl'] ?? '',
            'categoryLink' => $banner['categoryLink'] ?? '',
        ], $payload['banners'] ?? [], array_keys($payload['banners'] ?? [])),
        'aboutText' => $payload['aboutText'] ?? '',
        'contactEmail' => $payload['contactEmail'] ?? '',
    ];
    write_json_store($store);
    return $store['settings'];
}

function swagger_spec(): array
{
    return [
        'openapi' => '3.0.3',
        'info' => [
            'title' => 'Dark Ranch Local API',
            'version' => '1.0.0',
            'description' => 'API local para Dark Ranch con soporte para JSON o MySQL (XAMPP).',
        ],
        'servers' => [[
            'url' => sprintf('%s://%s', (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http', $_SERVER['HTTP_HOST'] ?? 'localhost:3001'),
        ]],
        'paths' => [
            '/api/health' => ['get' => ['summary' => 'Estado del API', 'responses' => ['200' => ['description' => 'OK']]]],
            '/api/bootstrap' => ['get' => ['summary' => 'Carga inicial de tienda y dashboard', 'responses' => ['200' => ['description' => 'Bootstrap data']]]],
            '/api/login' => ['post' => ['summary' => 'Login de administrador', 'requestBody' => ['required' => true], 'responses' => ['200' => ['description' => 'Login correcto'], '401' => ['description' => 'Credenciales inválidas']]]],
            '/api/orders' => ['post' => ['summary' => 'Crear orden', 'requestBody' => ['required' => true], 'responses' => ['201' => ['description' => 'Orden creada']]]],
            '/api/settings' => ['put' => ['summary' => 'Actualizar settings', 'requestBody' => ['required' => true], 'responses' => ['200' => ['description' => 'Settings actualizados']]]],
        ],
    ];
}

function swagger_html(): string
{
    return <<<'HTML'
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dark Ranch API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #111827; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/docs.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
      });
    </script>
  </body>
</html>
HTML;
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET' && $path === '/api/docs') {
        html_response(swagger_html());
    }

    if ($method === 'GET' && $path === '/api/docs.json') {
        json_response(200, swagger_spec());
    }

    if ($method === 'GET' && $path === '/api/health') {
        $payload = [
            'ok' => true,
            'database' => database_mode(),
            'docs' => '/api/docs',
        ];
        if (database_mode() === 'mysql') {
            $payload['mysql'] = ['connected' => true];
            db();
        } else {
            $payload['jsonFile'] = basename(data_store_path());
        }
        json_response(200, $payload);
    }

    if ($method === 'GET' && $path === '/api/bootstrap') {
        json_response(200, get_bootstrap_payload());
    }

    if ($method === 'POST' && $path === '/api/login') {
        $body = read_json_body();
        $user = login_admin((string) ($body['email'] ?? ''), (string) ($body['password'] ?? ''));
        if ($user === null) {
            json_response(401, ['message' => 'Credenciales inválidas']);
        }
        json_response(200, ['user' => $user]);
    }

    if ($method === 'POST' && $path === '/api/orders') {
        $body = read_json_body();
        if (empty($body['items']) || !is_array($body['items'])) {
            json_response(400, ['message' => 'El carrito está vacío']);
        }

        $order = create_order($body);
        json_response(201, ['order' => $order, 'dashboard' => get_dashboard(), 'products' => get_products()]);
    }

    if ($method === 'PUT' && $path === '/api/settings') {
        $body = read_json_body();
        $settings = save_store_settings($body);
        json_response(200, ['settings' => $settings]);
    }

    json_response(404, ['message' => sprintf('Ruta no encontrada: %s %s', $method, $path)]);
} catch (Throwable $exception) {
    json_response(500, ['message' => 'Error interno del servidor', 'detail' => $exception->getMessage()]);
}
