# API Error Codes & Troubleshooting

Complete reference of all error codes, status codes, and solutions for the School Inventory Management System API.

## HTTP Status Codes

| Code | Name                  | When Used                                | Retry   |
| ---- | --------------------- | ---------------------------------------- | ------- |
| 200  | OK                    | Request successful                       | N/A     |
| 201  | Created               | Resource created successfully            | N/A     |
| 400  | Bad Request           | Invalid input, validation failed         | ❌ No   |
| 401  | Unauthorized          | Missing or invalid authentication token  | ❌ No\* |
| 403  | Forbidden             | Authenticated but lacks permissions      | ❌ No   |
| 404  | Not Found             | Resource doesn't exist                   | ❌ No   |
| 409  | Conflict              | Duplicate unique field (email, username) | ❌ No   |
| 500  | Internal Server Error | Server error, unexpected exception       | ✅ Yes  |
| 503  | Service Unavailable   | Maintenance or temporary outage          | ✅ Yes  |

\*401 should be retried after refreshing token via `/auth/refresh`

---

## Authentication Errors (401, 403)

### 401: Access token is missing

**Message:** `"Access token is missing"`

**Causes:**

- No `Authorization` header in request
- `Authorization` header doesn't start with `Bearer `

**Example Bad Request:**

```bash
curl http://localhost:5000/equipment  # Missing Authorization header
```

