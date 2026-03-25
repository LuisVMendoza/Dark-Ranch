<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Actor-Id, X-Admin-Actor-Name, X-Admin-Actor-Email, X-Admin-Actor-Role');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
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
            $value = trim(trim($value), "\"'");

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

function expected_runtime_status(Throwable $exception): ?int
{
    if (!($exception instanceof RuntimeException)) {
        return null;
    }

    $message = mb_strtolower($exception->getMessage());
    if (str_contains($message, 'no encontrado') || str_contains($message, 'no encontrada')) {
        return 404;
    }
    if (str_contains($message, 'no se puede eliminar')) {
        return 409;
    }

    return 422;
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

function sanitize_upload_folder(string $folder): string
{
    $clean = trim($folder);
    $clean = str_replace('\\', '/', $clean);
    $clean = preg_replace('/[^a-zA-Z0-9_\/-]/', '', $clean) ?? '';
    $clean = trim((string) $clean, '/');
    return $clean !== '' ? $clean : 'general';
}

function upload_public_url(string $relativePath): string
{
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:3001';
    return sprintf('%s://%s/%s', $scheme, $host, ltrim($relativePath, '/'));
}

function save_admin_uploaded_image(): array
{
    if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
        throw new RuntimeException('No se recibió ninguna imagen.');
    }

    $file = $_FILES['image'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('No se pudo subir la imagen.');
    }

    $tmpPath = (string) ($file['tmp_name'] ?? '');
    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        throw new RuntimeException('Archivo inválido.');
    }

    $mime = mime_content_type($tmpPath) ?: '';
    if (!str_starts_with($mime, 'image/')) {
        throw new RuntimeException('Solo se permiten archivos de imagen.');
    }

    $maxBytes = 6 * 1024 * 1024;
    if ((int) ($file['size'] ?? 0) > $maxBytes) {
        throw new RuntimeException('La imagen excede el tamaño máximo de 6MB.');
    }

    $folder = sanitize_upload_folder((string) ($_POST['folder'] ?? 'general'));
    $extension = pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION);
    $extension = strtolower($extension !== '' ? $extension : 'jpg');
    $fileName = sprintf('%s-%s.%s', date('YmdHis'), bin2hex(random_bytes(4)), $extension);

    $relativeDir = 'uploads/' . $folder;
    $absoluteDir = base_path('server/' . $relativeDir);
    if (!is_dir($absoluteDir) && !mkdir($absoluteDir, 0777, true) && !is_dir($absoluteDir)) {
        throw new RuntimeException('No se pudo preparar el directorio de carga.');
    }

    $absolutePath = $absoluteDir . '/' . $fileName;
    if (!move_uploaded_file($tmpPath, $absolutePath)) {
        throw new RuntimeException('No se pudo guardar la imagen.');
    }

    $relativePath = $relativeDir . '/' . $fileName;
    return ['url' => upload_public_url($relativePath)];
}

function delete_admin_uploaded_image(array $payload): void
{
    $url = trim((string) ($payload['url'] ?? ''));
    if ($url === '') {
        throw new RuntimeException('URL de imagen inválida.');
    }

    $path = parse_url($url, PHP_URL_PATH);
    if (!is_string($path) || !str_starts_with($path, '/uploads/')) {
        return;
    }

    $relativePath = ltrim($path, '/');
    $absolutePath = base_path('server/' . $relativePath);
    if (is_file($absolutePath)) {
        @unlink($absolutePath);
    }
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

    $payload['categories'] = $payload['categories'] ?? [];
    $payload['products'] = $payload['products'] ?? [];
    $payload['orders'] = $payload['orders'] ?? [];
    $payload['orderItems'] = $payload['orderItems'] ?? [];
    $payload['adminUsers'] = $payload['adminUsers'] ?? [];
    $payload['activityLogs'] = $payload['activityLogs'] ?? [];
    $payload['settings'] = $payload['settings'] ?? [];

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

function normalize_list(mixed $value): array
{
    if (is_array($value)) {
        return array_values(array_filter(array_map(static fn ($item) => trim((string) $item), $value), static fn (string $item): bool => $item !== ''));
    }

    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    return array_values(array_filter(array_map('trim', explode(',', $value)), static fn (string $item): bool => $item !== ''));
}

function slugify(string $value): string
{
    $value = trim(mb_strtolower($value));
    $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
    if (is_string($transliterated)) {
        $value = $transliterated;
    }
    $value = preg_replace('/[^a-z0-9]+/i', '-', $value) ?? '';
    $value = trim($value, '-');
    return $value !== '' ? $value : 'item';
}

function next_incremental_id(array $ids, string $prefix): string
{
    $max = 0;

    foreach ($ids as $id) {
        if (preg_match('/^' . preg_quote($prefix, '/') . '(\d+)$/', (string) $id, $matches) === 1) {
            $max = max($max, (int) $matches[1]);
        }
    }

    return $prefix . str_pad((string) ($max + 1), 3, '0', STR_PAD_LEFT);
}

function generate_product_id(): string
{
    if (database_mode() === 'mysql') {
        $ids = db()->query('SELECT id FROM products')->fetchAll(PDO::FETCH_COLUMN) ?: [];
        return next_incremental_id($ids, 'dr-');
    }

    $store = read_json_store();
    return next_incremental_id(array_column($store['products'] ?? [], 'id'), 'dr-');
}

function generate_category_id(): string
{
    if (database_mode() === 'mysql') {
        $ids = db()->query('SELECT id FROM categories')->fetchAll(PDO::FETCH_COLUMN) ?: [];
        return next_incremental_id($ids, 'cat-');
    }

    $store = read_json_store();
    return next_incremental_id(array_column($store['categories'] ?? [], 'id'), 'cat-');
}

function category_to_client(array $category): array
{
    return [
        'id' => (string) $category['id'],
        'name' => (string) $category['name'],
        'slug' => (string) $category['slug'],
        'imageUrl' => (string) $category['imageUrl'],
    ];
}

function product_to_client(array $product): array
{
    return [
        'id' => (string) $product['id'],
        'name' => (string) $product['name'],
        'slug' => (string) $product['slug'],
        'description' => (string) $product['description'],
        'price' => (float) $product['price'],
        'salePrice' => $product['salePrice'] !== null ? (float) $product['salePrice'] : null,
        'category' => (string) $product['category'],
        'categoryId' => (string) $product['categoryId'],
        'images' => array_values($product['images']),
        'sizes' => array_values($product['sizes']),
        'colors' => array_values($product['colors']),
        'tags' => array_values($product['tags']),
        'stock' => (int) $product['stock'],
        'isNew' => (bool) $product['isNew'],
        'isFeatured' => (bool) $product['isFeatured'],
        'isActive' => (bool) $product['isActive'],
        'createdAt' => (string) $product['createdAt'],
    ];
}

function order_item_to_client(array $item): array
{
    return [
        'productId' => (string) $item['productId'],
        'productName' => (string) $item['productName'],
        'price' => (float) $item['price'],
        'quantity' => (int) $item['quantity'],
        'selectedSize' => $item['selectedSize'] !== null ? (string) $item['selectedSize'] : null,
        'selectedColor' => $item['selectedColor'] !== null ? (string) $item['selectedColor'] : null,
    ];
}

function order_to_client(array $order, array $items = []): array
{
    return [
        'id' => (int) $order['id'],
        'orderNumber' => (string) $order['order_number'],
        'customerName' => (string) $order['customer_name'],
        'customerEmail' => (string) $order['customer_email'],
        'address' => (string) $order['address'],
        'city' => (string) $order['city'],
        'zip' => (string) $order['zip'],
        'status' => (string) $order['status'],
        'paymentStatus' => (string) $order['payment_status'],
        'total' => (float) $order['total'],
        'createdAt' => (string) $order['created_at'],
        'cancellationReason' => $order['cancellation_reason'] !== null ? (string) $order['cancellation_reason'] : null,
        'refundAmount' => $order['refund_amount'] !== null ? (float) $order['refund_amount'] : null,
        'cancelledAt' => $order['cancelled_at'] !== null ? (string) $order['cancelled_at'] : null,
        'items' => array_map('order_item_to_client', $items),
    ];
}

function admin_user_to_client(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'email' => (string) $user['email'],
        'name' => (string) $user['name'],
        'role' => normalize_admin_role((string) ($user['role'] ?? 'editor')),
    ];
}

