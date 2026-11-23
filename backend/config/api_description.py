API_DESCRIPTION = """
API to register and consult the visits that specialists make to schools.

## Trying the endpoints from this page

Authentication uses the Django **session cookie**, the same one the web application uses.

1. Open **Auth → `POST /api/auth/login/`** and press **Execute**. The example body is already filled in
   with the demo data (`maria.gonzalez` / `demo1234`; use `admin` / `admin12345` to act as an administrator).
2. Every other endpoint now works from this page: the browser sends the session cookie by itself and this page
   adds the CSRF header to requests that change data.
3. Use **`POST /api/auth/logout/`** to end the session.

The session is shared with the web application: signing in there also signs you in here.

## Roles

| Role | What it can do |
| --- | --- |
| Specialist | See every visit. Register visits (always in their name) and edit or delete only their own. |
| Administrator | Everything a specialist can do, on **any** visit, choosing the specialist with `specialist_id`. |

## Errors

Every error carries a stable `code`. Validation errors (`400`) list, for each field, objects with a `code`
and an English `message`; clients should translate the code, not show the message.

```json
{
  "detail": "Invalid input.",
  "errors": {
    "visit_date": [{"code": "future_date", "message": "The visit date cannot be in the future."}]
  }
}
```

Other errors use `{"detail": "...", "code": "..."}` with codes such as `not_authenticated`,
`invalid_credentials`, `permission_denied`, `csrf_failed` and `not_found`.
"""