**Solution:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/equipment
```

---

### 401: Invalid or malformed token

**Message:** `"Invalid or malformed token"`

**Causes:**

- Token was corrupted or modified
- Token from wrong server instance (different `JWT_SECRET`)

**Solution:**

1. Delete current token from storage (browser localStorage/cookies)
2. Re-login with `/auth/login`
3. Use new token in all requests

---

### 401: Token has expired

**Message:** `"Token has expired"`

**Causes:**

- Token's `exp` claim is in the past
- Token was issued with short `JWT_EXPIRY` value

**Solution:**

```javascript
// Automatic token refresh
try {
  response = await apiClient.get("/equipment");
} catch (err) {
  if (err.statusCode === 401) {
    // Attempt refresh
    const refreshResponse = await apiClient.post("/auth/refresh", {});
    // Retry original request with new token
    response = await apiClient.get("/equipment");
  }
}
```

---

### 403: Forbidden: requires one of roles [...]

**Message:** `"Forbidden: requires one of roles [admin]"`

**Causes:**

- User role is `user` or `staff` but endpoint requires `admin`
- User lacks necessary permissions for operation

**Example:**

```bash
# User with role='user' tries to delete equipment
DELETE /equipment/1
Authorization: Bearer <token_with_role_user>
# Returns 403: Requires admin role
```

**Solution:**

- Use account with appropriate role
- Or contact administrator to change your role

---

## Validation Errors (400)

### 400: Validation failed

**Message:** `"Validation failed"`

**Response:**

```json
{
  "success": false,
  "error": "Validation failed",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Valid email is required",
      "value": "notanemail"
    },
    {
      "field": "password",
      "message": "Password must be 8+ chars, including uppercase, lowercase, and number",
      "value": "short"
    }
  ]
}
```

**Common Validation Rules:**

| Field           | Rule                                                      | Example                   |
| --------------- | --------------------------------------------------------- | ------------------------- |
| `email`         | Must be valid email format                                | ✅ `user@example.com`     |
| `password`      | 8+ chars, uppercase, lowercase, number                    | ✅ `SecurePass123`        |
| `username`      | 3-50 chars                                                | ✅ `john_doe`             |
| `quantity`      | Non-negative integer                                      | ✅ `5`                    |
| `equipmentType` | One of: laptop, desktop, tablet, projector, camera, other | ✅ `laptop`               |
| `requestDate`   | ISO8601 date format                                       | ✅ `2024-03-26T10:00:00Z` |

**Solution:**

1. Read `details` array for each field's error message
2. Fix validation issues and retry
3. See [Backend README: Input Validation](./README.md#input-validation) for complete rules

---

## Conflict Errors (409)

### 409: Email already exists

**Message:** `"Email already exists"`

**Causes:**

- Email address already registered to another account
- Duplicate email in database

**Example:**

```bash
POST /auth/signup
{
  "email": "existing@example.com",
  "username": "newuser",
  "password": "SecurePass123"
}
# Returns 409: Email already exists
```

**Solution:**

- Use different email address
- Or try login if account already exists

---

### 409: Username already exists

**Message:** `"Username already exists"`

**Causes:**

- Username already taken by another user

**Solution:**

- Choose different username

---

## Database Errors (409, 400)

### 409: Unique constraint violation

**Database Error:** `code="23505"` (PostgreSQL constraint violation)

**When it occurs:**

- Trying to create duplicate entry in unique column
- Foreign key issues

**Example:**

```bash
POST /equipment
{
  "serialNumber": "ABC123"  # Already exists
}
# Returns 409
```

**Solution:**

- Use unique value
- Check existing records before inserting

---

### 400: Missing required field

**Database Error:** `code="23502"` (NOT NULL violation)

**When it occurs:**

- Trying to insert/update with null value in non-nullable column

**Example:**

```bash
POST /equipment
{
  "type": null  # Required field
}
# Returns 400: Missing required field
```

**Solution:**

- Provide values for all required fields

---

### 400: Referenced record not found

**Database Error:** `code="23503"` (Foreign key violation)

**When it occurs:**

- Trying to create request for non-existent equipment
- Trying to assign user to non-existent role

**Example:**

```bash
POST /requests
{
  "equipmentId": 9999  # Equipment ID doesn't exist
}
# Returns 400: Referenced record not found
```

**Solution:**

- Verify IDs exist before referencing
- Get valid equipment IDs from `GET /equipment`

---

## Server Errors (500)

### 500: Internal server error

**Message:** `"Internal server error"` (production) or specific error (development)

**Common Causes:**

- Database connection lost
- Unhandled exception in code
- Missing environment variable

**Development Response:**

```json
{
  "success": false,
  "error": "Cannot read property 'name' of undefined",
  "statusCode": 500,
  "timestamp": "2024-03-26T10:00:00Z"
}
```

**Production Response:**

```json
{
  "success": false,
  "error": "Internal server error",
  "statusCode": 500,
  "timestamp": "2024-03-26T10:00:00Z"
}
```

**Solution:**

1. Check backend logs for error details
2. Verify database connection: `docker ps` (if using Docker)
3. Check environment variables: `echo $DATABASE_URL`
4. Restart backend server: `npm run dev`

---

## JWT Token Errors

### JWT Verification Failed

**Root Causes:**

1. **Wrong JWT_SECRET in environment**

   ```bash
   # Backend generated token with SECRET_A
   # But trying to verify with SECRET_B
   # Solution: Ensure all instances use same JWT_SECRET
   ```

2. **Token from different server**

   ```bash
   # Token generated by http://localhost:5001
   # Trying to use on http://localhost:5000
   # Both servers must have identical JWT_SECRET
   ```

3. **Token tampered with**
   - Token was modified after creation
   - Solution: Get fresh token via login

### Decode JWT Manually (for debugging)

```bash
# Install jwt-cli
npm install -g jwt-cli

# Decode token
jwt decode "eyJhbGciOiJIUzI1NiIs..."

# Shows payload:
# {
#   "userId": 1,
#   "email": "user@example.com",
#   "role": "admin",
#   "iat": 1234567890,
#   "exp": 1234654290
# }
```

---

## Network Errors

### Connection refused

**Message:** `"ECONNREFUSED: Connection refused at 127.0.0.1:5000"`

**Causes:**

- Backend server not running
- Wrong port in `VITE_API_URL`
- Firewall blocking connection

**Solution:**

```bash
# Check if backend port 5000 is open
lsof -i :5000

