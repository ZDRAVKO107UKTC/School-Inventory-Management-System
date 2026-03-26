# Project Architecture & Code Organization

## Overview

School Inventory Management System (SIMS) is a full-stack application built with:

- **Frontend**: React 18 + TypeScript + Tailwind CSS (Vite)
- **Backend**: Node.js + Express + PostgreSQL
- **Architecture**: Monolithic with microservices-ready structure

---

## Directory Structure

### Root Level

```
FE-BE-UNIFIED/
├── frontend/                 # React + TypeScript SPA
├── backend/                  # Node.js + Express REST API
├── scripts/                  # Deployment and automation scripts
└── README.md                 # Project documentation
```

### Backend (`backend/`)

```
├── config/                   # Database configuration
│   └── config.js            # Sequelize multi-env config
├── migrations/              # Database schema versions
├── models/                  # Sequelize ORM models
│   ├── User.js
│   ├── Equipment.js
│   ├── BorrowRequest.js
│   └── ...
├── seeders/                 # Test data generation
├── src/
│   ├── app.js              # Express app setup
│   ├── serviceBoundaries.js # Route registration
│   ├── routes/             # REST endpoints
│   │   ├── authRoutes.js
│   │   ├── equipmentRoutes.js
│   │   ├── requestRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── documentRoutes.js
│   │   └── spatialRoutes.js
│   ├── controllers/        # Request handlers (business logic)
│   │   ├── authController.js
│   │   ├── equipmentController.js
│   │   ├── requestController.js
│   │   ├── adminController.js
│   │   ├── reportController.js
│   │   ├── documentController.js
│   │   └── spatialController.js
│   ├── services/           # Data access & external APIs
│   │   ├── authService.js
│   │   ├── equipmentService.js
│   │   ├── requestService.js
│   │   ├── adminService.js
│   │   ├── documentService.js
│   │   ├── googleSheetsService.js (Google API client)
│   │   └── emailService.js
│   ├── middleware/         # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── validators.js   # Input validation rules
│   ├── utils/              # Helper functions
│   │   ├── AppError.js     # Error wrapper class
│   │   ├── pagination.js
│   │   ├── validateEnvironment.js
│   │   └── logger.js
│   └── public/             # Static files
│       └── uploads/        # User-uploaded documents
├── .env.example            # Environment variables template
├── .env                    # Actual environment (git-ignored)
├── package.json
├── server.js               # Entry point
└── README.md               # API documentation

**Total Services**: 7 (Auth, Equipment, Requests, Admin, Reports, Documents, Spatial)
```

### Frontend (`frontend/`)

```
├── public/                      # Static assets
│   ├── icons/                  # SVG icons
│   └── logos/
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── ui/                # Primitives (Button, Input, Card, etc.)
│   │   ├── auth/              # Auth page components
│   │   ├── dashboard/         # Dashboard components
│   │   └── admin/             # Admin panel components
│   ├── features/              # Feature modules (domain-organized)
│   │   ├── inventory/         # Equipment browsing
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── requests/          # Borrow request workflow
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── admin/             # Admin management
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── analytics/         # Reports & analytics
│   │       ├── pages/
│   │       ├── components/
│   │       └── hooks/
│   ├── pages/                 # Top-level pages
│   │   ├── AuthPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/              # API clients & contracts
│   │   ├── apiClient.ts       # HTTP wrapper + auth intercept
│   │   ├── authService.ts
│   │   ├── equipmentService.ts
│   │   ├── requestService.ts
│   │   └── userService.ts
│   ├── stores/                # Zustand state management
│   │   ├── authStore.ts       # Auth state
│   │   ├── equipmentStore.ts  # Inventory state
│   │   ├── requestStore.ts    # Borrow request state
│   │   ├── uiStore.ts         # UI state (theme, modals)
│   │   └── notificationStore.ts
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   ├── useAsync.ts
│   │   └── useNotification.ts
│   ├── types/                 # TypeScript type definitions
│   │   ├── api.ts             # API response types + utilities
│   │   ├── auth.ts            # Auth types (User, LoginRequest)
│   │   ├── equipment.ts       # Equipment DTOs
│   │   ├── request.ts         # Borrow request DTOs
│   │   └── index.ts
│   ├── utils/                 # Helper functions
│   │   ├── constants.ts       # App constants
│   │   ├── formatting.ts      # Date/currency/string utils
│   │   ├── validation.ts      # Form validation
│   │   └── errorHandling.ts
│   ├── styles/                # Global styles
│   │   ├── globals.css        # Design tokens + reset
│   │   └── animations.css     # Keyframes
│   ├── config/                # Configuration
│   │   ├── api.ts             # API endpoint config
│   │   └── theme.ts
│   ├── App.tsx                # Root component
│   └── main.tsx               # Entry point
├── index.html                 # HTML shell
├── .env.example               # Environment template
├── .env                       # Actual env (git-ignored)
├── tsconfig.json              # TypeScript config with path aliases
├── vite.config.ts             # Vite bundler config
├── tailwind.config.js         # Tailwind CSS config
├── postcss.config.js          # PostCSS plugins
├── package.json
└── README.md                  # Frontend documentation
```

