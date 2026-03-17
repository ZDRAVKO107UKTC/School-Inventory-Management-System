# School-Inventory-Management-System
A comprehensive inventory management system for schools built with Node.js, Express, and PostgreSQL. Designed to manage equipment requests, user roles, and school resources efficiently.
---
## Features
- User Authentication & Authorization: Secure JWT-based authentication with role-based access control (RBAC)
- Role-Based Access Control: Three roles implemented:
  - admin: Full system access, user and role management
  - teacher: Can request and manage equipment
  - student: Can request equipment (basic role)
- Equipment Management: Add, view, and manage school equipment inventory
- Equipment Requests: Students and teachers can request equipment with tracking and status management
- Admin Controls: Admins can manage users, assign roles, create equipment, and handle requests
- Audit Logging: Role changes and critical operations are logged for security and traceability
- JWT Refresh Tokens: Secure session management with refresh token rotation
- Database Migrations: Versioned database schema management for consistent deployments
---
## Project Structure
The backend follows a modular, scalable architecture:
`
backend/
├── config/              # Configuration files
│   ├── config.js       # Environment configuration
│   └── db.js           # Database connection setup
├── migrations/          # Database schema migrations
├── models/             # Sequelize ORM models
│   ├── User.js         # User model with roles
│   ├── Equipment.js    # Equipment inventory model
│   ├── Request.js      # Equipment request model
│   ├── RefreshToken.js # Refresh token model
│   └── index.js        # Model associations
├── src/
│   ├── config/         # Database configuration
│   ├── controllers/    # Request handlers
│   │   ├── authController.js        # Authentication logic
│   │   ├── adminController.js       # Admin operations (user & role management)
│   │   ├── equipmentController.js   # Equipment management
│   │   └── requestController.js     # Equipment requests
│   ├── middleware/     # Custom middleware
│   │   ├── authMiddleware.js        # JWT authentication & authorization
│   │   └── errorHandler.js          # Centralized error handling
│   ├── routes/         # API endpoint definitions
│   │   ├── authRoutes.js            # Authentication endpoints
│   │   ├── adminRoutes.js           # Admin endpoints
│   │   ├── equipmentRoutes.js       # Equipment endpoints
│   │   ├── requestRoutes.js         # Request endpoints
│   │   └── userRoutes.js            # User endpoints
│   ├── services/       # Business logic layer
│   │   ├── authService.js           # Auth service functions
│   │   ├── equipmentService.js      # Equipment business logic
│   │   └── requestService.js        # Request business logic
│   ├── jobs/           # Background jobs
│   │   └── tokenCleanup.js          # Expired token cleanup
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── seed.js             # Database seeding script
├── package.json        # Node dependencies
├── docker-compose.yml  # Docker database setup
└── postman_collection.json # API endpoints documentation
`
---
## Database Schema
### Users Table
- id: UUID primary key
- username: Unique username
- email: Unique email address
- password: Hashed password (bcrypt)
- role: User role (student, teacher, admin)
- createdAt, updatedAt: Timestamps
### Equipment Table
- id: UUID primary key
- name: Equipment name
- description: Equipment details
- quantity: Available quantity
- status: Active/Inactive
- createdAt, updatedAt: Timestamps
### Requests Table
- id: UUID primary key
- userId: FK to Users
- equipmentId: FK to Equipment
- quantity: Requested quantity
- status: pending, approved, rejected, returned
- requestDate: When requested
- returnDate: When expected to be returned (nullable)
- createdAt, updatedAt: Timestamps
### Refresh Tokens Table
- id: UUID primary key
- userId: FK to Users
- token: JWT refresh token
- expiresAt: Token expiration time
- createdAt: Timestamp
---
## Authentication & Authorization
### JWT Token Structure
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "role": "student|teacher|admin",
  "iat": 1234567890,
  "exp": 1234571490
}
### Role-Based Permissions
| Endpoint | Student | Teacher | Admin |
|----------|---------|---------|-------|
| POST /auth/register | YES | YES | YES |
| POST /auth/login | YES | YES | YES |
| GET /equipment | YES | YES | YES |
| POST /admin/users | NO | NO | YES |
| PUT /admin/users/:id/role | NO | NO | YES |
| POST /admin/equipment | NO | NO | YES |
| POST /requests | YES | YES | NO |
| GET /requests | YES | YES | YES |
| PUT /requests/:id/status | NO | NO | YES |
---
## Current Implementation Status
### Completed
- Database schema with migrations
- User model with role-based access control (student, teacher, admin)
- Equipment inventory management
- Equipment request system
- JWT authentication with refresh tokens
- Auth middleware with role authorization
- Admin controller with user management
- Admin endpoint for role assignment (PUT /admin/users/:id/role)
- Audit logging for role changes
- Database seeding with initial data (users, equipment)
- Error handling middleware
- Docker setup for PostgreSQL
### Project Optimizations Applied
- Security: JWT validation, password hashing, role-based authorization
- Error Handling: Centralized error handler with meaningful error messages
- Audit Logging: Track admin operations (role changes, user creation)
- Code Organization: Modular structure (controllers, services, middleware, routes)
- Database: Proper migrations, relationships, and seeding
- API Design: RESTful principles with consistent response formats
---
## API Endpoints
### Authentication
- POST /auth/register - Register new user
- POST /auth/login - Login user
- POST /auth/refresh - Refresh JWT token
### Equipment Management
- GET /equipment - Get all equipment
- GET /equipment/:id - Get equipment details
- POST /admin/equipment - Create equipment (Admin only)
### Equipment Requests
- POST /requests - Create new request
- GET /requests - Get all requests (with filters)
- GET /requests/:id - Get request details
- PUT /requests/:id/status - Update request status (Admin only)
### Admin/User Management
- POST /admin/users - Create user (Admin only)
- PUT /admin/users/:id/role - Update user role (Admin only)
- GET /users - Get all users
---
## Environment Variables
Create a .env file in the backend directory:
NODE_ENV=development
PORT=5000
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_inventory
DB_USER=postgres
DB_PASSWORD=password
# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
---
## Getting Started
### Prerequisites
- Node.js >= 14.x
- PostgreSQL >= 12.x
- npm or yarn
### Installation
1. Clone the repository:
git clone <repository-url>
cd School-Inventory-Management-System
2. Install dependencies:
cd backend
npm install
3. Set up environment variables:
cp .env.example .env
# Edit .env with your configuration
4. Set up the database:
npx sequelize-cli db:drop  # Drop existing database
npx sequelize-cli db:create # Create database
npx sequelize-cli db:migrate # Run migrations
node seed.js # Seed initial data
5. Start the server:
npm start
# or npm run dev (for development with auto-reload)
The server will run on http://localhost:5000
---
## Testing
Use Postman or the provided postman_collection.json to test API endpoints.
Key test users after seeding:
- Admin: username: admin_user, password: admin123
- Teacher: username: teacher_user, password: teacher123
- Student: username: john_doe, password: student123
---
## Docker Setup
To run PostgreSQL with Docker:
docker-compose up -d
This will start a PostgreSQL container with the credentials specified in docker-compose.yml.
---
## Notes
- All passwords are hashed using bcrypt before storage
- JWT tokens expire in 15 minutes; use refresh tokens for new access tokens
- Role changes are logged for audit purposes
- The system uses UUID for all primary keys
- Database schema is versioned using Sequelize migrations
---
## License
Proprietary - School Inventory Management System
