# BuggyBoard REST API Test Plan

## Application Overview

End-to-end API coverage for the BuggyBoard backend. The API is served from `http://localhost:3000` and all routes use the `/api` prefix. The current backend does not enforce authentication on health or bug endpoints, so bug API tests use direct HTTP requests without a login token. The login endpoint validates credentials but does not issue a session or token.

Tests should use an isolated or disposable bug for any scenario that creates, updates, or deletes data. Every created bug must be removed in teardown when it still exists. Tests must not rely on hard-coded bug IDs or the initial database contents.

## Test Conventions

- Use an API request client and assert HTTP status, JSON shape, and relevant response headers where applicable.
- Use the first account in `users.json` (`buggy` / `1970beetle`) for valid-login coverage.
- Generate unique bug titles for test-created records.
- Keep each scenario independent and arrange its own data.
- For failed create/update requests, verify that no unintended record was created or modified.
- For successful mutation requests, verify persistence with a subsequent `GET /api/bugs/:id` or `GET /api/bugs` request.
- Use numeric IDs supplied by the API. Do not assume a specific ID or contiguous IDs.
- The API accepts severity values case-insensitively (`high`, `mid`, `low`) and stores them as `HIGH`, `MID`, or `LOW`.
- The API accepts state values case-insensitively (`open`, `closed`) on update and stores them as `OPEN` or `CLOSED`.

## Endpoint Scenarios

### 1. `GET /api/health`

#### 1.1. returns a healthy API and connected database

**Request:** `GET /api/health`

**Expect:**

- HTTP `200 OK`.
- JSON response is `{ ok: true, message: "BuggyBoard API is running", database: "connected" }` when the database is available.
- The response content type is JSON.

#### 1.2. reports a database error when the health query fails

**Setup:** Run the endpoint with the database unavailable or make the health query fail using a controlled test double at the backend boundary.

**Request:** `GET /api/health`

**Expect:**

- HTTP `200 OK` because the health route still returns a response.
- `ok` remains `true` and `message` remains `BuggyBoard API is running`.
- `database` is `error`.

### 2. `POST /api/login`

#### 2.1. accepts valid credentials

**Request body:** `{ "username": "buggy", "password": "1970beetle" }`

**Expect:**

- HTTP `200 OK`.
- JSON response is `{ username: "buggy" }`.
- No password is returned.

#### 2.2. trims surrounding whitespace from a valid username

**Request body:** `{ "username": "  buggy  ", "password": "1970beetle" }`

**Expect:**

- HTTP `200 OK`.
- JSON response contains the trimmed username `buggy`.

#### 2.3. rejects a request with both credentials missing

**Request body:** `{}` or an equivalent body with no `username` or `password` fields.

**Expect:**

- HTTP `400 Bad Request`.
- JSON response is `{ error: "missing_credentials", message: "Please enter your username and password." }`.

#### 2.4. rejects a blank username

**Request body:** `{ "username": "   ", "password": "1970beetle" }`

**Expect:**

- HTTP `400 Bad Request`.
- `error` is `blank_username`.
- `message` is `Username cannot be blank.`.

#### 2.5. rejects a blank password

**Request body:** `{ "username": "buggy", "password": "" }`

**Expect:**

- HTTP `400 Bad Request`.
- `error` is `blank_password`.
- `message` is `Password cannot be blank.`.

#### 2.6. rejects an unknown username

**Request body:** `{ "username": "not-a-user", "password": "1970beetle" }`

**Expect:**

- HTTP `401 Unauthorized`.
- JSON response is `{ error: "invalid_credentials", message: "Invalid username or password." }`.

#### 2.7. rejects an incorrect password

**Request body:** `{ "username": "buggy", "password": "wrong-password" }`

**Expect:**

- HTTP `401 Unauthorized`.
- `error` is `invalid_credentials`.
- The response does not reveal whether the username or password was incorrect beyond the shared message.

#### 2.8. treats non-string credential values as missing or blank

**Request body:** Use values such as `{ "username": null, "password": null }`, numbers, or objects.

**Expect:**

- The endpoint does not authenticate the request.
- HTTP `400 Bad Request` with one of the documented missing/blank credential errors, according to the value combination.
- The server does not return `500 Internal Server Error`.

### 3. `GET /api/bugs`

#### 3.1. returns all bugs

**Request:** `GET /api/bugs`

**Expect:**

- HTTP `200 OK`.
- JSON response is an array.
- Each bug has `id`, `title`, `severity`, `owner`, `description`, and `state`.
- `id` is numeric; severity is one of `HIGH`, `MID`, `LOW`; state is one of `OPEN`, `CLOSED`.
- Results are ordered by ascending `id`.

#### 3.2. returns an empty array when no bugs exist

**Setup:** Use an isolated empty database or a controlled service/database fixture with no bug records.