---

## Data Flow Architecture

### Authentication Flow

```
1. User Input (LoginForm.tsx)
   ↓
2. Zustand authStore (handle loading, error state)
   ↓
3. authService.login() → apiClient.post('/auth/login')
   ↓
4. Backend: POST /auth/login → authController.login()
   ↓
5. authService.js: Validate credentials, generate JWT
   ↓
6. Response: { token, user }
   ↓
7. Frontend: Store token in localStorage, update authStore.user
   ↓
8. apiClient adds Authorization header to all future requests
   ↓
9. Protected routes redirect to DashboardPage
```

### Equipment Listing Flow

```
1. Page Mount: DashboardPage.tsx
   ↓
2. useEffect() → equipmentStore.fetchEquipment()
   ↓
3. equipmentService.getAll() → apiClient.get('/equipment?page=1&limit=25')
   ↓
4. Backend: GET /equipment → equipmentController.getPaginatedEquipment()
   ↓
5. equipmentService: Query DB, apply pagination
   ↓
6. Response: { data: [...], pagination: {...} }
   ↓
7. Frontend: equipmentStore updates with normalized data
   ↓
8. EquipmentCard.tsx renders from store (automatic re-render via Zustand subscriber)
```

### Error Handling Flow

```
1. API Error Response (400/401/403/500)
   ↓
2. apiClient.ts catches error, checks statusCode
   ↓
3. If 401: Attempt token refresh → retry request
   ↓
4. If failed: Pass error to caller
   ↓
5. Component's try/catch or error state updates
   ↓
6. notificationStore adds toast/error message
   ↓
7. UI renders Toast component with error message
   ↓
8. User sees human-readable error with recovery options
```

---

## Communication Patterns

### Request/Response Format

**Request:**

