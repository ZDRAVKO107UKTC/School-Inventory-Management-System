# API Request Examples

Base URL: `http://localhost:5000/api`

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

Equipment responses now also include:

- `photo_preview_url`: preview-friendly URL derived from the stored `photo_url`
- `photo_thumbnail_url`: thumbnail URL when one can be generated
- `photo_preview_mode`: `image`, `iframe`, or `external`
- `photo_preview_provider`: detected provider such as `cloudinary` or `google-drive`
- `qr_code_value`: QR-ready equipment payload string for labels and scans

## Create Borrow Request

`POST /requests`

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

`PUT /requests/1/approve`

Header:

```text
Authorization: Bearer <teacher-or-admin-access-token>
```

## Reject Request

`PUT /requests/1/reject`

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

`PUT /requests/1/return`

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

`GET /requests/1/condition-history`

Header:

```text
Authorization: Bearer <admin-access-token>
```

The backend also accepts a trailing slash here if your client sends `/requests/1/condition-history/`.

## Get Equipment Condition History

`GET /equipment/1/condition-history`

Header:

```text
Authorization: Bearer <admin-access-token>
```

The backend also accepts a trailing slash here if your client sends `/equipment/1/condition-history/`.

## Get Equipment Borrowing History

`GET /requests/history/equipment/1`

Header:

```text
Authorization: Bearer <teacher-or-admin-access-token>
```

## Get User Borrowing History

`GET /requests/history/users/1`

Header:

```text
Authorization: Bearer <teacher-or-admin-access-token>
```

## Usage Report

`GET /reports/usage?startDate=2026-03-01&endDate=2026-03-31`

Header:

```text
Authorization: Bearer <admin-access-token>
```

## History Report

`GET /reports/history?status=returned&equipment_id=1`

Header:

```text
Authorization: Bearer <admin-access-token>
```

## Export History Report CSV

`GET /reports/export?status=returned`

Header:

```text
Authorization: Bearer <admin-access-token>
```

## Integration Status

`GET /reports/integrations/status`

Header:

```text
Authorization: Bearer <admin-access-token>
```

Returns backend integration readiness for Nodemailer, Cloudinary, and Google Sheets.

## Upload Equipment Media

`POST /equipment/media/upload`

Header:

```text
Authorization: Bearer <admin-access-token>
```

Body:

```json
{
  "file_name": "projector-manual.pdf",
  "remote_url": "https://example.com/projector-manual.pdf",
  "folder": "equipment-docs"
}
```

You can also send `data_base64` plus `content_type` instead of `remote_url`.

## Export Report to Google Sheets

`POST /reports/export/google-sheets`

Header:

```text
Authorization: Bearer <admin-access-token>
```

Body:

```json
{
  "report_type": "usage",
  "spreadsheet_title": "Inventory Usage Report",
  "sheet_name": "March Usage",
  "startDate": "2026-03-01",
  "endDate": "2026-03-31"
}
```