**Request:** `GET /api/bugs`

**Expect:**

- HTTP `200 OK`.
- JSON response is `[]`, not `null` or an error object.

#### 3.3. handles an unsupported method without mutating bugs

**Request:** Send an unsupported method such as `PATCH /api/bugs`.

**Expect:**

- The request is rejected with the framework's `404 Not Found` response.
- No bug is created, updated, or deleted.

### 4. `POST /api/bugs`

#### 4.1. creates a bug with a valid payload

**Request body:**

```json
{
  "title": "API create test <unique-id>",
  "severity": "HIGH",
  "owner": "buggy",
  "description": "Created by the REST API test plan."
}
```

**Expect:**

- HTTP `201 Created`.
- Response contains a newly assigned numeric `id`.
- Response contains the trimmed title, owner, and description.
- Response contains severity `HIGH` and state `OPEN`.
- A subsequent `GET /api/bugs/:id` returns the same bug.

#### 4.2. accepts each supported severity case-insensitively

**Requests:** Create independent bugs with severity `high`, `mid`, and `low`, including at least one mixed-case value.

**Expect:**

- Each request returns HTTP `201 Created`.
- Stored/returned severities are `HIGH`, `MID`, and `LOW` respectively.
- Each created bug is cleaned up.

#### 4.3. trims valid text fields before storing them

**Request body:** Send valid title, owner, and description values with surrounding whitespace.

**Expect:**

- HTTP `201 Created`.
- Returned title, owner, and description do not contain the surrounding whitespace.

#### 4.4. rejects a blank or missing title

**Request body:** Send a valid payload with `title` set to `""`, whitespace, or omitted.

**Expect:**

- HTTP `400 Bad Request`.
- `{ error: "blank_title", message: "Title is required." }`.
- No bug is created.

#### 4.5. rejects a blank, missing, or invalid severity

**Request body:** Send a valid payload with severity set to `""`, whitespace, an unsupported value such as `"critical"`, or omitted.

**Expect:**

- HTTP `400 Bad Request`.
- `{ error: "blank_severity", message: "Severity is required (high, mid, or low)." }`.
- No bug is created.

#### 4.6. rejects a blank or missing owner

**Request body:** Send a valid payload with `owner` set to `""`, whitespace, or omitted.

**Expect:**

- HTTP `400 Bad Request`.
- `{ error: "blank_owner", message: "Owner is required." }`.
- No bug is created.

#### 4.7. rejects a blank or missing description

**Request body:** Send a valid payload with `description` set to `""`, whitespace, or omitted.

**Expect:**

- HTTP `400 Bad Request`.
- `{ error: "blank_description", message: "Description is required." }`.
- No bug is created.

#### 4.8. rejects non-string fields without a server error

**Request body:** Use a valid payload except make one or more fields numbers, arrays, objects, or `null`.

**Expect:**

- HTTP `400 Bad Request` for the corresponding required/invalid field.
- No `500 Internal Server Error`.
- No bug is created.

### 5. `GET /api/bugs/:id`

#### 5.1. returns an existing bug

**Setup:** Create a disposable bug through `POST /api/bugs` and record its returned ID.

**Request:** `GET /api/bugs/<created-id>`

**Expect:**

- HTTP `200 OK`.
- The response contains the created bug with the correct ID and all fields.
- Teardown deletes the disposable bug.

#### 5.2. rejects a non-numeric ID

**Request:** `GET /api/bugs/not-a-number`

**Expect:**

- HTTP `400 Bad Request`.
- `{ error: "invalid_id", message: "Bug ID must be a number." }`.

#### 5.3. returns not found for an unknown numeric ID

**Request:** `GET /api/bugs/<id-that-does-not-exist>`.

**Expect:**

- HTTP `404 Not Found`.
- `{ error: "not_found", message: "Bug not found." }`.

#### 5.4. rejects an unsupported ID format

**Requests:** Exercise values such as a decimal, a negative ID, or an empty path segment where the router permits it.

**Expect:**

- The response does not expose another bug and does not return `500`.
- Document the actual status behavior for each format. The route uses `parseInt`, so tests should specifically detect whether prefixes such as `12abc` are incorrectly accepted and record that behavior as an API defect rather than silently treating it as a valid ID.

### 6. `PUT /api/bugs/:id`

#### 6.1. updates all editable fields on an existing bug

**Setup:** Create a disposable bug and record its ID.

**Request body:**

```json
{
  "title": "API updated title <unique-id>",
  "severity": "low",
  "owner": "vanny",
  "description": "Updated by the REST API test plan.",
  "state": "closed"
}
```

**Expect:**

- HTTP `200 OK`.
- Response contains the same ID, trimmed updated values, severity `LOW`, and state `CLOSED`.
- A subsequent `GET /api/bugs/:id` confirms persistence.

