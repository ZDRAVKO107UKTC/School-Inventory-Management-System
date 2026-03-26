# School Inventory Management System (SIMS) - Backend API Documentation

> Node.js/Express REST API for inventory management with role-based access control, Google Sheets integration, and microservices-ready architecture.

## Quick Start

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Seed test data (optional)
npm run seed

# Start development server
npm run dev
```

Server runs on `http://localhost:5000`

---

## Architecture

### Project Structure

```
backend/
├── config/              # Database configuration
├── migrations/          # Database schema migrations
├── models/             # Sequelize ORM models
├── seeders/            # Test data seeders
├── src/
│   ├── controllers/    # Request handlers (7 services)
│   ├── routes/         # REST endpoints
│   ├── services/       # Business logic
│   ├── middleware/     # Auth, validation, error handling
│   ├── utils/          # Helpers (pagination, errors, validation)
│   └── app.js          # Express app setup
└── server.js           # Entry point
```

### Service Boundaries (Monolith → Microservices Ready)

| Service               | Port | Responsibility                            |
| --------------------- | ---- | ----------------------------------------- |
| **Inventory Service** | 3001 | Equipment management, stock tracking      |
| **Requests Service**  | 3002 | Borrow/return request workflows           |
| **Reports Service**   | 3003 | Analytics, exports, Google Sheets backups |
| **Auth Service**      | 3004 | User authentication, JWT validation       |

_Currently runs as monolith on port 5000; structure supports extraction._

---

## API Endpoints

### Authentication

| Method | Endpoint               | Description              | Auth |
| ------ | ---------------------- | ------------------------ | ---- |
| POST   | `/auth/login`          | User login               | ❌   |
| POST   | `/auth/signup`         | Register new user        | ❌   |
| POST   | `/auth/refresh`        | Refresh JWT token        | ✅   |
| POST   | `/auth/logout`         | Logout user              | ✅   |
| POST   | `/auth/reset-password` | Reset forgotten password | ❌   |

**Login Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Login Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "user1",
      "role": "admin"
    }
  }
}
```

### Equipment Management

| Method | Endpoint         | Description                    | Auth     |
| ------ | ---------------- | ------------------------------ | -------- |
| GET    | `/equipment`     | List all equipment (paginated) | ✅       |
| GET    | `/equipment/:id` | Get equipment details          | ✅       |
| POST   | `/equipment`     | Create new equipment           | ✅ admin |
| PUT    | `/equipment/:id` | Update equipment               | ✅ admin |
| DELETE | `/equipment/:id` | Delete equipment               | ✅ admin |

**List Equipment Query Parameters:**

```
GET /equipment?page=1&limit=25&search=laptop&status=active
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Dell Laptop",
      "type": "laptop",
      "quantity": 5,
      "status": "active",
      "location": "Building A"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "totalItems": 50,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Borrow/Return Requests

| Method | Endpoint                | Description           | Auth     |
| ------ | ----------------------- | --------------------- | -------- |
| GET    | `/requests`             | List all requests     | ✅       |
| POST   | `/requests`             | Create borrow request | ✅ user  |
| GET    | `/requests/:id`         | Get request details   | ✅       |
| PUT    | `/requests/:id/approve` | Approve request       | ✅ admin |
| PUT    | `/requests/:id/reject`  | Reject request        | ✅ admin |
| POST   | `/requests/:id/return`  | Return borrowed item  | ✅ user  |

### Admin Management

| Method | Endpoint                | Description      | Auth     |
| ------ | ----------------------- | ---------------- | -------- |
| GET    | `/admin/users`          | List all users   | ✅ admin |
| POST   | `/admin/users`          | Create new user  | ✅ admin |
| PUT    | `/admin/users/:id`      | Update user      | ✅ admin |
| DELETE | `/admin/users/:id`      | Delete user      | ✅ admin |
| PUT    | `/admin/users/:id/role` | Change user role | ✅ admin |

### Reports & Exports

| Method | Endpoint                 | Description             | Auth     |
| ------ | ------------------------ | ----------------------- | -------- |
| GET    | `/reports/inventory`     | Inventory report        | ✅ admin |
| GET    | `/reports/requests`      | Request history report  | ✅ admin |
| POST   | `/reports/export-csv`    | Export to CSV           | ✅ admin |
| POST   | `/reports/export-sheets` | Export to Google Sheets | ✅ admin |

### Documents (Policy, Manuals, Forms)

| Method | Endpoint                  | Description         | Auth     |
| ------ | ------------------------- | ------------------- | -------- |
| GET    | `/documents`              | List documents      | ✅       |
| POST   | `/documents/upload`       | Upload new document | ✅ admin |
| GET    | `/documents/:id/download` | Download document   | ✅       |
| DELETE | `/documents/:id`          | Delete document     | ✅ admin |

### Location Management

| Method | Endpoint                 | Description        | Auth     |
| ------ | ------------------------ | ------------------ | -------- |
| GET    | `/spatial/locations`     | List all locations | ✅       |
| POST   | `/spatial/locations`     | Create location    | ✅ admin |
| PUT    | `/spatial/locations/:id` | Update location    | ✅ admin |
| DELETE | `/spatial/locations/:id` | Delete location    | ✅ admin |

---

## Error Handling

