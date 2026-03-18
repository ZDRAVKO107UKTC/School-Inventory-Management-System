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

`DELETE /admin/users/:id` can delete users of any role, including other admins.

## Equipment

- `GET /equipment`
- `GET /equipment/:id`
- `GET /equipment/:id/condition-history` (Admin only)
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
- `GET /request/:id/condition-history` (Admin only)
- `PUT /request/:id/approve`
- `PUT /request/:id/reject`
- `PUT /request/:id/return`

### Roles

- `student`: can create requests, view their own requests, and return their own approved requests
- `teacher`: same as student plus approve/reject requests
- `admin`: full access, including user and equipment management plus approve/reject requests
