# Authentication Implementation

## Overview
This project uses **JWT-based authentication with refresh tokens** for secure user authentication.

## Token Strategy

### Access Tokens (Short-lived)
- **Expiration**: 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN`)
- **Purpose**: Authenticate API requests
- **Storage**: Client-side (memory or localStorage)
- **Included in**: Authorization header as `Bearer <token>`

### Refresh Tokens (Long-lived)
- **Expiration**: 7 days
- **Purpose**: Obtain new access tokens without re-login
- **Storage**: Database (`refresh_tokens` table) + httpOnly cookie
- **Security**: Cryptographically random, not JWT

## API Endpoints

### POST `/auth/register`
Register a new user.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"  // optional: student, teacher, admin
}
```

### POST `/auth/login`
Login and receive tokens.

**Request:**
```json
{
  "email": "john@example.com",  // or "username": "john_doe"
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

**Note**: Refresh token is set as httpOnly cookie automatically.

### POST `/auth/refresh`
Get a new access token using refresh token.

**Request:** (refresh token from cookie, or in body)
```json
{
  "refreshToken": "abc123..."  // optional if cookie is present
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGc...",
  "user": { ... }
}
```

### POST `/auth/logout`
Invalidate refresh token and logout.

**Request:** (refresh token from cookie, or in body)
```json
{
  "refreshToken": "abc123..."  // optional if cookie is present
}
```

## How It Works

1. **Login**: User logs in → receives short-lived access token + long-lived refresh token
2. **API Calls**: Client includes access token in requests
3. **Token Expiry**: When access token expires (15 min), client uses refresh token to get new access token
4. **Logout**: Refresh token is deleted from database
5. **Cleanup**: Expired refresh tokens are automatically cleaned up every hour

## Security Features

✅ Short-lived access tokens (15 minutes)
✅ Refresh tokens stored in database (can be revoked)
✅ httpOnly cookies for refresh tokens (prevents XSS)
✅ Automatic cleanup of expired tokens
✅ No token blacklist needed (tokens expire quickly)

## Migration

Run migrations to create necessary tables:
```bash
cd backend
npx sequelize-cli db:migrate
```

## Environment Variables

```env
JWT_SECRET=your_secret_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```
