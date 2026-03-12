# School-Inventory-Management-System
## 📂 Project Structure
The backend follows a modular architecture: test
```text
src/
├── config/          # Configuration files (database connections, environment variables)
├── controllers/     # Request handlers (processes input, calls services, sends responses)
    ├── authController.js
├── middleware/      # Custom functions (authentication, error handling, validation)
    ├── validation.js
├── models/          # Database schemas and data definitions (SQL/NoSQL)
├── routes/          # API endpoint definitions and routing logic
    ├── authRoutes.js
└── services/        # Business logic layer (complex calculations, external API calls)
    ├── authService.js