#### 6.2. accepts case-insensitive severity and state values

**Request:** Update independent disposable bugs using each severity and both `open`/`closed` state forms, including mixed case.

**Expect:**

- HTTP `200 OK` for each valid combination.
- Returned severity is uppercase and returned state is uppercase.

#### 6.3. rejects an update for a missing bug

**Request:** `PUT /api/bugs/<id-that-does-not-exist>` with an otherwise valid payload.

**Expect:**

- HTTP `404 Not Found`.
- `{ error: "not_found", message: "Bug not found." }`.

#### 6.4. rejects a non-numeric ID

**Request:** `PUT /api/bugs/not-a-number` with a valid payload.

**Expect:**

- HTTP `400 Bad Request`.
- `{ error: "invalid_id", message: "Bug ID must be a number." }`.

#### 6.5. rejects a blank or missing title

**Request:** Update an existing disposable bug with title `""`, whitespace, or omitted.

**Expect:**

- HTTP `400 Bad Request`.
- `error` is `blank_title` and the message is `Title is required.`.
- The stored bug remains unchanged.

#### 6.6. rejects a blank, missing, or invalid severity

**Request:** Update an existing disposable bug with severity `""`, whitespace, an unsupported value, or omitted.

**Expect:**

- HTTP `400 Bad Request`.
- `error` is `blank_severity` and the message is `Severity is required (high, mid, or low).`.
- The stored bug remains unchanged.

#### 6.7. rejects a blank or missing owner

**Request:** Update an existing disposable bug with owner `""`, whitespace, or omitted.

**Expect:**

- HTTP `400 Bad Request`.
- `error` is `blank_owner` and the message is `Owner is required.`.
- The stored bug remains unchanged.

#### 6.8. rejects a blank or missing description

**Request:** Update an existing disposable bug with description `""`, whitespace, or omitted.

**Expect:**

- HTTP `400 Bad Request`.
- `error` is `blank_description` and the message is `Description is required.`.
- The stored bug remains unchanged.

#### 6.9. rejects an invalid or missing state

**Request:** Update an existing disposable bug with state `""`, whitespace, an unsupported value such as `"pending"`, or omitted.

**Expect:**

- HTTP `400 Bad Request`.
- `{ error: "invalid_state", message: "State must be Open or Closed." }`.
- The stored bug remains unchanged.

#### 6.10. rejects non-string update fields without a server error

**Request:** Use numbers, arrays, objects, or `null` for one or more update fields.

**Expect:**

- HTTP `400 Bad Request` for the corresponding invalid or blank field.
- No `500 Internal Server Error`.
- The stored bug remains unchanged.

### 7. `DELETE /api/bugs/:id`

#### 7.1. deletes an existing bug

**Setup:** Create a disposable bug and record its ID.

**Request:** `DELETE /api/bugs/<created-id>`

**Expect:**

- HTTP `204 No Content`.
- Response has no response body.
- `GET /api/bugs/<created-id>` subsequently returns `404 Not Found`.
- The bug no longer appears in `GET /api/bugs`.

#### 7.2. rejects a non-numeric ID

**Request:** `DELETE /api/bugs/not-a-number`

**Expect:**

- HTTP `400 Bad Request`.
- `{ error: "invalid_id", message: "Bug ID must be a number." }`.
- No bug is deleted.

#### 7.3. returns not found for an unknown numeric ID

**Request:** `DELETE /api/bugs/<id-that-does-not-exist>`

**Expect:**

- HTTP `404 Not Found`.
- `{ error: "not_found", message: "Bug not found." }`.

#### 7.4. makes repeated deletion idempotently fail without deleting another bug

**Setup:** Create and delete a disposable bug.

**Request:** Repeat `DELETE /api/bugs/<deleted-id>`.

**Expect:**

- HTTP `404 Not Found`.
- The response is the documented `not_found` error.
- No other bug is affected.

## Cross-Endpoint Negative Coverage

- Verify all routes use the `/api` prefix; requests to equivalent paths without `/api` are not treated as API calls.
- Verify malformed JSON requests are rejected without crashing the server; record the framework response status and body because `express.json()` handles this before route logic.
- Verify unsupported methods do not mutate database state.
- Verify API responses for validation failures are JSON error objects with stable `error` and `message` fields.
- Verify failed updates preserve the original record and failed creates do not add a record.
- Verify bug endpoints remain callable without an authentication token because the current backend has no auth middleware. Treat any future introduction of auth as a contract change requiring this plan to be updated.

## Cleanup

- Delete every successfully created test bug in `afterEach`/teardown.
- If a test intentionally deletes its own bug, accept `204` or `404` during cleanup.
- When testing failed updates, fetch the record after the request and restore or delete it as needed.
- Do not delete seeded bugs or records created by another test.