function normalize_admin_role(string $role): string
{
    return $role === 'admin' ? 'admin' : 'editor';
}

function activity_log_to_client(array $log): array
{
    return [
        'id' => $log['id'],
        'actorId' => $log['actorId'] !== null ? (int) $log['actorId'] : null,
        'actorName' => (string) $log['actorName'],
        'actorEmail' => (string) $log['actorEmail'],
        'actorRole' => (string) $log['actorRole'],
        'action' => (string) $log['action'],
        'entityType' => (string) $log['entityType'],
        'entityId' => (string) $log['entityId'],
        'entityName' => (string) $log['entityName'],
        'details' => (string) $log['details'],
        'createdAt' => (string) $log['createdAt'],
    ];
}

function current_actor_from_request(): array
{
    return [
        'id' => isset($_SERVER['HTTP_X_ADMIN_ACTOR_ID']) && $_SERVER['HTTP_X_ADMIN_ACTOR_ID'] !== '' ? (int) $_SERVER['HTTP_X_ADMIN_ACTOR_ID'] : null,
        'name' => trim((string) ($_SERVER['HTTP_X_ADMIN_ACTOR_NAME'] ?? '')) ?: 'Sistema',
        'email' => trim((string) ($_SERVER['HTTP_X_ADMIN_ACTOR_EMAIL'] ?? '')) ?: 'system@darkranch.local',
        'role' => normalize_admin_role(trim((string) ($_SERVER['HTTP_X_ADMIN_ACTOR_ROLE'] ?? '')) ?: 'editor'),
    ];
}

function ensure_admin_actor(): void
{
    $actor = current_actor_from_request();
    if (($actor['role'] ?? 'editor') !== 'admin') {
        throw new RuntimeException('Solo un admin puede editar o eliminar permisos.');
    }
}

function next_activity_log_id_json(array $store): int
{
    return array_reduce($store['activityLogs'] ?? [], static fn (int $max, array $log): int => max($max, (int) ($log['id'] ?? 0)), 0) + 1;
}

function log_activity(string $action, string $entityType, string $entityId, string $entityName, string $details): void
{
    $actor = current_actor_from_request();
    $createdAt = (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM);

    if (database_mode() === 'mysql') {
        $insert = db()->prepare(
            'INSERT INTO admin_activity_logs (actor_id, actor_name, actor_email, actor_role, action, entity_type, entity_id, entity_name, details, created_at)
             VALUES (:actor_id, :actor_name, :actor_email, :actor_role, :action, :entity_type, :entity_id, :entity_name, :details, :created_at)'
        );
        $insert->execute([
            'actor_id' => $actor['id'],
            'actor_name' => $actor['name'],
            'actor_email' => $actor['email'],
            'actor_role' => $actor['role'],
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'entity_name' => $entityName,
            'details' => $details,
            'created_at' => $createdAt,
        ]);
        return;
    }

    $store = read_json_store();
    $store['activityLogs'][] = [
        'id' => next_activity_log_id_json($store),
        'actorId' => $actor['id'],
        'actorName' => $actor['name'],
        'actorEmail' => $actor['email'],
        'actorRole' => $actor['role'],
        'action' => $action,
        'entityType' => $entityType,
        'entityId' => $entityId,
        'entityName' => $entityName,
        'details' => $details,
        'createdAt' => $createdAt,
    ];
    write_json_store($store);
}

function get_activity_logs(): array
{
    if (database_mode() === 'mysql') {
        $rows = db()->query('SELECT id, actor_id, actor_name, actor_email, actor_role, action, entity_type, entity_id, entity_name, details, created_at FROM admin_activity_logs ORDER BY created_at DESC, id DESC')->fetchAll();
        return array_map(static fn (array $row): array => activity_log_to_client([
            'id' => (int) $row['id'],
            'actorId' => $row['actor_id'] !== null ? (int) $row['actor_id'] : null,
            'actorName' => $row['actor_name'],
            'actorEmail' => $row['actor_email'],
            'actorRole' => $row['actor_role'],
            'action' => $row['action'],
            'entityType' => $row['entity_type'],
            'entityId' => $row['entity_id'],
            'entityName' => $row['entity_name'],
            'details' => $row['details'],
            'createdAt' => $row['created_at'],
        ]), $rows);
    }

    $logs = array_map('activity_log_to_client', read_json_store()['activityLogs']);
    usort($logs, static fn (array $a, array $b): int => strcmp($b['createdAt'], $a['createdAt']));
    return $logs;
}

function purge_activity_logs(int $retentionMonths): array
{
    if ($retentionMonths < 1 || $retentionMonths > 60) {
        throw new RuntimeException('La retención debe estar entre 1 y 60 meses.', 422);
    }

    $cutoff = (new DateTimeImmutable('now'))->modify(sprintf('-%d months', $retentionMonths));
    $cutoffIso = $cutoff->format(DateTimeInterface::ATOM);

    if (database_mode() === 'mysql') {
        $delete = db()->prepare('DELETE FROM admin_activity_logs WHERE created_at < :cutoff');
        $delete->execute(['cutoff' => $cutoffIso]);

        return [
            'ok' => true,
            'deleted' => $delete->rowCount(),
            'retentionMonths' => $retentionMonths,
            'cutoffDate' => $cutoffIso,
        ];
    }

    $store = read_json_store();
    $logs = $store['activityLogs'] ?? [];
    $before = count($logs);

    $store['activityLogs'] = array_values(array_filter($logs, static function (array $item) use ($cutoff): bool {
        try {
            $createdAt = new DateTimeImmutable((string) ($item['createdAt'] ?? ''));
            return $createdAt >= $cutoff;
        } catch (Throwable) {
            return true;
        }
    }));

    write_json_store($store);

    return [
        'ok' => true,
        'deleted' => $before - count($store['activityLogs']),
        'retentionMonths' => $retentionMonths,
        'cutoffDate' => $cutoffIso,
    ];
}

function format_product_row(array $row): array
{
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'slug' => $row['slug'],
        'description' => $row['description'],
        'price' => (float) $row['price'],
        'salePrice' => $row['sale_price'] !== null ? (float) $row['sale_price'] : null,
        'category' => $row['category_name'],
        'categoryId' => $row['category_id'],
        'images' => json_decode($row['images_json'] ?? '[]', true) ?: [],
        'sizes' => json_decode($row['sizes_json'] ?? '[]', true) ?: [],
        'colors' => json_decode($row['colors_json'] ?? '[]', true) ?: [],
        'tags' => json_decode($row['tags_json'] ?? '[]', true) ?: [],
        'stock' => (int) $row['stock'],
        'isNew' => (bool) $row['is_new'],
        'isFeatured' => (bool) $row['is_featured'],
        'isActive' => (bool) $row['is_active'],
        'createdAt' => (string) $row['created_at'],
    ];
}

