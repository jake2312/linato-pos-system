# Linato POS (React + Laravel)

## Quick Start (Local Dev)

### Backend
1. `cd backend`
2. Copy `.env.example` to `.env` and set DB credentials for MySQL.
3. Install dependencies: `composer install`
4. Generate key: `php artisan key:generate`
5. Run migrations + seeds: `php artisan migrate --seed`
6. Start API: `php artisan serve`

Default users:
- `admin@linato.com` / `password` (Admin, PIN `1234`)
- `cashier@linato.com` / `password`
- `kitchen@linato.com` / `password`

### Frontend
1. `cd frontend`
2. Copy `.env.example` to `.env`
3. Install dependencies: `npm install`
4. Start Vite: `npm run dev`

App URL: `http://localhost:5173`

## API Examples
See `backend/docs/curl-examples.md`.
