# BE-033 Architecture Decisions

This document captures the main architectural decisions behind the current School Inventory Management System backend. It is not a full system spec. Its goal is to explain why the codebase is shaped the way it is today, what tradeoffs were accepted, and what constraints future changes should respect.

## Decision 1: Run the backend as microservices behind a single API gateway

Status: Accepted

We expose the backend through an API gateway and run domain-focused services behind it:

- `auth-service`
- `user-service`
- `admin-service`
- `equipment-service`
- `request-service`
- `report-service`
- `spatial-service`

Why this was chosen:

- It separates deployment and runtime concerns by domain without forcing the frontend to know internal service topology.
- It keeps the public API stable under `/api/*` while allowing internal backend restructuring.
- It matches the project's growth path: authentication, inventory, requests, reports, and spatial data have different change rates and operational needs.

Tradeoffs accepted:

- More processes, ports, and deployment wiring than a monolith.
- Shared model code still means service boundaries are organizational and runtime-oriented, not yet fully isolated at the persistence level.
- Local debugging is more operationally complex.

Implications:

- Frontend clients should talk only to the gateway.
- New backend capabilities should be added to an existing service only when they clearly fit that domain boundary.
- Public routes should remain gateway-stable even if service internals move.

Related docs:

- [MICROSERVICE_BOUNDARIES.md](C:/Users/zdrav/Documents/GitHub/School-Inventory-Management-System/backend/MICROSERVICE_BOUNDARIES.md)

## Decision 2: Keep a shared PostgreSQL database for now

Status: Accepted

All services currently use the same PostgreSQL database and shared Sequelize models.

Why this was chosen:

- It keeps delivery speed high for a student and project environment.
- It avoids premature distributed data complexity while the domains are still evolving quickly.
- It lets existing workflows and migrations continue to work during the service split.

Tradeoffs accepted:

- Service autonomy is limited because database-level isolation is not yet enforced.
- Cross-domain coupling can still leak through shared tables and models.
- Future extraction to per-service data stores will require additional transition work.

Implications:

- Ownership is logical first, not physically enforced first.
- Schema changes should still be reviewed in terms of domain boundaries, even though the DB is shared.
- Cross-service writes should be minimized and explicit.

## Decision 3: Define boundaries around business capabilities, not technical layers

Status: Accepted

The services are grouped around business capabilities:

- `auth-service`: authentication and token lifecycle
- `user-service`: authenticated user-facing identity retrieval
- `admin-service`: privileged user-management flows
- `equipment-service`: asset catalog, condition, and placement
- `request-service`: borrow, approve, reject, and return workflows
- `report-service`: reporting and export flows
- `spatial-service`: floors, rooms, and mapping data

Why this was chosen:

- Business capabilities are easier to reason about than splitting by controller, service, or model folders across the entire system.
- It creates clearer ownership for APIs and future changes.
- It supports independent scaling later, especially for read-heavy reporting and request moderation flows.

Tradeoffs accepted:

- Some boundaries are intentionally transitional. For example, reporting still reads from operational tables.
- A few concerns remain adjacent by design, such as equipment plus spatial placement.

Implications:

- New routes should be assigned to the service that owns the workflow, not just the table.
- If a feature spans multiple domains, the owning workflow should lead and depend on other services indirectly where possible.

## Decision 4: Keep reporting read-optimized and operationally separate

Status: Accepted

Reporting endpoints are isolated into `report-service`, even though they still query the shared operational database.

Why this was chosen:

- Reporting is a distinct read-heavy access pattern.
- Export and report generation should not shape the write-path design for borrow and return workflows.
- This creates a clean transition point for future projections or materialized views.

Tradeoffs accepted:

- Reports still depend on operational schemas.
- Some report queries can become expensive as the dataset grows unless explicitly optimized.

Implications:

- Reporting queries should favor read efficiency and stable projections.
- Future work can move reporting to dedicated read models without changing the external route surface.

## Decision 5: Optimize hot queries with explicit indexes and narrow projections

Status: Accepted

We added targeted query and index improvements instead of relying on ORM defaults.

Examples:

- Composite indexes for common `requests` filters and ordering
- Trigram indexes for equipment search fields
- Lowercased indexes for case-insensitive login lookups
- Focused `attributes` selection on hot list and history endpoints

Why this was chosen:

- The most expensive endpoints are predictable: request queues, equipment search, history views, reports, and token cleanup.
- ORM convenience alone does not guarantee scalable SQL plans.
- This keeps performance work aligned with actual access patterns.

Tradeoffs accepted:

- More schema objects to maintain in migrations
- Slightly more verbose query code

Implications:

- New list and search endpoints should define explicit ordering, selected columns, and supporting indexes when needed.
- Query tuning should follow observed filters and sorts, not generic indexing rules.

Related implementation:

- [20260320210000-add-query-optimization-indexes.js](C:/Users/zdrav/Documents/GitHub/School-Inventory-Management-System/backend/migrations/20260320210000-add-query-optimization-indexes.js)

## Decision 6: Make pagination opt-in and backward-compatible

Status: Accepted

List endpoints support pagination when clients send `page`, `limit`, or `paginate=true`, but keep legacy response shapes for existing callers that do not opt in.

Why this was chosen:

- It improves scalability without breaking current frontend behavior.
- It gives us a migration path from full-list loading to paged loading.
- It makes large history and list endpoints safer as data grows.

Tradeoffs accepted:

- Controllers need dual behavior for paginated and non-paginated callers.
- Some endpoints return pagination metadata in the body, while array-only endpoints rely on headers to preserve compatibility.

Implications:

- New large list endpoints should support pagination from the start.
- Frontend consumers should gradually adopt paginated access patterns instead of relying on full-table responses.

Related implementation:

- [pagination.js](C:/Users/zdrav/Documents/GitHub/School-Inventory-Management-System/backend/src/utils/pagination.js)

## Decision 7: Use transactional protection for state-changing request workflows

Status: Accepted

Critical workflows like approval and return are handled transactionally.

Why this was chosen:

- Borrow and return flows modify both request state and equipment inventory.
- Partial updates would create inconsistent stock and history data.

Tradeoffs accepted:

- Transactional code is more explicit and slightly more complex.

Implications:

- Any workflow that updates inventory plus request state plus audit or history data should remain transactional.
- Concurrent moderation actions should continue to use row locks where needed.

## Decision 8: Treat condition history as a first-class audit trail

Status: Accepted

Asset condition changes are stored as historical records rather than only overwriting current state.

Why this was chosen:

- Inventory systems need lifecycle visibility, not just current values.
- Returns and inspections should be historically traceable.

Tradeoffs accepted:

- More writes and additional query and index needs
- Slightly more complex read models for condition history screens

Implications:

- Condition-changing workflows should update both current equipment state and historical condition logs when appropriate.
- Future analytics should read from logs first when they need lifecycle information.

## Future direction

These decisions are intentionally pragmatic. The current architecture optimizes for clarity, deliverability, and moderate scale. If the project grows further, the likely next steps are:

- Move reporting toward dedicated read models or projections
- Reduce shared-database coupling between services
- Add event-driven integration between workflow-heavy services
- Make frontend clients use paginated list access by default
- Add observability around slow queries and inter-service failures
