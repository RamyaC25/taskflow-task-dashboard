
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Allow requests from GitHub Pages
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://ramyac25.github.io");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(helmet());
app.use(express.static(__dirname));

// Create database folder if missing
const dbFolder = path.join(__dirname, "database");
fs.mkdirSync(dbFolder, { recursive: true });

const db = new Database(path.join(dbFolder, "tasks.db"));

db.prepare(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'Pending'
    )
`).run();

// READ
app.get("/api/tasks", (req, res) => {
    res.json(db.prepare("SELECT * FROM tasks ORDER BY id DESC").all());
});

// CREATE
app.post("/api/tasks", (req, res) => {
    const { title, description, status } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }

    const result = db.prepare(
        "INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)"
    ).run(title.trim(), description || "", status || "Pending");

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?")
        .get(result.lastInsertRowid);

    res.status(201).json(task);
});

// UPDATE
app.put("/api/tasks/:id", (req, res) => {
    const { title, description, status } = req.body;
    const id = Number(req.params.id);

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }

    const result = db.prepare(
        "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?"
    ).run(title.trim(), description || "", status || "Pending", id);

    if (!result.changes) {
        return res.status(404).json({ error: "Task not found" });
    }

    res.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
});

// DELETE
app.delete("/api/tasks/:id", (req, res) => {
    const result = db.prepare(
        "DELETE FROM tasks WHERE id = ?"
    ).run(Number(req.params.id));

    if (!result.changes) {
        return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
