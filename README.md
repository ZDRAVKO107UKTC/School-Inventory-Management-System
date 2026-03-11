# School-Inventory-Management-System
## 📂 Project Structure
The backend follows a modular architecture:
```text
src/
├── config/          # Configuration files (database connections, environment variables)
├── controllers/     # Request handlers (processes input, calls services, sends responses)
├── middleware/      # Custom functions (authentication, error handling, validation)
├── models/          # Database schemas and data definitions (SQL/NoSQL)
├── routes/          # API endpoint definitions and routing logic
└── services/        # Business logic layer (complex calculations, external API calls)
