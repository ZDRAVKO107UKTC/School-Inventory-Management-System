# All API Requests

Base URL: `http://localhost:5000`

## User Roles and Permissions

The system has three user roles with different permissions:

### Student
- View equipment (public)
- Submit equipment requests
- View their own requests
- Return equipment they borrowed

### Teacher
- All student permissions
- Approve/reject equipment requests (can act as department approvers)

### Admin
- All permissions
- Create/delete users
- Create/delete equipment
- Approve/reject equipment requests
- Access admin dashboard

## Authentication Endpoints

- **POST** `/auth/register`
- **POST** `/auth/login`
- **POST** `/auth/refresh`
- **POST** `/auth/logout`

## User Endpoints

- **GET** `/users/profile`

## Equipment Endpoints

- **POST** `/equipment` (Admin only)
- **GET** `/equipment/:id`
- **GET** `/equipment` (with optional query parameters: search, type, status, condition)
- **PUT** `/equipment/:id/status`
- **DELETE** `/equipment/:id` (Admin only)

## Admin Endpoints

- **GET** `/admin/dashboard` (Admin only)
- **POST** `/admin/users` (Admin only)
- **DELETE** `/admin/users/:id` (Admin only)

## Request Endpoints

- **POST** `/request` (Authenticated)
- **GET** `/request/my` (Authenticated)
- **PUT** `/request/{id}/approve` (Admin or Teacher)
- **PUT** `/request/{id}/reject` (Admin or Teacher)
- **PUT** `/request/{id}/return` (Authenticated)
