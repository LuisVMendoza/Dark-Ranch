## Running the code

Dark Ranch now uses a **local SQLite database** stored at `local-data/dark-ranch.sqlite` and a small local API server exposed from `server/index.mjs`.

### Development

Run the app and the local API together:

```bash
npm run dev
```

This command starts:

- the SQLite-backed API on `http://localhost:3001`
- the Vite app on its default port

### API only

If you only want the local database/API layer:

```bash
npm run api
```

### Production build

```bash
npm run build
```

## Default local admin user

Use these credentials to access the admin panel connected to the local database:

- **Email:** `admin@darkranch.com`
- **Password:** `admin123`
