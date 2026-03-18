# API Request Examples

Base URL: `http://localhost:5000`

## Register

`POST /auth/register`

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

## Login

`POST /auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Profile

`GET /users/profile`

Header:

```text
Authorization: Bearer <access-token>
```

## Create Equipment

`POST /equipment`

Header:

```text
Authorization: Bearer <admin-access-token>
```

Body:

```json
{
  "name": "Dell Latitude 5420",
  "type": "Laptop",
  "serial_number": "DELL123456",
  "condition": "new",
  "status": "available",
  "location": "Room 201",
  "quantity": 5
}
```

## Browse Equipment

`GET /equipment?search=laptop&status=available&condition=new`

## Create Borrow Request

`POST /request`

Header:

```text
Authorization: Bearer <access-token>
```

Body:

```json
{
  "equipment_id": 1,
  "quantity": 2,
  "request_date": "2026-03-20T09:00:00.000Z",
  "due_date": "2026-03-25T09:00:00.000Z",
  "notes": "Needed for classroom demo"
}
```

## Approve Request

`PUT /request/1/approve`

Header:

```text
Authorization: Bearer <teacher-or-admin-access-token>
```

## Reject Request

`PUT /request/1/reject`

Header:

```text
Authorization: Bearer <teacher-or-admin-access-token>
```

Body:

```json
{
  "reason": "Not available for the requested dates"
}
```

## Return Request

`PUT /request/1/return`

Header:

```text
Authorization: Bearer <access-token>
```

Body:

```json
{
  "condition": "good",
  "notes": "Returned after class project"
}
```

`condition` is required and is also written to the historical condition log.

## Get Request Condition History

`GET /request/1/condition-history`

Header:

```text
Authorization: Bearer <admin-access-token>
```

The backend also accepts a trailing slash here if your client sends `/request/1/condition-history/`.

## Get Equipment Condition History

`GET /equipment/1/condition-history`

Header:

```text
Authorization: Bearer <admin-access-token>
```

The backend also accepts a trailing slash here if your client sends `/equipment/1/condition-history/`.
