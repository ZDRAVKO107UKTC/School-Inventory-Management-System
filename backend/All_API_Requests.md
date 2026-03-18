# All API Requests

Base URL: `http://localhost:5000`

## Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

## User

- `GET /users/profile`

## Admin

- `GET /admin/dashboard`
- `POST /admin/users`
- `DELETE /admin/users/:id`
- `PUT /admin/users/:id/role`

## Equipment

- `GET /equipment`
- `GET /equipment/:id`
- `POST /equipment`
- `PUT /equipment/:id/status`
- `DELETE /equipment/:id`

Supported `/equipment` query params:

- `search`
- `type`
- `status`
- `condition`

## Requests

- `POST /request`
- `GET /request/my`
- `PUT /request/:id/approve`
- `PUT /request/:id/reject`
- `PUT /request/:id/return`

### Roles

- `student`: can create requests, view their own requests, and return their own approved requests
- `teacher`: same as student plus approve/reject requests
- `admin`: full access, including user and equipment management plus approve/reject requests
