# All API Requests

Base URL: `http://localhost:5000`

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

- **GET** `/admin/dashboard`
- **DELETE** `/admin/users/:id` (Admin only)

