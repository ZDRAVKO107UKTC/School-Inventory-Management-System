# School-Inventory-Management-System

School inventory management system with:

- Express + Sequelize + PostgreSQL backend
- Vite + React frontend UI shell

## Backend Status

The backend currently provides:

- JWT authentication with refresh tokens
- Role-based access for `student`, `teacher`, and `admin`
- Equipment management
- Borrow request creation, approval, rejection, and return flows
- Inventory-aware request quantities

## Actual Backend API

### Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Users

- `GET /users/profile`

### Admin

- `GET /admin/dashboard`
- `POST /admin/users`
- `DELETE /admin/users/:id`
- `PUT /admin/users/:id/role`

### Equipment

- `GET /equipment`
- `GET /equipment/:id`
- `POST /equipment`
- `PUT /equipment/:id/status`
- `DELETE /equipment/:id`

### Requests

- `POST /request`
- `GET /request/my`
- `PUT /request/:id/approve`
- `PUT /request/:id/reject`
- `PUT /request/:id/return`

## Data Model Notes

- Primary keys are integer auto-increment IDs
- Equipment tracks available `quantity`
- Requests now store requested `quantity`
- Approving a request decreases available equipment quantity
- Returning a request restores equipment quantity

## Backend Setup

```bash
cd backend
npm install
npx sequelize-cli db:create
npx sequelize-cli db:migrate
node seed.js
npm start
```

The backend runs on `http://localhost:5000` by default.

## Seed Data

The current seed script inserts sample equipment only. It does not create sample users.

## Frontend Note

The frontend in `frontend/` is still a design-phase UI and is not yet wired to the backend.
