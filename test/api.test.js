// Use a temporary in-memory database so tests never touch tasks.db
process.env.DB_FILE = ":memory:";

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const app = require("../server");

let server;
let baseUrl;

before(async () => {
    await new Promise((resolve) => {
        server = app.listen(0, resolve); // port 0 = any free port
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
    server.close();
});

// Helper: send a request and return { status, data }
async function request(method, path, body) {
    const options = { method, headers: {} };

    if (body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const res = await fetch(baseUrl + path, options);
    const data = await res.json();
    return { status: res.status, data };
}

// Helper: create a task and return it
async function createTask(fields = { title: "Sample task" }) {
    const res = await request("POST", "/api/tasks", fields);
    return res.data.task;
}

// ---------- Home ----------
test("GET / returns the running message", async () => {
    const res = await request("GET", "/");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
});

// ---------- POST ----------
test("POST /api/tasks creates a task with default status", async () => {
    const res = await request("POST", "/api/tasks", { title: "Write README" });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.task.title, "Write README");
    assert.strictEqual(res.data.task.status, "pending");
});

test("POST /api/tasks rejects an empty title", async () => {
    const res = await request("POST", "/api/tasks", { title: "   " });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
});

test("POST /api/tasks rejects a non-text title", async () => {
    const res = await request("POST", "/api/tasks", { title: 123 });
    assert.strictEqual(res.status, 400);
});

test("POST /api/tasks rejects an invalid status", async () => {
    const res = await request("POST", "/api/tasks", { title: "Test", status: "done" });
    assert.strictEqual(res.status, 400);
});

test("POST /api/tasks rejects malformed JSON", async () => {
    const res = await request("POST", "/api/tasks", '{ "title": "Test",');
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.message, "Invalid JSON in request body");
});

// ---------- GET ----------
test("GET /api/tasks returns a list of tasks", async () => {
    await createTask({ title: "Task for list" });
    const res = await request("GET", "/api/tasks");
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.tasks));
    assert.ok(res.data.count >= 1);
});

test("GET /api/tasks/:id returns one task", async () => {
    const task = await createTask({ title: "Find me" });
    const res = await request("GET", `/api/tasks/${task.id}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.task.title, "Find me");
});

test("GET /api/tasks/:id returns 404 for a missing task", async () => {
    const res = await request("GET", "/api/tasks/99999");
    assert.strictEqual(res.status, 404);
});

test("GET /api/tasks/:id returns 400 for an invalid ID", async () => {
    const res = await request("GET", "/api/tasks/abc");
    assert.strictEqual(res.status, 400);
});

// ---------- PUT ----------
test("PUT /api/tasks/:id updates the status and keeps other fields", async () => {
    const task = await createTask({ title: "Update me", description: "Keep this" });
    const res = await request("PUT", `/api/tasks/${task.id}`, { status: "completed" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.task.status, "completed");
    assert.strictEqual(res.data.task.title, "Update me");
    assert.strictEqual(res.data.task.description, "Keep this");
});

test("PUT /api/tasks/:id rejects an invalid status", async () => {
    const task = await createTask({ title: "Bad status" });
    const res = await request("PUT", `/api/tasks/${task.id}`, { status: "done" });
    assert.strictEqual(res.status, 400);
});

test("PUT /api/tasks/:id rejects an empty body", async () => {
    const task = await createTask({ title: "Empty body" });
    const res = await request("PUT", `/api/tasks/${task.id}`, {});
    assert.strictEqual(res.status, 400);
});

test("PUT /api/tasks/:id returns 404 for a missing task", async () => {
    const res = await request("PUT", "/api/tasks/99999", { status: "completed" });
    assert.strictEqual(res.status, 404);
});

// ---------- DELETE ----------
test("DELETE /api/tasks/:id deletes a task", async () => {
    const task = await createTask({ title: "Delete me" });

    const res = await request("DELETE", `/api/tasks/${task.id}`);
    assert.strictEqual(res.status, 200);

    const after = await request("GET", `/api/tasks/${task.id}`);
    assert.strictEqual(after.status, 404);
});

test("DELETE /api/tasks/:id returns 404 for a missing task", async () => {
    const res = await request("DELETE", "/api/tasks/99999");
    assert.strictEqual(res.status, 404);
});

test("DELETE /api/tasks/:id returns 400 for an invalid ID", async () => {
    const res = await request("DELETE", "/api/tasks/abc");
    assert.strictEqual(res.status, 400);
});

// ---------- Unknown route ----------
test("Unknown routes return 404", async () => {
    const res = await request("GET", "/api/unknown");
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.data.message, "Route not found");
});