```typescript
POST /auth/login
Content-Type: application/json
Authorization: Bearer <token>  // if authenticated endpoint

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (Success):**

```typescript
{
  "success": true,
  "data": { /* resource */ },
  "pagination": { /* if paginated */ },
  "message": "Optional message"
}
```

**Response (Error):**

```typescript
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "details": [{ field, message, value }]  // if validation error
}
```

---

## State Management Strategy

### Zustand Store Architecture

```typescript
// Pattern for all stores
export const useXyzStore = create((set) => ({
  // State
  items: [],
  loading: false,
  error: null,

  // Actions
  async fetchItems() {
    set({ loading: true });
    try {
      const response = await service.getAll();
      if (isSuccess(response)) {
        set({ items: response.data, error: null });
      }
    } catch (e) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  addItem(item) {
    set((state) => ({ items: [...state.items, item] }));
  },
}));

// Usage
const items = useXyzStore((s) => s.items);
const { fetchItems } = useXyzStore();
```

### Store Subscriptions

```typescript
// Component subscribes to store changes
useEffect(() => {
  const unsub = useXyzStore.subscribe(
    (state) => state.items,
    (items) => console.log("Items changed:", items),
  );
  return () => unsub();
}, []);
```

---

## Service Layer Organization

### Controllers (Backend)

**Responsibility:** HTTP request/response handling

```typescript
controller.getAll(req, res, next) {
  // 1. Extract query parameters
  const pagination = resolvePagination(req.query);

  // 2. Call service (business logic)
  try {
    const data = await service.getAll(filters, pagination);

    // 3. Send response
    sendPaginatedResponse(res, data, pagination);
  } catch (err) {
    next(err);  // Pass to error middleware
  }
}
```

### Services (Backend)

**Responsibility:** Business logic + database access

```typescript
service.getAll(filters, pagination) {
  // 1. Build query
  const where = { status: 'active' };

  // 2. Query database
  const { rows, count } = await Model.findAndCountAll({
    where,
    limit: pagination.limit,
    offset: pagination.offset,
  });

  // 3. Transform/validate
  return { rows: rows.map(transform), count };
}
```

### API Clients (Frontend)

**Responsibility:** HTTP communication + type safety

```typescript
export const equipmentService = {
  async getAll(query: string) {
    return apiClient.get<Equipment[]>(`/equipment?${query}`);
  },

  async create(equipment: CreateEquipmentDto) {
    return apiClient.post<Equipment>("/equipment", equipment);
  },
};
```

---

## Type Safety Layers

### Backend → Frontend Type Contract

```
Backend Response
├── Shape defined in controller
├── Validated by errorHandler middleware
└── Frontend expects via TypeScript interface

TypeScript Interface
├── Equipment type in equipment.ts
├── Used in EquipmentService.getAll<Equipment[]>()
└── IntelliSense + compile-time checks in components
```

### Validation Strategy

**Backend:**

- Input validation: express-validator + custom validators
- Type coercion: Sequelize models enforce types
- Error serialization: AppError class

**Frontend:**

- Response type guards: isSuccess<T>(), isError()
- Form validation: custom validators + zod/yup
- Runtime checks: optional chaining (?.) + nullish coalescing (??)

---

## Middleware Pipeline

### Express Middleware Order

```javascript
1. cors()                      // CORS headers
2. express.json()              // Parse JSON body
3. express.urlencoded()        // Parse form data
4. cookieParser()              // Parse cookies
5. authMiddleware              // Extract user from JWT
6. validators[].run()          // Validate request
7. handleValidationErrors()    // Check for validation errors
8. Controller Handler          // Business logic
9. errorHandler                // Catch all errors and format
```

### Custom Middleware

| Middleware     | Purpose                                    | Order                   |
| -------------- | ------------------------------------------ | ----------------------- |
| authMiddleware | Extract & validate JWT token               | Before protected routes |
| authorizeRoles | Check user role                            | Before admin routes     |
| validators     | Validate request body/params/query         | Before controller       |
| errorHandler   | Catch exceptions and format error response | Last (4 params)         |

---

## Error Handling Architecture

### Error Flow

```
Controller throws AppError
    ↓
Express catches with try/catch or next(error)
    ↓
errorHandler middleware (4 params: err, req, res, next)
    ↓
Check error.code (DB code) or error.name (JWT name)
    ↓
Normalize to AppError with statusCode
    ↓
Respond with standardized JSON
```

### Error Classes

```typescript
// Base error class
class AppError extends Error {
  constructor(message, statusCode = 500) {
    this.statusCode = statusCode;
    this.isOperational = true; // Expected error (not programming bug)
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      statusCode: this.statusCode,
    };
  }
}

// Database error mapping
if (err.code === "23505")
  // Unique violation
  throw new AppError("Email already exists", 409);
```

---

## API Conventions

### RESTful Endpoints

```
GET    /equipment              # List (paginated)
GET    /equipment/:id          # Get one
POST   /equipment              # Create (admin only)
PUT    /equipment/:id          # Update (admin only)
DELETE /equipment/:id          # Delete (admin only)

GET    /requests               # List my requests
POST   /requests               # Create request
PUT    /requests/:id/approve   # Admin approve
PUT    /requests/:id/reject    # Admin reject
```

### Query Parameters

```
GET /equipment?page=1&limit=25&search=laptop&status=active

Parsed by:
- resolvePagination(req.query) → { page, limit, offset }
- equipmentService.getAll(filters) → query the database
- buildPaginationMeta(total, pagination) → { ...meta }
- sendPaginatedResponse(res, data, meta) → send response
```

### Request/Response Headers

```
Request:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json

Response (Success):
  Content-Type: application/json
  X-Page: 1
  X-Limit: 25
  X-Total-Count: 150
  X-Total-Pages: 6

Response (Error):
  Content-Type: application/json
  (statusCode indicates error type)
```

---

## Component Organization (Frontend)

### Feature Module Pattern

Each feature (inventory, requests, admin) follows:

```typescript
src/features/inventory/
├── pages/
│   ├── InventoryPage.tsx       # Main page component
│   └── EquipmentDetailPage.tsx # Detail page
├── components/
│   ├── EquipmentCard.tsx       # Reusable UI
│   ├── EquipmentList.tsx       # List wrapper
│   └── EquipmentFilters.tsx    # Filter bar
├── hooks/
│   └── useInventory.ts         # Custom hook for state logic
└── types/
    └── index.ts               # Feature-specific types (optional)
```

### Component Hierarchy

```
App
├── AuthPage
│   ├── LoginForm
│   ├── SignupForm
│   └── OAuthButtons
├── DashboardPage (if authenticated)
│   ├── Header
│   ├── features/inventory/InventoryPage
│   │   ├── EquipmentList
│   │   │   └── EquipmentCard (×N)
│   │   └── EquipmentFilters
│   └── Sidebar
└── AdminPage (if role === 'admin')
    ├── features/admin/AdminDashboard
    ├── UserManagementPanel
    └── AnalyticsView