function get_categories(): array
{
    if (database_mode() === 'mysql') {
        $rows = db()->query('SELECT id, name, slug, image_url FROM categories ORDER BY name ASC')->fetchAll();
        return array_map(static fn (array $row): array => category_to_client([
            'id' => $row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
            'imageUrl' => $row['image_url'],
        ]), $rows);
    }

    $categories = array_map('category_to_client', read_json_store()['categories']);
    usort($categories, static fn (array $a, array $b): int => strcmp($a['name'], $b['name']));
    return $categories;
}

function get_admin_products(bool $includeInactive = true): array
{
    if (database_mode() === 'mysql') {
        $sql = 'SELECT p.*, c.name AS category_name FROM products p INNER JOIN categories c ON c.id = p.category_id';
        if (!$includeInactive) {
            $sql .= ' WHERE p.is_active = 1';
        }
        $sql .= ' ORDER BY p.is_featured DESC, p.created_at DESC';
        $rows = db()->query($sql)->fetchAll();
        return array_map(static fn (array $row): array => product_to_client(format_product_row($row)), $rows);
    }

    $store = read_json_store();
    $categoriesByName = [];
    foreach ($store['categories'] as $category) {
        $categoriesByName[$category['name']] = $category['id'];
        $categoriesByName[$category['id']] = $category['id'];
    }

    $products = [];
    foreach ($store['products'] as $product) {
        $isActive = ($product['isActive'] ?? true) !== false;
        if (!$includeInactive && !$isActive) {
            continue;
        }

        $products[] = product_to_client([
            'id' => $product['id'],
            'name' => $product['name'],
            'slug' => $product['slug'],
            'description' => $product['description'],
            'price' => (float) $product['price'],
            'salePrice' => $product['salePrice'] ?? null,
            'category' => $product['category'],
            'categoryId' => $categoriesByName[$product['category']] ?? ($product['categoryId'] ?? ''),
            'images' => $product['images'] ?? [],
            'sizes' => $product['sizes'] ?? [],
            'colors' => $product['colors'] ?? [],
            'tags' => $product['tags'] ?? [],
            'stock' => (int) ($product['stock'] ?? 0),
            'isNew' => (bool) ($product['isNew'] ?? false),
            'isFeatured' => (bool) ($product['isFeatured'] ?? false),
            'isActive' => $isActive,
            'createdAt' => $product['createdAt'] ?? (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM),
        ]);
    }

    usort($products, static fn (array $a, array $b): int => ((int) $b['isFeatured'] <=> (int) $a['isFeatured']) ?: strcmp($b['createdAt'], $a['createdAt']));
    return $products;
}

function get_products(): array
{
    return get_admin_products(false);
}

function get_settings(): array
{
    if (database_mode() === 'mysql') {
        $settings = db()->query('SELECT * FROM store_settings WHERE id = 1 LIMIT 1')->fetch();
        if (!$settings) {
            return [
                'hero' => ['title' => '', 'subtitle' => '', 'imageUrl' => ''],
                'banners' => [],
                'aboutText' => '',
                'contactEmail' => '',
            ];
        }

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
                'categoryLink' => $banner['category_name'] ?? '',
            ], $banners),
            'aboutText' => $settings['about_text'],
            'contactEmail' => $settings['contact_email'],
        ];
    }

    return read_json_store()['settings'];
}

function get_order_items_map(): array
{
    if (database_mode() === 'mysql') {
        $rows = db()->query('SELECT order_id, product_id, product_name, price, quantity, selected_size, selected_color FROM order_items ORDER BY id ASC')->fetchAll();
        $map = [];
        foreach ($rows as $row) {
            $orderId = (int) $row['order_id'];
            $map[$orderId] ??= [];
            $map[$orderId][] = [
                'productId' => $row['product_id'],
                'productName' => $row['product_name'],
                'price' => (float) $row['price'],
                'quantity' => (int) $row['quantity'],
                'selectedSize' => $row['selected_size'],
                'selectedColor' => $row['selected_color'],
            ];
        }
        return $map;
    }

    $map = [];
    foreach (read_json_store()['orderItems'] as $item) {
        $orderId = (int) $item['orderId'];
        $map[$orderId] ??= [];
        $map[$orderId][] = [
            'productId' => $item['productId'],
            'productName' => $item['productName'],
            'price' => (float) $item['price'],
            'quantity' => (int) $item['quantity'],
            'selectedSize' => $item['selectedSize'] ?? null,
            'selectedColor' => $item['selectedColor'] ?? null,
        ];
    }
    return $map;
}

function get_admin_orders(): array
{
    if (database_mode() === 'mysql') {
        $rows = db()->query('SELECT * FROM orders ORDER BY created_at DESC')->fetchAll();
        $itemsMap = get_order_items_map();
        return array_map(static fn (array $row): array => order_to_client($row, $itemsMap[(int) $row['id']] ?? []), $rows);
    }

    $store = read_json_store();
    $itemsMap = get_order_items_map();
    $orders = array_map(static fn (array $row): array => order_to_client($row, $itemsMap[(int) $row['id']] ?? []), $store['orders']);
    usort($orders, static fn (array $a, array $b): int => strcmp($b['createdAt'], $a['createdAt']));
    return $orders;
}

function get_orders(): array
{
    return array_map(static fn (array $order): array => [
        'id' => $order['id'],
        'order_number' => $order['orderNumber'],
        'customer_name' => $order['customerName'],
        'customer_email' => $order['customerEmail'],
        'address' => $order['address'],
        'city' => $order['city'],
        'zip' => $order['zip'],
        'status' => $order['status'],
        'payment_status' => $order['paymentStatus'],
        'total' => $order['total'],
        'created_at' => $order['createdAt'],
        'cancellation_reason' => $order['cancellationReason'],
        'refund_amount' => $order['refundAmount'],
        'cancelled_at' => $order['cancelledAt'],
    ], get_admin_orders());
}

