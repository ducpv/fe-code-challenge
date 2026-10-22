# Problem 5 — A Crude Server

Express and TypeScript CRUD API for a single resource, stored in a SQLite file. This solution lives in the repository directory `src/problem4`.

## Assumptions

The challenge does not define a domain model, so a resource is a record with:

| Field | Rule |
| --- | --- |
| id | UUID assigned by the server |
| name | Required text, trimmed, 1–200 characters |
| description | Optional text, trimmed, at most 2000 characters. Omitted on create becomes `""` |
| createdAt, updatedAt | ISO-8601 timestamps |

Other assumptions:

- Persistence uses Node's built-in `node:sqlite`. There is no separate database server. Node.js 22.13 or newer is required, because that is when `node:sqlite` can be imported without `--experimental-sqlite`.
- `name` and `q` are case-insensitive substring filters. `%` and `_` in a filter are matched literally. A blank value is ignored.
- `limit` defaults to 20 and must be 1–100. `offset` defaults to 0 and must be 0–1000000. `total` counts every match, before pagination.
- Newest resources are returned first (`createdAt`, then `id`, descending).
- PUT and PATCH both apply a partial update. At least one of `name` or `description` must be present. Omitted fields stay as they are. Extra JSON fields are ignored.
- An unknown id returns 404. The service binds to `127.0.0.1:3001` unless `HOST` or `PORT` is set.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| PORT | 3001 | HTTP port |
| HOST | 127.0.0.1 | Bind address |
| DATABASE_PATH | `data/resources.db` in this package | SQLite file. The directory is created on startup. |

## Run

From this directory:

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:3001. The page is the CRUD interface: create a resource, filter the list, open one record for its details, save changes, and delete it.

Development, with reload when the server source changes:

```sh
npm install
npm run dev
```

## Page

| Section | What it does |
| --- | --- |
| Create a resource | `POST /resources` |
| List resources | `GET /resources` with optional `name` and `q` filters. The page shows 10 records at a time. |
| Resource details | `GET /resources/:id` when a row is selected |
| Save details | `PATCH /resources/:id` |
| Delete resource | `DELETE /resources/:id` after confirmation |

## API

| Method | Path | Behavior |
| --- | --- | --- |
| GET | / | The CRUD page |
| POST | /resources | Create. Body: `{ "name": "Widget", "description": "optional" }`. Returns 201. |
| GET | /resources | List. Query: `name`, `q`, `limit`, `offset`. |
| GET | /resources/:id | One resource, or 404. |
| PUT, PATCH | /resources/:id | Update details, or 404. |
| DELETE | /resources/:id | Delete. Returns 204, or 404. |

Errors use `{ "error": "message" }`.

Create:

```sh
curl -s -X POST http://127.0.0.1:3001/resources -H "Content-Type: application/json" -d '{"name":"Widget","description":"First resource"}'
```

List with a name filter:

```sh
curl -s "http://127.0.0.1:3001/resources?name=wid"
```
