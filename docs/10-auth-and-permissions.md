# Auth and Permissions

## Roles
owner (full + billing + delete) · admin (full ops, no ownership transfer/delete) · dispatcher (bookings/jobs/customers/schedule) · worker (assigned jobs only) · viewer (read-only).

## Permission Matrix (summary)
| Action | owner | admin | dispatcher | worker | viewer |
|---|---|---|---|---|---|
| Manage billing | ✔ | ✗ | ✗ | ✗ | ✗ |
| Business settings | ✔ | ✔ | – | – | – |
| Services | ✔ | ✔ | ✔ | – | – |
| Availability | ✔ | ✔ | ✔ | – | – |
| Bookings | ✔ | ✔ | ✔ | – | view |
| Jobs | ✔ | ✔ | ✔ | assigned | view |
| Complete assigned job | ✔ | ✔ | ✔ | ✔ | – |
| Customers | ✔ | ✔ | ✔ | limited | view |
| Team | ✔ | ✔ | – | – | – |
| View payments | ✔ | ✔ | ✔ | – | view |

## Tenant Isolation — every server function verifies
1. Authenticated user exists.
2. User belongs to the organization.
3. Role allows the action.
4. Entity belongs to the same organization.

Public booking endpoints expose only public business/service data and are rate-limited.
