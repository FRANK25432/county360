# County360 API quick reference

Base URL: `http://127.0.0.1:8000/api/`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health/` | Check backend |
| GET | `/facilities/` | List facility records |
| POST | `/facilities/` | Create record (prototype only) |
| GET | `/facilities/{id}/` | Get one record |
| PUT/PATCH | `/facilities/{id}/` | Update record |
| DELETE | `/facilities/{id}/` | Delete record |
| GET | `/facilities/statistics/` | Counts by category |
| GET | `/categories/` | Category choices |

Query parameters: `category`, `sub_county`, `ward`, `search`, `status`, `include_demo=false`.