# Start backend
cd backend
npm run dev
```

---

### Request timeout

**Message:** `"Request timeout after 30000ms"`

**Causes:**

- Backend not responding (slow query, infinite loop)
- Network latency too high
- Large data transfer

**Solution:**

1. Check backend logs for slow queries
2. Increase timeout in `apiClient.ts`
3. Optimize large data transfers (pagination)

---

## Google Sheets Integration Errors

### 403: Permission denied

**Message:** `"Error: Permission denied"`

**Causes:**

- Service account not shared with target spreadsheet
- Google API not enabled in Cloud Console
- Service account lacks IAM roles

**Solution:**

1. Open Google Cloud Console
2. Share target spreadsheet with service account email found in error
3. Grant `Editor` role
4. Enable Google Sheets API + Drive API
5. Wait 1-2 minutes for IAM propagation
6. Retry export

See [Backend README: Deployment](./README.md#deployment) for full setup.

---

## Email Service Errors

### Email sending failed

**Message:** `"Could not send email notification"`

**Causes:**

- Email service not configured
- Invalid EMAIL_USER or EMAIL_PASSWORD
- Gmail account requires app-specific password

**Solution:**

1. Check environment variables: `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`
2. If Gmail: Generate app password (not regular password)
3. Test connection: `npm run test:email`

---

## Debugging Guide

### Enable Database Query Logging

```bash
# In .env
LOG_DB_QUERIES=true

# Restart backend
npm run dev

# All SQL queries will print to console
```

### Check Request/Response in Browser

**Chrome DevTools:**

1. Open DevTools (F12)
2. Go to Network tab
3. Reproduce error
4. Click request → view Response tab
5. Check status code and error message

**Example Error Response:**

```
POST http://localhost:5000/auth/login 400 Bad Request

Response:
{
  "success": false,
  "error": "Validation failed",
  "statusCode": 400,
  "details": [{...}]
}
```

### Test Endpoint with cURL

```bash
# Login request
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }' \
  | jq  # Pretty-print JSON

# Get equipment with auth header
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/equipment \
  | jq
```

---

## Error Response Examples

### Minimal Error (500)

```json
{
  "success": false,
  "error": "Internal server error",
  "statusCode": 500,
  "timestamp": "2024-03-26T10:30:00Z"
}
```

### Rich Error (400 Validation)

```json
{
  "success": false,
  "error": "Validation failed",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Valid email is required",
      "value": "not-an-email"
    },
    {
      "field": "password",
      "message": "Password must be 8+ chars, including uppercase, lowercase, and number",
      "value": "short"
    }
  ]
}
```

### Database Error (409)

```json
{
  "success": false,
  "error": "Email already exists",
  "statusCode": 409,
  "timestamp": "2024-03-26T10:30:00Z"
}
```

---

## Quick Reference Checklist

### 400: Bad Request

- [ ] Check request format (valid JSON)
- [ ] Verify all required fields present
- [ ] Validate field types (string vs number)
- [ ] Check field lengths match rules
- [ ] For dates: use ISO8601 format

### 401: Unauthorized

- [ ] Ensure `Authorization: Bearer <token>` header present
- [ ] Token not expired: `jwt decode <token>`
- [ ] JWT_SECRET matches between servers
- [ ] Try re-login to get fresh token

### 403: Forbidden

- [ ] Check user role: make request to `/auth/me`
- [ ] Verify required role in endpoint documentation
- [ ] Ask admin to update your role

### 404: Not Found

- [ ] Resource ID exists: check GET list endpoint
- [ ] Correct endpoint URL
- [ ] Resource not deleted by another user

### 409: Conflict

- [ ] Email/username not already in use
- [ ] Foreign key references valid records
- [ ] No unique constraint violations

### 500: Server Error

- [ ] Backend running: check `npm run dev`
- [ ] Database connected: check logs
- [ ] Environment variables set: `cat .env`
- [ ] Enable LOG_DB_QUERIES for more detail

---

## Support

For unresolved errors:

1. Enable `LOG_DB_QUERIES=true` in .env
2. Collect full request/response in browser DevTools
3. Check backend console logs
4. Share exact error message + timestamp