```

---

## Database Schema Organization

### Model Files

```
models/
├── User.js           # id, username, email, password, role
├── Equipment.js      # id, name, type, quantity, status
├── BorrowRequest.js  # id, user_id, equipment_id, status
├── Document.js       # id, filename, category, url
└── Location.js       # id, latitude, longitude, building
```

### Relationships

```typescript
User.hasMany(BorrowRequest, { foreignKey: "user_id" });
BorrowRequest.belongsTo(User, { foreignKey: "user_id" });

Equipment.hasMany(BorrowRequest, { foreignKey: "equipment_id" });
BorrowRequest.belongsTo(Equipment, { foreignKey: "equipment_id" });

// Join Example:
BorrowRequest.findAll({
  include: [
    { model: User, attributes: ["id", "username"] },
    { model: Equipment, attributes: ["id", "name"] },
  ],
});
```

---

## Configuration Management

### Environment Variables (`.env`)

**Backend:**

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=development
LOG_DB_QUERIES=false
```

**Frontend:**

```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=...
```

### Runtime Configuration

**Backend:**

- `src/utils/validateEnvironment.js` - validates all required env vars at startup
- `config/config.js` - database config per environment

**Frontend:**

- `src/config/api.ts` - API endpoint configuration
- `src/config/theme.ts` - Theme configuration

---

## Build & Deployment

### Frontend Build

```
npm run build
├── TypeScript compilation (tsconfig.json)
├── Bundling with Vite
├── Tailwind CSS minification
└── Output: dist/ folder (production-ready)
```

### Backend Build

```
Node.js runs directly (no compilation step)
- TypeScript compiled via ts-node or tsc
- Dependencies loaded from node_modules/
```

### Deployment Checklist

**Frontend:**

- [ ] `.env.VITE_API_URL` points to production backend
- [ ] `npm run build` succeeds
- [ ] `dist/` folder deployed to static hosting (Vercel, Netlify)

**Backend:**

- [ ] `NODE_ENV=production`
- [ ] `.env` with production values (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Run migrations: `npm run migrate`
- [ ] Start: `npm start` (or use PM2/systemd)

---

## Development Workflows

### Adding New API Endpoint

1. **Backend:**
   - Create route: `routes/xyz.js`
   - Create controller: `controllers/xyzController.js`
   - Create service: `services/xyzService.js`
   - Register in `serviceBoundaries.js`

2. **Frontend:**
   - Create service: `services/xyzService.ts`
   - Create Zustand store: `stores/xyzStore.ts`
   - Create page/component: `features/xyz/pages/*.tsx`
   - Import and use in parent component

### Adding New Database Model

1. Generate migration: `npm run migrate:create addXyzTable`
2. Define model: `models/Xyz.js`
3. Define relationships in model file
4. Seeds (optional): Seed test data in `seeders/`

### Type Generation from Backend

Frontend types should match backend response format:

```typescript
// If backend returns:
{
  (id, name, status, createdAt);
}

// Frontend defines:
interface Equipment {
  id: number;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
}
```

---

## Performance Considerations

### Frontend Optimization

- **Code splitting:** React Router lazy-load feature modules
- **Image optimization:** Next.js Image or similar
- **Bundle size:** Tree-shake unused components
- **API caching:** React Query / SWR

### Backend Optimization

- **Database indexes:** On frecuently queried columns
- **Pagination:** Always paginate large result sets
- **Connection pooling:** Sequelize configuration
- **Caching:** Redis for frequently read data

---

## Security Best Practices

### Frontend

- XSS prevention: React auto-escapes JSX text
- CSRF: Backend sends CSRF token in cookie
- Dependency scanning: `npm audit`

### Backend

- SQL injection: Sequelize ORM parameterizes queries
- Password: Bcrypted (not stored plain)
- JWT: Strong SECRET_KEY + HTTPS only
- Validation: express-validator on all inputs
- Rate limiting: (Future: add helmet.js)

---

## Testing Strategy (Future)

### Backend Tests

```
tests/
├── unit/
│   ├── services/
│   ├── middleware/
│   └── utils/
└── integration/
    ├── endpoints.test.js
    └── database.test.js
```

### Frontend Tests

```
src/
├── __tests__/
├── components/  # .test.tsx files
├── hooks/       # .test.ts files
└── utils/       # .test.ts files
```

---

## References

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [API Error Codes](./backend/ERROR_CODES.md)
- [Database Migrations Guide](./backend/migrations/README.md)
