
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(helmet());
app.use(express.static(__dirname));

// Create database folder if it does not exist
const dbFolder = process.env.DB_PATH || path.join(__dirname, "database");
fs.mkdirSync(dbFolder, { recursive: true });

// Connect to SQLite database
const db = new Database(path.join(dbFolder, "tasks.db"));

// Create tasks table
db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'Pending'
    )
`).run();

// READ - Get all tasks
app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare(
        "SELECT * FROM tasks ORDER BY id DESC"
    ).all();

    res.json(tasks);
});

// CREATE - Add a task
app.post("/api/tasks", (req, res) => {
    const { title, description, status } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }

    const result = db.prepare(
        "INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)"
    ).run(title.trim(), description || "", status || "Pending");

    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(task);
});

// UPDATE - Edit a task
app.put("/api/tasks/:id", (req, res) => {
    const { title, description, status } = req.body;
    const id = Number(req.params.id);

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }

    const result = db.prepare(
        "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?"
    ).run(title.trim(), description || "", status || "Pending", id);

    if (result.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
    }

    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(id);

    res.json(task);
});

// DELETE - Remove a task
app.delete("/api/tasks/:id", (req, res) => {
    const result = db.prepare(
        "DELETE FROM tasks WHERE id = ?"
    ).run(Number(req.params.id));

    if (result.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log("SQLite database connected successfully!");
});
