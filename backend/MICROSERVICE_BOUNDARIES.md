# BE-030 Microservice Boundaries

The backend is now deployed as **real microservices** plus an API gateway.

## Running Services

- `auth-service` (`/api/auth`)
- `user-service` (`/api/users`)
- `admin-service` (`/api/admin`)
- `equipment-service` (`/api/equipment`)
- `request-service` (`/api/request`, `/api/requests`)
- `report-service` (`/api/reports`)
- `spatial-service` (`/api/spatial`)
- `api-gateway` (entrypoint on port `5000`)

## Responsibilities

### Auth Service
- register/login/refresh/logout
- token lifecycle
- auth middleware dependencies

Data ownership:
- `users`
- `refresh_tokens`

### User Service
- authenticated profile retrieval

Data ownership:
- user identity projection

### Admin Service
- admin dashboard and user management flows

Data ownership:
- admin-only operations on user domain

### Equipment Service
- equipment catalog CRUD
- status/condition updates

Data ownership:
- `equipment`
- condition logs used for asset lifecycle

### Request Service
- borrow/approve/reject/return workflows
- request history endpoints

Data ownership:
- `requests`

### Report Service
- usage/history reports
- CSV export
- history reset endpoint

Data ownership:
- reporting reads over request/equipment views

### Spatial Service
- floors/rooms CRUD
- equipment placement assignment

Data ownership:
- `floors`
- `rooms`
- equipment-room relationship

## Gateway Contracts

Gateway forwards these public contracts unchanged:
- `/api/auth/*`
- `/api/users/*`
- `/api/admin/*`
- `/api/equipment/*`
- `/api/request/*`
- `/api/requests/*`
- `/api/reports/*`
- `/api/spatial/*`

Frontend should only call gateway (`http://127.0.0.1:5000` in local dev).

## Startup

### Local
- `cd backend`
- `npm run microservices:start`

### Docker
- `cd backend`
- `docker compose -f docker-compose.microservices.yml up -d`

## Monolith Status

- Monolith runtime has been removed.
- `backend/server.js` no longer exists.
- Backend start scripts point only to microservices orchestration.

