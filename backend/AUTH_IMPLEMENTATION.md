# Authentication Implementation

## Overview

The backend uses JWT access tokens plus database-backed refresh tokens.

- Access tokens are signed with `JWT_SECRET`
- Refresh tokens are random opaque strings stored in `refresh_tokens`
- The refresh token is returned as an `httpOnly` cookie on login

## Current Endpoints

### `POST /auth/register`

Registers a user with:

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

`role` is optional and defaults to `student`.

### `POST /auth/login`

Accepts either email or username:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

or

```json
{
  "username": "john_doe",
  "password": "password123"
}
```

Returns:

```json
{
  "message": "Login successful",
  "accessToken": "jwt-access-token",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student",
    "createdAt": "2026-03-18T12:00:00.000Z"
  }
}
```

### `POST /auth/refresh`

Uses the refresh token from the `refreshToken` cookie or from the request body:

```json
{
  "refreshToken": "opaque-refresh-token"
}
```

Returns a new access token for the same session.

### `POST /auth/logout`

Deletes the refresh token from the database and clears the cookie.

### `POST /auth/forgot-password`

Accepts:

```json
{
  "email": "john@example.com"
}
```

Always returns a generic success message. If the email belongs to a user, the backend stores a short-lived reset token and emails a link to the frontend reset page.

### `POST /auth/reset-password`

Accepts:

```json
{
  "token": "raw-reset-token-from-email",
  "password": "newSecurePassword123"
}
```

Resets the password, clears the reset token, and revokes all refresh tokens for that user.

## Token Behavior

- Access token expiry is controlled by `JWT_ACCESS_EXPIRES_IN` and defaults to `15m`
- Refresh tokens currently expire after 7 days
- Refresh tokens are cleaned up hourly by `src/jobs/tokenCleanup.js`
- Refresh currently returns a new access token but does not rotate the refresh token

## Environment Variables

```env
JWT_SECRET=your_secret_key
JWT_ACCESS_EXPIRES_IN=15m
FRONTEND_URL=http://localhost:5173
PASSWORD_RESET_URL=http://localhost:5173/reset-password
PASSWORD_RESET_TOKEN_EXPIRES_MINUTES=60
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=school_inventory
DB_USER=postgres
DB_PASSWORD=postgres123
```
