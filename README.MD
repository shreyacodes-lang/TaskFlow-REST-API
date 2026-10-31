# TaskFlow REST API
   **Live API:** https://taskflow-rest-api-02e5.onrender.com

A REST API for managing tasks, built with Node.js, Express.js and SQLite. It supports creating, reading, updating and deleting tasks, with input validation, proper HTTP status codes and JSON responses.

## Features

- Full CRUD operations for tasks
- SQLite database (the table is created automatically)
- Input validation for titles, descriptions, status values and task IDs
- Consistent JSON responses with correct HTTP status codes
- Handling of unknown routes and malformed JSON
- Automated tests using Node's built-in test runner

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Web framework for the API routes |
| SQLite | Database |
| better-sqlite3 | Node.js driver for SQLite |
| Postman | Manual API testing |

## Project Structure

```
TaskFlow-REST-API/
├── server.js         # Express app and API routes
├── database.js       # SQLite connection and table creation
├── test/
│   └── api.test.js   # Automated tests
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Installation

1. Install [Node.js](https://nodejs.org/) (LTS version).
2. Clone or download this repository, then open a terminal in the project folder:

```powershell
cd TaskFlow-REST-API
npm install
```

## Running the Server

```powershell
npm start
```

The server runs at `http://localhost:3000`. You should see:

```
Database connected successfully!
Tasks table is ready.
Server is running on http://localhost:3000
```

## Running the Tests

```powershell
npm test
```

The tests use a temporary in-memory database, so they never change `tasks.db`.

## Database Schema

Table: `tasks`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key, generated automatically |
| `title` | TEXT | Required task title |
| `description` | TEXT | Optional description (defaults to an empty string) |
| `status` | TEXT | `pending`, `in-progress` or `completed` (defaults to `pending`) |
| `created_at` | DATETIME | Set automatically when the task is created |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check that the API is running |
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/:id` | Get a single task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

### GET /

**Response (200 OK)**

```json
{
  "success": true,
  "message": "TaskFlow REST API is running!"
}
```

### POST /api/tasks

Creates a task.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | Must not be empty |
| `description` | string | No | |
| `status` | string | No | `pending`, `in-progress` or `completed` |

**Example request**

```json
{
  "title": "Complete TaskFlow API",
  "description": "Finish the CRUD endpoints",
  "status": "pending"
}
```

**Response (201 Created)**

```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "id": 1,
    "title": "Complete TaskFlow API",
    "description": "Finish the CRUD endpoints",
    "status": "pending",
    "created_at": "2026-10-27 14:11:15"
  }
}
```

**Errors:** `400 Bad Request` for an empty or non-text title, a non-text description, an invalid status or malformed JSON.

### GET /api/tasks

Returns all tasks, newest first.

**Response (200 OK)**

```json
{
  "success": true,
  "count": 1,
  "tasks": [
    {
      "id": 1,
      "title": "Complete TaskFlow API",
      "description": "Finish the CRUD endpoints",
      "status": "pending",
      "created_at": "2026-10-27 14:11:15"
    }
  ]
}
```

### GET /api/tasks/:id

Returns one task.

**Response (200 OK)**

```json
{
  "success": true,
  "task": {
    "id": 1,
    "title": "Complete TaskFlow API",
    "description": "Finish the CRUD endpoints",
    "status": "pending",
    "created_at": "2026-10-27 14:11:15"
  }
}
```

**Errors:** `400` if the ID is not a positive whole number, `404` if the task does not exist.

### PUT /api/tasks/:id

Updates a task. Send only the fields you want to change; the others keep their current values. At least one field is required.

**Example request**

```json
{
  "status": "completed"
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "Task updated successfully",
  "task": {
    "id": 1,
    "title": "Complete TaskFlow API",
    "description": "Finish the CRUD endpoints",
    "status": "completed",
    "created_at": "2026-10-27 14:11:15"
  }
}
```

**Errors:** `400` for an invalid ID, an empty request body, an empty or non-text title, a non-text description or an invalid status; `404` if the task does not exist.

### DELETE /api/tasks/:id

Deletes a task.

**Response (200 OK)**

```json
{
  "success": true,
  "message": "Task deleted successfully",
  "deletedTask": {
    "id": 1,
    "title": "Complete TaskFlow API",
    "description": "Finish the CRUD endpoints",
    "status": "completed",
    "created_at": "2026-10-27 14:11:15"
  }
}
```

**Errors:** `400` for an invalid ID, `404` if the task does not exist.

## Error Handling

All errors return JSON in this format:

```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

| Status code | Meaning |
|---|---|
| 200 | Request succeeded |
| 201 | Task created |
| 400 | Invalid input (bad ID, bad field values or malformed JSON) |
| 404 | Task or route not found |
| 500 | Unexpected server error |

## Testing with Postman

1. Start the server with `npm start`.
2. Send requests to `http://localhost:3000`.
3. For POST and PUT, open **Body → raw → JSON** and enter the JSON body.

## Author

Shreya Nalavade