### Standardized Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2024-03-26T10:30:00Z"
}
```

### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Valid email is required",
      "value": "invalid-email"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created                              |
| 400  | Bad Request (validation error)       |
| 401  | Unauthorized (missing/invalid token) |
| 403  | Forbidden (insufficient permissions) |
| 404  | Not Found                            |
| 409  | Conflict (duplicate unique field)    |
| 500  | Internal Server Error                |

### Specific Error Codes

| Status | Error                                  | Cause                             |
| ------ | -------------------------------------- | --------------------------------- |
| 401    | Access token is missing                | No `Authorization: Bearer` header |
| 401    | Invalid or expired token               | JWT validation failed             |
| 401    | Token has expired                      | JWT token past expiry time        |
| 403    | Forbidden: requires one of roles [...] | User lacks required role          |
| 409    | Email already exists                   | Duplicate email in signup         |
| 409    | Username already exists                | Duplicate username in signup      |

---

## Authentication & Authorization

### JWT Token

Token included in `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload:**

```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Role-Based Access Control

```javascript
// Example: Only admins can delete equipment
DELETE /equipment/1  // Requires role: 'admin'

// Authorization header required
Authorization: Bearer <token_where_role_is_admin>
```

**Roles:**

- `admin` - Full system access
- `staff` - Can manage requests and documents
- `user` - Can only view and request equipment

---

## Input Validation

All endpoints validate input using [express-validator](https://express-validator.github.io/). Invalid data returns 400 with field-specific errors.

### Example: Create Equipment

**Request:**

```bash
curl -X POST http://localhost:5000/equipment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "MacBook Pro",
    "type": "laptop",
    "quantity": 3,
    "location": "Building A"
  }'
```

**Validation Rules:**

- `name`: Required, 2-100 characters
- `type`: One of `[laptop, desktop, tablet, projector, camera, other]`
- `quantity`: Must be non-negative integer
- `location`: Optional, max 100 characters

**Invalid Request Response:**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "type",
      "message": "Invalid equipment type",
      "value": "laptop2"
    }
  ]
}
```

---

## Database Models

### User

```javascript
{
  id: Integer (PK),
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: Enum['admin', 'staff', 'user'],
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Equipment

```javascript
{
  id: Integer (PK),
  name: String,
  type: String,
  serialNumber: String,
  quantity: Integer,
  status: Enum['active', 'inactive', 'damaged', 'maintenance'],
  location: String,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### BorrowRequest

```javascript
{
  id: Integer (PK),
  userId: Integer (FK → User),
  equipmentId: Integer (FK → Equipment),
  quantity: Integer,
  requestDate: DateTime,
  returnDate: DateTime,
  status: Enum['pending', 'approved', 'rejected', 'returned'],
  approvedBy: Integer (FK → User),
  notes: Text
}
```

---

## Environment Configuration

See [.env.example](.env.example) for complete configuration options.

**Required Variables:**

```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5433/school_inventory
JWT_SECRET=your-secret-key-min-32-chars
```

**Optional:** Google Sheets integration, email service, microservices ports

---

## Development

### Common Commands

```bash
# Start dev server (hot reload)
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Check for unused code
npm run analyze

# Create migration
npm run migrate:create --name=migration_name

# Run migrations
npm run migrate

# Seed database
npm run seed

# Build for production
npm run build
```

### Database Migrations

Migrations are version-controlled SQL scripts in `migrations/`. Run automatically on app start or manually:

```bash
npm run migrate        # Run pending migrations
npm run rollback       # Undo last migration
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run with coverage
npm test -- --coverage
```

---

## Deployment

### Production Build

```bash
NODE_ENV=production npm start
```

### Environment Requirements

- ✅ `NODE_ENV=production`
- ✅ `DATABASE_URL` set (SSL recommended)
- ✅ `JWT_SECRET` set to strong random value (32+ chars)
- ✅ CORS origins configured for frontend domain
- ✅ Google Service Account configured (if using Sheets export)
- ✅ Email service configured (if using notifications)

### Docker

```bash
docker build -t sims-backend .
docker run -p 5000:5000 --env-file .env sims-backend
```

---

## Troubleshooting

### Database Connection Failed

- Check `DATABASE_URL` format
- Verify PostgreSQL running on correct host/port
- Check credentials in `.env`
- Run migrations: `npm run migrate`

### JWT Token Errors

- Ensure `JWT_SECRET` is set and consistent
- Token may be expired (check with `jwt-cli`)
- Clear browser cookies and re-login

### Google Sheets Export Fails (403 Forbidden)

- Verify service account JSON in `GOOGLE_SERVICE_ACCOUNT_JSON`
- Share target spreadsheet with service account email
- Check Google Cloud Console → APIs & Services → Google Sheets API is enabled

### CORS Errors

- Add frontend URL to `ALLOWED_ORIGINS` env var
- Separate multiple origins with commas
- Restart server after changing

---

## Support & Maintenance

### Monitoring

- Enable `LOG_DB_QUERIES=true` to debug slow queries
- Check application logs for errors
- Monitor database connection pool usage

### Performance Tuning

- Add database indexes on frequently filtered columns
- Implement caching for read-heavy endpoints
- Consider microservices extraction for scaling

### Security

- Rotate `JWT_SECRET` regularly
- Use HTTPS in production
- Keep dependencies updated: `npm audit fix`
- Implement rate limiting on auth endpoints

---

## Contributing

1. Create branch: `git checkout -b feature/name`
2. Make changes and run tests: `npm test`
3. Submit PR for code review
4. Ensure CI/CD passes before merge

---

## License

Reserved © 2024 Tech Academy
