const express = require("express");
const db = require("./database");

const app = express();

const PORT = process.env.PORT || 3000;

// Allowed values for the status field
const allowedStatuses = ["pending", "in-progress", "completed"];

// JSON data read
app.use(express.json());

// Home/Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "TaskFlow REST API is running!"
    });
});

// Create a new task
app.post("/api/tasks", (req, res) => {
    try {
        const body = req.body || {};
        const { title, description, status } = body;

        // Validate title
        if (typeof title !== "string" || title.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Title is required and must be a non-empty text"
            });
        }

        // Validate description (optional)
        if (description !== undefined && typeof description !== "string") {
            return res.status(400).json({
                success: false,
                message: "Description must be text"
            });
        }

        // Validate status (optional)
        if (status !== undefined && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be one of: pending, in-progress, completed"
            });
        }

        const result = db.prepare(`
            INSERT INTO tasks (title, description, status)
            VALUES (?, ?, ?)
        `).run(
            title.trim(),
            description || "",
            status || "pending"
        );

        const newTask = db.prepare(
            "SELECT * FROM tasks WHERE id = ?"
        ).get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task: newTask
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create task"
        });
    }
});

// Get all tasks
app.get("/api/tasks", (req, res) => {
    try {
        const tasks = db.prepare(
            "SELECT * FROM tasks ORDER BY id DESC"
        ).all();

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks: tasks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks"
        });
    }
});

// Get a single task by ID
app.get("/api/tasks/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Task ID must be a positive whole number"
            });
        }

        const task = db.prepare(
            "SELECT * FROM tasks WHERE id = ?"
        ).get(id);

        // Task not found
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            task: task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch task"
        });
    }
});

// Update a task by ID
app.put("/api/tasks/:id", (req, res) => {
    try {
        const id = Number(req.params.id);
        const body = req.body || {};
        const { title, description, status } = body;

        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Task ID must be a positive whole number"
            });
        }

        // Check that at least one field was sent
        if (title === undefined && description === undefined && status === undefined) {
            return res.status(400).json({
                success: false,
                message: "Send at least one field to update: title, description or status"
            });
        }

        // Validate title (only if it was sent)
        if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
            return res.status(400).json({
                success: false,
                message: "Title must be a non-empty text"
            });
        }

        // Validate description (only if it was sent)
        if (description !== undefined && typeof description !== "string") {
            return res.status(400).json({
                success: false,
                message: "Description must be text"
            });
        }

        // Validate status (only if it was sent)
        if (status !== undefined && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be one of: pending, in-progress, completed"
            });
        }

        // Find the existing task
        const existingTask = db.prepare(
            "SELECT * FROM tasks WHERE id = ?"
        ).get(id);

        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // Keep old values for any field that was not sent
        const updatedTitle = title !== undefined ? title.trim() : existingTask.title;
        const updatedDescription = description !== undefined ? description : existingTask.description;
        const updatedStatus = status !== undefined ? status : existingTask.status;

        db.prepare(`
            UPDATE tasks
            SET title = ?, description = ?, status = ?
            WHERE id = ?
        `).run(updatedTitle, updatedDescription, updatedStatus, id);

        const updatedTask = db.prepare(
            "SELECT * FROM tasks WHERE id = ?"
        ).get(id);

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task: updatedTask
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update task"
        });
    }
});

// Delete a task by ID
app.delete("/api/tasks/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Task ID must be a positive whole number"
            });
        }

        // Check that the task exists
        const existingTask = db.prepare(
            "SELECT * FROM tasks WHERE id = ?"
        ).get(id);

        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

        res.status(200).json({
            success: true,
            message: "Task deleted successfully",
            deletedTask: existingTask
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete task"
        });
    }
});

// Handle unknown routes (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Handle errors such as malformed JSON
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON in request body"
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// Server start (only when run directly, not when imported by tests)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;