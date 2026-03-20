## Running the code

Dark Ranch now uses a **local JSON data store** persisted at `local-data/dark-ranch.json` and a small local API server exposed from `server/index.mjs`.

### Development

Run the app and the local API together (works on Windows, macOS, and Linux without WSL):

```bash
npm run dev
```

This command starts:

- the local API on `http://localhost:3001`
- the Vite app on its default port

### API only

If you only want the local data/API layer:

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

## Notes for Windows

The development script no longer depends on `bash` or WSL. You can run `npm run dev` directly from PowerShell or Command Prompt without installing extra Unix tooling.
