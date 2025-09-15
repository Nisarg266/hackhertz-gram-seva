# Backend (SQLite)

This backend uses Express + sqlite3 to store users in a local file `gramconnect.db`.

## Endpoints
- `POST /register` → body: `{ "email": string, "password": string }`
- `POST /login` → body: `{ "email": string, "password": string }`

Passwords are hashed with bcrypt before storing.

## Run
```powershell
cd backend
npm install
npm run start:sqlite  # or: node server-sqlite.js
```

Server will run at: `http://localhost:3000`

## Quick test (PowerShell)
```powershell
# Register
Invoke-RestMethod -Method Post -Uri http://localhost:3000/register -ContentType 'application/json' -Body '{"email":"test@example.com","password":"pass123"}'

# Login
Invoke-RestMethod -Method Post -Uri http://localhost:3000/login -ContentType 'application/json' -Body '{"email":"test@example.com","password":"pass123"}'
```

## Frontend integration
Point your frontend to `http://localhost:3000/register` and `http://localhost:3000/login`.

CORS is enabled for `http://localhost:5173` by default. Change it in `server-sqlite.js` if your frontend runs on a different port.
