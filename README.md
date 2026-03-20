# School Inventory Management System

This project is now structured as a **microservices backend** with a React frontend.

## Architecture

### Frontend
- `frontend/` (Vite + React + TypeScript)
- Uses `/api/*` endpoints (through Vite proxy in dev)

### Backend Microservices
- `backend/microservices/services/auth-service` -> `/api/auth`
- `backend/microservices/services/user-service` -> `/api/users`
- `backend/microservices/services/admin-service` -> `/api/admin`
- `backend/microservices/services/equipment-service` -> `/api/equipment`
- `backend/microservices/services/request-service` -> `/api/request`, `/api/requests`
- `backend/microservices/services/report-service` -> `/api/reports`
- `backend/microservices/services/spatial-service` -> `/api/spatial`

### API Gateway
- `backend/microservices/gateway`
- Runs on `http://127.0.0.1:5000`
- Routes incoming `/api/*` traffic to the correct service

### Database
- Shared PostgreSQL database (existing Sequelize models)
- Local default in `.env`: `127.0.0.1:5433`

## Run Locally (Microservices Mode)

1. Start PostgreSQL (recommended via Docker):
```bash
cd backend
docker compose up -d postgres
```

2. Install backend deps:
```bash
cd backend
npm install
```

3. Prepare database schema and demo data:
```bash
cd backend
npm run db:setup
```

4. Start all services + gateway:
```bash
cd backend
npm run microservices:start
```

5. Start frontend:
```bash
cd frontend
npm install
npm run dev
```

Frontend will call `http://127.0.0.1:5000/api/*` through proxy.

## Seeded Login Accounts

All seeded users use password: `Password123`

- Admin: `admin@school.local`
- Teacher: `teacher@school.local`
- Student: `student@school.local`
- Student 2: `student2@school.local`

## Docker Microservices (All-in-one)

Use:
```bash
cd backend
docker compose -f docker-compose.microservices.yml up -d
```

This starts:
- PostgreSQL
- all backend services
- API gateway

## Environment Variables

`backend/.env` now includes service ports:
- `API_GATEWAY_PORT=5000`
- `AUTH_SERVICE_PORT=5001`
- `USER_SERVICE_PORT=5002`
- `ADMIN_SERVICE_PORT=5003`
- `EQUIPMENT_SERVICE_PORT=5004`
- `REQUEST_SERVICE_PORT=5005`
- `REPORT_SERVICE_PORT=5006`
- `SPATIAL_SERVICE_PORT=5007`

You can also override service URLs in gateway with:
- `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `ADMIN_SERVICE_URL`, `EQUIPMENT_SERVICE_URL`, `REQUEST_SERVICE_URL`, `REPORT_SERVICE_URL`, `SPATIAL_SERVICE_URL`

## Runtime Mode

- Backend is **microservices-only**.
- Monolith entrypoint `backend/server.js` has been removed.
