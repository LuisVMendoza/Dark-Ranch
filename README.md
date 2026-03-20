## Running the code

Dark Ranch now ships with a **PHP local API** that can work in two modes:

- **`DB_CONNECTION=json`** for quick offline/local testing using `local-data/dark-ranch.json`
- **`DB_CONNECTION=mysql`** to work with **XAMPP + MySQL** before deploying to hosting

The API also exposes Swagger UI at `http://localhost:3001/api/docs`.

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
