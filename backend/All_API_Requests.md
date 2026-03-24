# All API Requests

Base URL: `http://localhost:5000/api`

## Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

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
- `POST /equipment/media/upload` (Admin only)
- `POST /equipment`
- `PUT /equipment/:id/status`
- `DELETE /equipment/:id`

Equipment payloads may also include derived media preview fields:

- `photo_preview_url`
- `photo_thumbnail_url`
- `photo_preview_mode`
- `photo_preview_provider`
- `qr_code_value`

Supported `/equipment` query params:

- `search`
- `type`
- `status`
- `condition`

## Requests

- `POST /requests`
- `GET /requests/my`
- `GET /requests/history/equipment/:id` (Admin or teacher only)
- `GET /requests/history/users/:id` (Admin or teacher only)
- `GET /requests/:id/condition-history` (Admin only)
- `PUT /requests/:id/approve`
- `PUT /requests/:id/reject`
- `PUT /requests/:id/return`

## Reports

- `GET /reports/usage` (Admin only)
- `GET /reports/history` (Admin only)
- `GET /reports/export` (Admin only)
- `GET /reports/integrations/status` (Admin only)
- `POST /reports/export/google-sheets` (Admin only)

### Roles

- `student`: can create requests, view their own requests, and return their own approved requests
- `teacher`: same as student plus approve/reject requests
- `admin`: full access, including user and equipment management plus approve/reject requests