function get_admin_users(): array
{
    if (database_mode() === 'mysql') {
        $rows = db()->query('SELECT id, email, name, role FROM admin_users ORDER BY created_at DESC, id DESC')->fetchAll();
        return array_map('admin_user_to_client', $rows);
    }

    $users = array_map('admin_user_to_client', read_json_store()['adminUsers']);
    usort($users, static fn (array $a, array $b): int => $b['id'] <=> $a['id']);
    return $users;
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
        ['id' => 'pr-bimester', 'periodType' => 'bimester', 'periodLabel' => 'Bimestre actual', 'start' => new DateTimeImmutable(sprintf('%s-%02d-01 00:00:00', $now->format('Y'), ((int) floor(((int) $now->format('n') - 1) / 2) * 2) + 1))],
        ['id' => 'pr-quarter', 'periodType' => 'quarter', 'periodLabel' => 'Trimestre actual', 'start' => new DateTimeImmutable(sprintf('%s-%02d-01 00:00:00', $now->format('Y'), ((int) floor(((int) $now->format('n') - 1) / 3) * 3) + 1))],
        ['id' => 'pr-semester', 'periodType' => 'semester', 'periodLabel' => 'Semestre actual', 'start' => new DateTimeImmutable(sprintf('%s-%02d-01 00:00:00', $now->format('Y'), (int) $now->format('n') < 7 ? 1 : 7))],
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

function get_admin_snapshot(): array
{
    $actor = current_actor_from_request();
    return [
        'categories' => get_categories(),
        'products' => get_admin_products(true),
        'orders' => get_admin_orders(),
        'adminUsers' => get_admin_users(),
        'activityLogs' => ($actor['role'] ?? 'editor') === 'admin' ? get_activity_logs() : [],
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
        return $user ? admin_user_to_client($user) : null;
    }

    foreach (read_json_store()['adminUsers'] as $user) {
        if (($user['email'] ?? '') === $email && ($user['password'] ?? '') === $password) {
            return admin_user_to_client($user);
        }
    }

    return null;
}

function ensure_category_exists(string $categoryId): array
{
    foreach (get_categories() as $category) {
        if ($category['id'] === $categoryId) {
            return $category;
        }
    }

    throw new RuntimeException('La categoría indicada no existe.');
}

function product_payload_to_record(array $payload, ?string $existingId = null): array
{
    $name = trim((string) ($payload['name'] ?? ''));
    if ($name === '') {
        throw new RuntimeException('El nombre del producto es obligatorio.');
    }

    $categoryId = trim((string) ($payload['categoryId'] ?? ''));
    $category = ensure_category_exists($categoryId);
    $id = trim((string) ($payload['id'] ?? $existingId ?? ''));
    if ($id === '') {
        if ($existingId !== null) {
            throw new RuntimeException('El identificador del producto es obligatorio.');
        }

        $id = generate_product_id();
    }

    return [
        'id' => $id,
        'name' => $name,
        'slug' => trim((string) ($payload['slug'] ?? '')) ?: slugify($name),
        'description' => trim((string) ($payload['description'] ?? '')),
        'price' => (float) ($payload['price'] ?? 0),
        'salePrice' => ($payload['salePrice'] ?? null) !== null && $payload['salePrice'] !== '' ? (float) $payload['salePrice'] : null,
        'categoryId' => $category['id'],
        'category' => $category['name'],
        'images' => normalize_list($payload['images'] ?? []),
        'sizes' => normalize_list($payload['sizes'] ?? []),
        'colors' => normalize_list($payload['colors'] ?? []),
        'tags' => normalize_list($payload['tags'] ?? []),
        'stock' => max((int) ($payload['stock'] ?? 0), 0),
        'isNew' => (bool) ($payload['isNew'] ?? false),
        'isFeatured' => (bool) ($payload['isFeatured'] ?? false),
        'isActive' => (bool) ($payload['isActive'] ?? true),
        'createdAt' => (string) ($payload['createdAt'] ?? (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM)),
    ];
}

function create_admin_product(array $payload): array
{
    $record = product_payload_to_record($payload);

    if (database_mode() === 'mysql') {
        $pdo = db();
        $exists = $pdo->prepare('SELECT COUNT(*) FROM products WHERE id = :id OR slug = :slug');
        $exists->execute(['id' => $record['id'], 'slug' => $record['slug']]);
        if ((int) $exists->fetchColumn() > 0) {
            throw new RuntimeException('Ya existe un producto con ese ID o slug.');
        }

        $statement = $pdo->prepare(
            'INSERT INTO products (id, name, slug, description, price, sale_price, category_id, images_json, sizes_json, colors_json, tags_json, stock, is_new, is_featured, is_active, created_at, updated_at)
             VALUES (:id, :name, :slug, :description, :price, :sale_price, :category_id, :images_json, :sizes_json, :colors_json, :tags_json, :stock, :is_new, :is_featured, :is_active, :created_at, CURRENT_TIMESTAMP)'
        );
        $statement->execute([
            'id' => $record['id'],
            'name' => $record['name'],
            'slug' => $record['slug'],
            'description' => $record['description'],
            'price' => $record['price'],
            'sale_price' => $record['salePrice'],
            'category_id' => $record['categoryId'],
            'images_json' => json_encode($record['images'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'sizes_json' => json_encode($record['sizes'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'colors_json' => json_encode($record['colors'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'tags_json' => json_encode($record['tags'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'stock' => $record['stock'],
            'is_new' => (int) $record['isNew'],
            'is_featured' => (int) $record['isFeatured'],
            'is_active' => (int) $record['isActive'],
            'created_at' => $record['createdAt'],
        ]);
        log_activity('create', 'product', $record['id'], $record['name'], 'Producto creado desde administración.');
        return product_to_client($record);
    }

    $store = read_json_store();
    foreach ($store['products'] as $product) {
        if (($product['id'] ?? '') === $record['id'] || ($product['slug'] ?? '') === $record['slug']) {
            throw new RuntimeException('Ya existe un producto con ese ID o slug.');
        }
    }

    $store['products'][] = [
        'id' => $record['id'],
        'name' => $record['name'],
        'slug' => $record['slug'],
        'description' => $record['description'],
        'price' => $record['price'],
        'salePrice' => $record['salePrice'],
        'category' => $record['category'],
        'images' => $record['images'],
        'sizes' => $record['sizes'],
        'colors' => $record['colors'],
        'tags' => $record['tags'],
        'stock' => $record['stock'],
        'isNew' => $record['isNew'],
        'isFeatured' => $record['isFeatured'],
        'isActive' => $record['isActive'],
        'createdAt' => $record['createdAt'],
    ];
    write_json_store($store);
    log_activity('create', 'product', $record['id'], $record['name'], 'Producto creado desde administración.');

    return product_to_client($record);
}

function update_admin_product(string $id, array $payload): array
{
    if (database_mode() === 'mysql') {
        $statement = db()->prepare('SELECT created_at FROM products WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $existing = $statement->fetch();
        if (!$existing) {
            throw new RuntimeException('Producto no encontrado.');
        }

        $record = product_payload_to_record([...$payload, 'id' => $id, 'createdAt' => $existing['created_at']], $id);
        $conflict = db()->prepare('SELECT COUNT(*) FROM products WHERE slug = :slug AND id <> :id');
        $conflict->execute(['slug' => $record['slug'], 'id' => $id]);
        if ((int) $conflict->fetchColumn() > 0) {
            throw new RuntimeException('Ya existe otro producto con ese slug.');
        }

        $update = db()->prepare(
            'UPDATE products
             SET name = :name, slug = :slug, description = :description, price = :price, sale_price = :sale_price, category_id = :category_id,
                 images_json = :images_json, sizes_json = :sizes_json, colors_json = :colors_json, tags_json = :tags_json,
                 stock = :stock, is_new = :is_new, is_featured = :is_featured, is_active = :is_active, updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $update->execute([
            'id' => $id,
            'name' => $record['name'],
            'slug' => $record['slug'],
            'description' => $record['description'],
            'price' => $record['price'],
            'sale_price' => $record['salePrice'],
            'category_id' => $record['categoryId'],
            'images_json' => json_encode($record['images'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'sizes_json' => json_encode($record['sizes'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'colors_json' => json_encode($record['colors'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'tags_json' => json_encode($record['tags'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'stock' => $record['stock'],
            'is_new' => (int) $record['isNew'],
            'is_featured' => (int) $record['isFeatured'],
            'is_active' => (int) $record['isActive'],
        ]);
        log_activity('update', 'product', $record['id'], $record['name'], 'Producto actualizado desde administración.');
        return product_to_client($record);
    }

    $store = read_json_store();
    $found = false;
    foreach ($store['products'] as $index => $product) {
        if ((string) ($product['id'] ?? '') === $id) {
            $found = true;
            $record = product_payload_to_record([...$payload, 'id' => $id, 'createdAt' => $product['createdAt'] ?? null], $id);
            foreach ($store['products'] as $candidate) {
                if ((string) ($candidate['id'] ?? '') !== $id && ($candidate['slug'] ?? '') === $record['slug']) {
                    throw new RuntimeException('Ya existe otro producto con ese slug.');
                }
            }
            $store['products'][$index] = [
                'id' => $record['id'],
                'name' => $record['name'],
                'slug' => $record['slug'],
                'description' => $record['description'],
                'price' => $record['price'],
                'salePrice' => $record['salePrice'],
                'category' => $record['category'],
                'images' => $record['images'],
                'sizes' => $record['sizes'],
                'colors' => $record['colors'],
                'tags' => $record['tags'],
                'stock' => $record['stock'],
                'isNew' => $record['isNew'],
                'isFeatured' => $record['isFeatured'],
                'isActive' => $record['isActive'],
                'createdAt' => $record['createdAt'],
            ];
            write_json_store($store);
            log_activity('update', 'product', $record['id'], $record['name'], 'Producto actualizado desde administración.');
            return product_to_client($record);
        }
    }

    if (!$found) {
        throw new RuntimeException('Producto no encontrado.');
    }

    throw new RuntimeException('No se pudo actualizar el producto.');
}

function delete_admin_product(string $id): void
{
    if (database_mode() === 'mysql') {
        $count = db()->prepare('SELECT COUNT(*) FROM order_items WHERE product_id = :id');
        $count->execute(['id' => $id]);
        if ((int) $count->fetchColumn() > 0) {
            throw new RuntimeException('No se puede eliminar un producto que ya pertenece a órdenes. Desactívalo en su lugar.');
        }

        $delete = db()->prepare('DELETE FROM products WHERE id = :id');
        $delete->execute(['id' => $id]);
        if ($delete->rowCount() === 0) {
            throw new RuntimeException('Producto no encontrado.');
        }
        log_activity('delete', 'product', $id, $id, 'Producto eliminado desde administración.');
        return;
    }

    $store = read_json_store();
    foreach ($store['orderItems'] as $item) {
        if ((string) ($item['productId'] ?? '') === $id) {
            throw new RuntimeException('No se puede eliminar un producto que ya pertenece a órdenes. Desactívalo en su lugar.');
        }
    }

    $before = count($store['products']);
    $store['products'] = array_values(array_filter($store['products'], static fn (array $product): bool => (string) ($product['id'] ?? '') !== $id));
    if ($before === count($store['products'])) {
        throw new RuntimeException('Producto no encontrado.');
    }
    write_json_store($store);
    log_activity('delete', 'product', $id, $id, 'Producto eliminado desde administración.');
}

function category_payload_to_record(array $payload, ?string $existingId = null): array
{
    $name = trim((string) ($payload['name'] ?? ''));
    if ($name === '') {
        throw new RuntimeException('El nombre de la categoría es obligatorio.');
    }

    $id = trim((string) ($payload['id'] ?? $existingId ?? ''));
    if ($id === '') {
        if ($existingId !== null) {
            throw new RuntimeException('El identificador de la categoría es obligatorio.');
        }

        $id = generate_category_id();
    }

    return [
        'id' => $id,
        'name' => $name,
        'slug' => trim((string) ($payload['slug'] ?? '')) ?: slugify($name),
        'imageUrl' => trim((string) ($payload['imageUrl'] ?? '')),
    ];
}

function create_admin_category(array $payload): array
{
    $record = category_payload_to_record($payload);

    if (database_mode() === 'mysql') {
        $exists = db()->prepare('SELECT COUNT(*) FROM categories WHERE id = :id OR slug = :slug OR name = :name');
        $exists->execute(['id' => $record['id'], 'slug' => $record['slug'], 'name' => $record['name']]);
        if ((int) $exists->fetchColumn() > 0) {
            throw new RuntimeException('Ya existe una categoría con ese ID, nombre o slug.');
        }

        $insert = db()->prepare('INSERT INTO categories (id, name, slug, image_url) VALUES (:id, :name, :slug, :image_url)');
        $insert->execute(['id' => $record['id'], 'name' => $record['name'], 'slug' => $record['slug'], 'image_url' => $record['imageUrl']]);
        log_activity('create', 'category', $record['id'], $record['name'], 'Categoría creada desde administración.');
        return category_to_client($record);
    }

    $store = read_json_store();
    foreach ($store['categories'] as $category) {
        if (($category['id'] ?? '') === $record['id'] || ($category['name'] ?? '') === $record['name'] || ($category['slug'] ?? '') === $record['slug']) {
            throw new RuntimeException('Ya existe una categoría con ese ID, nombre o slug.');
        }
    }
    $store['categories'][] = $record;
    write_json_store($store);
    log_activity('create', 'category', $record['id'], $record['name'], 'Categoría creada desde administración.');
    return category_to_client($record);
}

function update_admin_category(string $id, array $payload): array
{
    $record = category_payload_to_record([...$payload, 'id' => $id], $id);

    if (database_mode() === 'mysql') {
        $exists = db()->prepare('SELECT COUNT(*) FROM categories WHERE id = :id');
        $exists->execute(['id' => $id]);
        if ((int) $exists->fetchColumn() === 0) {
            throw new RuntimeException('Categoría no encontrada.');
        }

        $conflict = db()->prepare('SELECT COUNT(*) FROM categories WHERE id <> :id AND (slug = :slug OR name = :name)');
        $conflict->execute(['id' => $id, 'slug' => $record['slug'], 'name' => $record['name']]);
        if ((int) $conflict->fetchColumn() > 0) {
            throw new RuntimeException('Ya existe otra categoría con ese nombre o slug.');
        }

        $update = db()->prepare('UPDATE categories SET name = :name, slug = :slug, image_url = :image_url WHERE id = :id');
        $update->execute(['id' => $id, 'name' => $record['name'], 'slug' => $record['slug'], 'image_url' => $record['imageUrl']]);

        $products = db()->prepare('UPDATE products SET category_id = :category_id WHERE category_id = :category_id');
        $products->execute(['category_id' => $id]);

        log_activity('update', 'category', $record['id'], $record['name'], 'Categoría actualizada desde administración.');
        return category_to_client($record);
    }

    $store = read_json_store();
    $found = false;
    foreach ($store['categories'] as $index => $category) {
        if ((string) ($category['id'] ?? '') === $id) {
            $found = true;
            foreach ($store['categories'] as $candidate) {
                if ((string) ($candidate['id'] ?? '') !== $id && ((($candidate['name'] ?? '') === $record['name']) || (($candidate['slug'] ?? '') === $record['slug']))) {
                    throw new RuntimeException('Ya existe otra categoría con ese nombre o slug.');
                }
            }
            $previousName = $category['name'];
            $store['categories'][$index] = $record;
            foreach ($store['products'] as &$product) {
                if (($product['category'] ?? '') === $previousName) {
                    $product['category'] = $record['name'];
                }
            }
            unset($product);
            write_json_store($store);
            log_activity('update', 'category', $record['id'], $record['name'], 'Categoría actualizada desde administración.');
            return category_to_client($record);
        }
    }

    if (!$found) {
        throw new RuntimeException('Categoría no encontrada.');
    }

    throw new RuntimeException('No se pudo actualizar la categoría.');
}

function delete_admin_category(string $id): void
{
    if (database_mode() === 'mysql') {
        $count = db()->prepare('SELECT COUNT(*) FROM products WHERE category_id = :id');
        $count->execute(['id' => $id]);
        if ((int) $count->fetchColumn() > 0) {
            throw new RuntimeException('No se puede eliminar una categoría con productos asignados.');
        }

        $delete = db()->prepare('DELETE FROM categories WHERE id = :id');
        $delete->execute(['id' => $id]);
        if ($delete->rowCount() === 0) {
            throw new RuntimeException('Categoría no encontrada.');
        }
        log_activity('delete', 'category', $id, $id, 'Categoría eliminada desde administración.');
        return;
    }

    $store = read_json_store();
    $categoryName = null;
    foreach ($store['categories'] as $category) {
        if ((string) ($category['id'] ?? '') === $id) {
            $categoryName = $category['name'];
            break;
        }
    }
    if ($categoryName === null) {
        throw new RuntimeException('Categoría no encontrada.');
    }
    foreach ($store['products'] as $product) {
        if (($product['category'] ?? '') === $categoryName) {
            throw new RuntimeException('No se puede eliminar una categoría con productos asignados.');
        }
    }
    $store['categories'] = array_values(array_filter($store['categories'], static fn (array $category): bool => (string) ($category['id'] ?? '') !== $id));
    write_json_store($store);
    log_activity('delete', 'category', $id, $categoryName, 'Categoría eliminada desde administración.');
}

function create_admin_user(array $payload): array
{
    ensure_admin_actor();
    $email = trim((string) ($payload['email'] ?? ''));
    $name = trim((string) ($payload['name'] ?? ''));
    $role = normalize_admin_role(trim((string) ($payload['role'] ?? 'editor')) ?: 'editor');
    $password = (string) ($payload['password'] ?? '');

    if ($email === '' || $name === '' || $password === '') {
        throw new RuntimeException('Nombre, correo y contraseña son obligatorios.');
    }

    if (database_mode() === 'mysql') {
        $exists = db()->prepare('SELECT COUNT(*) FROM admin_users WHERE email = :email');
        $exists->execute(['email' => $email]);
        if ((int) $exists->fetchColumn() > 0) {
            throw new RuntimeException('Ya existe un administrador con ese correo.');
        }

        $insert = db()->prepare('INSERT INTO admin_users (email, password, name, role) VALUES (:email, :password, :name, :role)');
        $insert->execute(['email' => $email, 'password' => $password, 'name' => $name, 'role' => $role]);
        $newId = (int) db()->lastInsertId();
        log_activity('create', 'user', (string) $newId, $name, 'Usuario administrador creado.');
        return ['id' => $newId, 'email' => $email, 'name' => $name, 'role' => $role];
    }

    $store = read_json_store();
    foreach ($store['adminUsers'] as $user) {
        if (($user['email'] ?? '') === $email) {
            throw new RuntimeException('Ya existe un administrador con ese correo.');
        }
    }
    $nextId = array_reduce($store['adminUsers'], static fn (int $max, array $user): int => max($max, (int) ($user['id'] ?? 0)), 0) + 1;
    $store['adminUsers'][] = ['id' => $nextId, 'email' => $email, 'password' => $password, 'name' => $name, 'role' => $role];
    write_json_store($store);
    log_activity('create', 'user', (string) $nextId, $name, 'Usuario administrador creado.');
    return ['id' => $nextId, 'email' => $email, 'name' => $name, 'role' => $role];
}

function update_admin_user(int $id, array $payload): array
{
    ensure_admin_actor();
    $email = trim((string) ($payload['email'] ?? ''));
    $name = trim((string) ($payload['name'] ?? ''));
    $role = normalize_admin_role(trim((string) ($payload['role'] ?? 'editor')) ?: 'editor');
    $password = array_key_exists('password', $payload) ? (string) $payload['password'] : null;

    if ($email === '' || $name === '') {
        throw new RuntimeException('Nombre y correo son obligatorios.');
    }

    if (database_mode() === 'mysql') {
        $exists = db()->prepare('SELECT COUNT(*) FROM admin_users WHERE id = :id');
        $exists->execute(['id' => $id]);
        if ((int) $exists->fetchColumn() === 0) {
            throw new RuntimeException('Administrador no encontrado.');
        }

        $conflict = db()->prepare('SELECT COUNT(*) FROM admin_users WHERE email = :email AND id <> :id');
        $conflict->execute(['email' => $email, 'id' => $id]);
        if ((int) $conflict->fetchColumn() > 0) {
            throw new RuntimeException('Ya existe otro administrador con ese correo.');
        }

        if ($password !== null && trim($password) !== '') {
            $update = db()->prepare('UPDATE admin_users SET email = :email, name = :name, role = :role, password = :password WHERE id = :id');
            $update->execute(['id' => $id, 'email' => $email, 'name' => $name, 'role' => $role, 'password' => $password]);
        } else {
            $update = db()->prepare('UPDATE admin_users SET email = :email, name = :name, role = :role WHERE id = :id');
            $update->execute(['id' => $id, 'email' => $email, 'name' => $name, 'role' => $role]);
        }
        log_activity('update', 'user', (string) $id, $name, 'Usuario administrador actualizado.');
        return ['id' => $id, 'email' => $email, 'name' => $name, 'role' => $role];
    }

    $store = read_json_store();
    foreach ($store['adminUsers'] as $candidate) {
        if ((int) ($candidate['id'] ?? 0) !== $id && ($candidate['email'] ?? '') === $email) {
            throw new RuntimeException('Ya existe otro administrador con ese correo.');
        }
    }
    foreach ($store['adminUsers'] as $index => $user) {
        if ((int) ($user['id'] ?? 0) === $id) {
            $store['adminUsers'][$index] = [
                'id' => $id,
                'email' => $email,
                'password' => ($password !== null && trim($password) !== '') ? $password : ($user['password'] ?? ''),
                'name' => $name,
                'role' => $role,
            ];
            write_json_store($store);
            log_activity('update', 'user', (string) $id, $name, 'Usuario administrador actualizado.');
            return ['id' => $id, 'email' => $email, 'name' => $name, 'role' => $role];
        }
    }

    throw new RuntimeException('Administrador no encontrado.');
}

function delete_admin_user(int $id): void
{
    $actor = current_actor_from_request();
    if (($actor['role'] ?? '') !== 'admin') {
        throw new RuntimeException('Solo un admin puede eliminar otras cuentas.');
    }

    if (($actor['id'] ?? null) === $id) {
        throw new RuntimeException('No puedes eliminar tu propia cuenta activa.');
    }

    if (count(get_admin_users()) <= 1) {
        throw new RuntimeException('Debes conservar al menos un usuario administrador.');
    }

    if (database_mode() === 'mysql') {
        $delete = db()->prepare('DELETE FROM admin_users WHERE id = :id');
        $delete->execute(['id' => $id]);
        if ($delete->rowCount() === 0) {
            throw new RuntimeException('Administrador no encontrado.');
        }
        log_activity('delete', 'user', (string) $id, (string) $id, 'Usuario administrador eliminado.');
        return;
    }

    $store = read_json_store();
    $before = count($store['adminUsers']);
    $store['adminUsers'] = array_values(array_filter($store['adminUsers'], static fn (array $user): bool => (int) ($user['id'] ?? 0) !== $id));
    if ($before === count($store['adminUsers'])) {
        throw new RuntimeException('Administrador no encontrado.');
    }
    if (count($store['adminUsers']) === 0) {
        throw new RuntimeException('Debes conservar al menos un usuario administrador.');
    }
    write_json_store($store);
    log_activity('delete', 'user', (string) $id, (string) $id, 'Usuario administrador eliminado.');
}

function update_admin_order(int $id, array $payload): array
{
    $status = trim((string) ($payload['status'] ?? ''));
    $paymentStatus = trim((string) ($payload['paymentStatus'] ?? ''));
    $cancellationReason = array_key_exists('cancellationReason', $payload) ? trim((string) $payload['cancellationReason']) : null;
    $refundAmount = array_key_exists('refundAmount', $payload) && $payload['refundAmount'] !== null && $payload['refundAmount'] !== '' ? (float) $payload['refundAmount'] : null;
    $cancelledAt = $status === 'cancelled' ? (string) ($payload['cancelledAt'] ?? (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM)) : null;

    if ($status === '' || $paymentStatus === '') {
        throw new RuntimeException('El estado de la orden y el estado del pago son obligatorios.');
    }

    if (database_mode() === 'mysql') {
        $exists = db()->prepare('SELECT COUNT(*) FROM orders WHERE id = :id');
        $exists->execute(['id' => $id]);
        if ((int) $exists->fetchColumn() === 0) {
            throw new RuntimeException('Orden no encontrada.');
        }

        $update = db()->prepare(
            'UPDATE orders
             SET status = :status, payment_status = :payment_status, cancellation_reason = :cancellation_reason, refund_amount = :refund_amount, cancelled_at = :cancelled_at
             WHERE id = :id'
        );
        $update->execute([
            'id' => $id,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'cancellation_reason' => $status === 'cancelled' ? ($cancellationReason ?: 'Cancelada desde administración') : null,
            'refund_amount' => $status === 'cancelled' ? $refundAmount : null,
            'cancelled_at' => $cancelledAt,
        ]);
        log_activity('order_update', 'order', (string) $id, (string) $id, 'Orden actualizada a estado ' . $status . ' y pago ' . $paymentStatus . '.');

        foreach (get_admin_orders() as $order) {
            if ($order['id'] === $id) {
                return $order;
            }
        }
    }

    $store = read_json_store();
    foreach ($store['orders'] as $index => $order) {
        if ((int) ($order['id'] ?? 0) === $id) {
            $store['orders'][$index]['status'] = $status;
            $store['orders'][$index]['payment_status'] = $paymentStatus;
            $store['orders'][$index]['cancellation_reason'] = $status === 'cancelled' ? ($cancellationReason ?: 'Cancelada desde administración') : null;
            $store['orders'][$index]['refund_amount'] = $status === 'cancelled' ? $refundAmount : null;
            $store['orders'][$index]['cancelled_at'] = $cancelledAt;
            write_json_store($store);
            log_activity('order_update', 'order', (string) $id, (string) ($order['order_number'] ?? $id), 'Orden actualizada a estado ' . $status . ' y pago ' . $paymentStatus . '.');
            foreach (get_admin_orders() as $updatedOrder) {
                if ($updatedOrder['id'] === $id) {
                    return $updatedOrder;
                }
            }
        }
    }

    throw new RuntimeException('Orden no encontrada.');
}

function delete_admin_order(int $id): void
{
    if (database_mode() === 'mysql') {
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $deleteItems = $pdo->prepare('DELETE FROM order_items WHERE order_id = :id');
            $deleteItems->execute(['id' => $id]);
            $delete = $pdo->prepare('DELETE FROM orders WHERE id = :id');
            $delete->execute(['id' => $id]);
            if ($delete->rowCount() === 0) {
                throw new RuntimeException('Orden no encontrada.');
            }
            $pdo->commit();
            log_activity('order_delete', 'order', (string) $id, (string) $id, 'Orden eliminada desde administración.');
            return;
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }
    }

    $store = read_json_store();
    $before = count($store['orders']);
    $store['orders'] = array_values(array_filter($store['orders'], static fn (array $order): bool => (int) ($order['id'] ?? 0) !== $id));
    if ($before === count($store['orders'])) {
        throw new RuntimeException('Orden no encontrada.');
    }
    $store['orderItems'] = array_values(array_filter($store['orderItems'], static fn (array $item): bool => (int) ($item['orderId'] ?? 0) !== $id));
    write_json_store($store);
    log_activity('order_delete', 'order', (string) $id, (string) $id, 'Orden eliminada desde administración.');
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
            log_activity('order_create', 'order', (string) $nextId, $orderNumber, 'Orden creada por checkout.');
            return ['orderNumber' => $orderNumber, 'total' => $total];
        } catch (Throwable $exception) {
            $pdo->rollBack();
            throw $exception;
        }
    }

    $store = read_json_store();
    $currentMaxId = array_reduce($store['orders'], static fn (int $max, array $order): int => max($max, (int) $order['id']), 0);
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
    log_activity('order_create', 'order', (string) $nextId, $orderNumber, 'Orden creada por checkout.');
    return ['orderNumber' => $orderNumber, 'total' => $total];
}

function category_id_by_name(?string $name): ?string
{
    if ($name === null || trim($name) === '') {
        return null;
    }

    foreach (get_categories() as $category) {
        if ($category['name'] === $name || $category['id'] === $name) {
            return $category['id'];
        }
    }

    if (database_mode() === 'mysql') {
        $statement = db()->prepare('SELECT id FROM categories WHERE name = :name LIMIT 1');
        $statement->execute(['name' => $name]);
        $categoryId = $statement->fetchColumn();
        return $categoryId === false ? null : (string) $categoryId;
    }

    return null;
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
            log_activity('settings_update', 'settings', 'storefront', 'Storefront', 'Configuración de storefront actualizada.');
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
    log_activity('settings_update', 'settings', 'storefront', 'Storefront', 'Configuración de storefront actualizada.');
    return $store['settings'];
}

function swagger_spec(): array
{
    return [
        'openapi' => '3.0.3',
        'info' => [
            'title' => 'Dark Ranch Local API',
            'version' => '2.0.0',
            'description' => 'API local para Dark Ranch con CRUD completo de administración, dashboard operativo y soporte para JSON o MySQL (XAMPP).',
        ],
        'servers' => [[
            'url' => sprintf('%s://%s', (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http', $_SERVER['HTTP_HOST'] ?? 'localhost:3001'),
        ]],
        'paths' => [
            '/api/health' => ['get' => ['summary' => 'Estado del API', 'responses' => ['200' => ['description' => 'OK']]]],
            '/api/bootstrap' => ['get' => ['summary' => 'Carga inicial de tienda y dashboard público', 'responses' => ['200' => ['description' => 'Bootstrap data']]]],
            '/api/login' => ['post' => ['summary' => 'Login de administrador', 'requestBody' => ['required' => true], 'responses' => ['200' => ['description' => 'Login correcto'], '401' => ['description' => 'Credenciales inválidas']]]],
            '/api/orders' => ['post' => ['summary' => 'Crear orden', 'requestBody' => ['required' => true], 'responses' => ['201' => ['description' => 'Orden creada']]]],
            '/api/settings' => ['put' => ['summary' => 'Actualizar settings', 'requestBody' => ['required' => true], 'responses' => ['200' => ['description' => 'Settings actualizados']]]],
            '/api/admin/snapshot' => ['get' => ['summary' => 'Dashboard y recursos completos del admin', 'responses' => ['200' => ['description' => 'Snapshot completo']]]],
            '/api/admin/products' => [
                'get' => ['summary' => 'Listar productos del admin', 'responses' => ['200' => ['description' => 'Lista de productos']]],
                'post' => ['summary' => 'Crear producto', 'requestBody' => ['required' => true], 'responses' => ['201' => ['description' => 'Producto creado']]],
            ],
            '/api/admin/products/{id}' => [
                'put' => ['summary' => 'Actualizar producto', 'responses' => ['200' => ['description' => 'Producto actualizado']]],
                'delete' => ['summary' => 'Eliminar producto', 'responses' => ['200' => ['description' => 'Producto eliminado']]],
            ],
            '/api/admin/categories' => [
                'get' => ['summary' => 'Listar categorías', 'responses' => ['200' => ['description' => 'Lista de categorías']]],
                'post' => ['summary' => 'Crear categoría', 'requestBody' => ['required' => true], 'responses' => ['201' => ['description' => 'Categoría creada']]],
            ],
            '/api/admin/categories/{id}' => [
                'put' => ['summary' => 'Actualizar categoría', 'responses' => ['200' => ['description' => 'Categoría actualizada']]],
                'delete' => ['summary' => 'Eliminar categoría', 'responses' => ['200' => ['description' => 'Categoría eliminada']]],
            ],
            '/api/admin/orders' => ['get' => ['summary' => 'Listar órdenes completas', 'responses' => ['200' => ['description' => 'Lista de órdenes']]]],
            '/api/admin/orders/{id}' => [
                'put' => ['summary' => 'Actualizar orden', 'responses' => ['200' => ['description' => 'Orden actualizada']]],
                'delete' => ['summary' => 'Eliminar orden', 'responses' => ['200' => ['description' => 'Orden eliminada']]],
            ],
            '/api/admin/users' => [
                'get' => ['summary' => 'Listar administradores', 'responses' => ['200' => ['description' => 'Lista de usuarios admin']]],
                'post' => ['summary' => 'Crear administrador', 'requestBody' => ['required' => true], 'responses' => ['201' => ['description' => 'Administrador creado']]],
            ],
            '/api/admin/users/{id}' => [
                'put' => ['summary' => 'Actualizar administrador', 'responses' => ['200' => ['description' => 'Administrador actualizado']]],
                'delete' => ['summary' => 'Eliminar administrador', 'responses' => ['200' => ['description' => 'Administrador eliminado']]],
            ],
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
            db();
            $payload['mysql'] = ['connected' => true];
        } else {
            $payload['jsonFile'] = basename(data_store_path());
        }
        json_response(200, $payload);
    }

    if ($method === 'GET' && $path === '/api/bootstrap') {
        json_response(200, get_bootstrap_payload());
    }

    if ($method === 'GET' && $path === '/api/admin/snapshot') {
        json_response(200, get_admin_snapshot());
    }

    if ($method === 'GET' && $path === '/api/admin/products') {
        json_response(200, ['products' => get_admin_products(true)]);
    }

    if ($method === 'GET' && $path === '/api/admin/categories') {
        json_response(200, ['categories' => get_categories()]);
    }

    if ($method === 'GET' && $path === '/api/admin/orders') {
        json_response(200, ['orders' => get_admin_orders()]);
    }

    if ($method === 'GET' && $path === '/api/admin/users') {
        json_response(200, ['adminUsers' => get_admin_users()]);
    }

    if ($method === 'POST' && $path === '/api/admin/activity/purge') {
        ensure_admin_actor();
        $body = read_json_body();
        $retentionMonths = (int) ($body['retentionMonths'] ?? 0);
        json_response(200, purge_activity_logs($retentionMonths));
    }

    if ($method === 'POST' && $path === '/api/admin/uploads') {
        ensure_admin_actor();
        json_response(201, save_admin_uploaded_image());
    }

    if ($method === 'DELETE' && $path === '/api/admin/uploads') {
        ensure_admin_actor();
        delete_admin_uploaded_image(read_json_body());
        json_response(200, ['ok' => true]);
    }

    if ($method === 'POST' && $path === '/api/login') {
        $body = read_json_body();
        $user = login_admin((string) ($body['email'] ?? ''), (string) ($body['password'] ?? ''));
        if ($user === null) {
            json_response(401, ['message' => 'Credenciales inválidas']);
        }
        $_SERVER['HTTP_X_ADMIN_ACTOR_ID'] = (string) $user['id'];
        $_SERVER['HTTP_X_ADMIN_ACTOR_NAME'] = $user['name'];
        $_SERVER['HTTP_X_ADMIN_ACTOR_EMAIL'] = $user['email'];
        $_SERVER['HTTP_X_ADMIN_ACTOR_ROLE'] = $user['role'];
        log_activity('login', 'auth', (string) $user['id'], $user['name'], 'Inicio de sesión exitoso.');
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

    if ($method === 'POST' && $path === '/api/admin/products') {
        $product = create_admin_product(read_json_body());
        json_response(201, ['product' => $product]);
    }

    if (preg_match('#^/api/admin/products/([^/]+)$#', $path, $matches) === 1) {
        $productId = urldecode($matches[1]);
        if ($method === 'PUT') {
            json_response(200, ['product' => update_admin_product($productId, read_json_body())]);
        }
        if ($method === 'DELETE') {
            delete_admin_product($productId);
            json_response(200, ['ok' => true]);
        }
    }

    if ($method === 'POST' && $path === '/api/admin/categories') {
        $category = create_admin_category(read_json_body());
        json_response(201, ['category' => $category]);
    }

    if (preg_match('#^/api/admin/categories/([^/]+)$#', $path, $matches) === 1) {
        $categoryId = urldecode($matches[1]);
        if ($method === 'PUT') {
            json_response(200, ['category' => update_admin_category($categoryId, read_json_body())]);
        }
        if ($method === 'DELETE') {
            delete_admin_category($categoryId);
            json_response(200, ['ok' => true]);
        }
    }

    if (preg_match('#^/api/admin/orders/(\d+)$#', $path, $matches) === 1) {
        $orderId = (int) $matches[1];
        if ($method === 'PUT') {
            json_response(200, ['order' => update_admin_order($orderId, read_json_body())]);
        }
        if ($method === 'DELETE') {
            delete_admin_order($orderId);
            json_response(200, ['ok' => true]);
        }
    }

    if ($method === 'POST' && $path === '/api/admin/users') {
        $adminUser = create_admin_user(read_json_body());
        json_response(201, ['adminUser' => $adminUser]);
    }

    if (preg_match('#^/api/admin/users/(\d+)$#', $path, $matches) === 1) {
        $userId = (int) $matches[1];
        if ($method === 'PUT') {
            json_response(200, ['adminUser' => update_admin_user($userId, read_json_body())]);
        }
        if ($method === 'DELETE') {
            delete_admin_user($userId);
            json_response(200, ['ok' => true]);
        }
    }

    json_response(404, ['message' => sprintf('Ruta no encontrada: %s %s', $method, $path)]);
} catch (Throwable $exception) {
    $status = expected_runtime_status($exception) ?? 500;
    $message = $status === 500 ? 'Error interno del servidor' : $exception->getMessage();
    json_response($status, ['message' => $message, 'detail' => $exception->getMessage()]);
}
