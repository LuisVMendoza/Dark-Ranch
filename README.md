## Running the code

Dark Ranch now ships with a **PHP local API** that can work in two modes:

- **`DB_CONNECTION=json`** for quick offline/local testing using `local-data/dark-ranch.json`
- **`DB_CONNECTION=mysql`** to work with **XAMPP + MySQL** before deploying to hosting

The API also exposes Swagger UI at `http://localhost:3001/api/docs`.

## Documentación (guía extendida)

Esta sección está pensada para que una persona nueva en el proyecto pueda aprender cómo funciona la app sin perderse.

### Arquitectura general

El proyecto se divide en dos partes principales:

1. **Frontend (Vite + React + TypeScript)**
   - Ubicación principal: `src/`
   - Renderiza la tienda, carrito, autenticación y panel de administración.
2. **API local (PHP)**
   - Ubicación principal: `server/`
   - Expone endpoints para productos, categorías, órdenes y autenticación.
   - Incluye documentación Swagger en `/api/docs`.

### Flujo de datos (resumen simple)

1. El usuario interactúa con la interfaz React.
2. Los servicios del frontend (en `src/app/lib/`) hacen llamadas HTTP a la API local.
3. La API responde desde:
   - **JSON local** (`DB_CONNECTION=json`) o
   - **MySQL** (`DB_CONNECTION=mysql`).
4. El frontend actualiza estado y vista.

### Estructura recomendada para aprender el código

Si vas empezando, este orden te ayudará:

1. **`src/app/App.tsx`**: punto de entrada lógico de la aplicación.
2. **`src/app/components/pages.tsx`**: organización de pantallas.
3. **`src/app/lib/api.ts`**: cliente de API y configuración base.
4. **`src/app/lib/products.service.ts` y `orders.service.ts`**: operaciones principales de negocio.
5. **`server/public_index.php` y `server/router.php`**: entrada y ruteo de la API.
6. **`server/schema.sql` / `server/seed.sql`**: modelo de datos inicial.

### Modo JSON vs Modo MySQL (cuándo usar cada uno)

- **JSON (`DB_CONNECTION=json`)**
  - Ideal para prototipos rápidos.
  - Cero dependencia de base de datos instalada.
  - Menor complejidad para pruebas visuales.

- **MySQL (`DB_CONNECTION=mysql`)**
  - Recomendado para pruebas realistas.
  - Permite validar relaciones y comportamiento de datos similar a producción.
  - Mejor opción para probar panel admin y órdenes de forma consistente.

### Convenciones prácticas para contribuir

- Mantén componentes enfocados (UI en `components/ui`, lógica en `lib`).
- Evita mezclar cambios de frontend y backend en un mismo commit si no es necesario.
- Si agregas endpoints, documenta y prueba en Swagger.
- Si agregas campos a entidades, actualiza también `schema.sql`, `seed.sql` y servicios frontend.

### Troubleshooting rápido

- **No carga API en `:3001`**
  - Verifica que ejecutaste `npm run dev` o `npm run api`.
- **Error de conexión MySQL**
  - Revisa credenciales de `.env` y que MySQL esté activo en XAMPP.
- **Rutas API responden 404**
  - Confirma que `server/router.php` tiene la ruta y método correctos.
- **Datos inconsistentes en admin**
  - Re-seed con `server/seed.sql` sobre una base limpia.

### 1. Configure local environment

Copy the example env file and adjust it as needed:

```bash
cp .env.example .env
```

If you want to use XAMPP/MySQL, use values like these in `.env`:

```env
API_PORT=3001
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dark_ranch
DB_USERNAME=root
DB_PASSWORD=
DB_CHARSET=utf8mb4
```

If you only want to keep using the local JSON file, change:

```env
DB_CONNECTION=json
```

### 2. Prepare MySQL in XAMPP

1. Start **Apache** and **MySQL** from XAMPP.
2. Open **phpMyAdmin**.
3. Run `server/schema.sql`.
4. Then run `server/seed.sql`.

That creates the same catalog, settings, admin user, and demo orders that the front-end expects.

### 3. Development

Run the app and the local API together:

```bash
npm run dev
```

This command starts:

- the PHP API on `http://localhost:3001`
- Swagger UI on `http://localhost:3001/api/docs`
- the Vite app on its default port

### 4. API only

```bash
npm run api
```

### 5. Production build

```bash
npm run build
```

## Default local admin user

Use these credentials to access the admin panel connected to the local database:

- **Email:** `admin@darkranch.com`
- **Password:** `admin123`

## Local notes for XAMPP

- If port `3306` is busy, update `DB_PORT` in `.env`.
- If your hosting later uses MySQL, this setup helps you keep the same relational structure locally.
- If you want to test endpoints manually, open Swagger and execute requests from there.
