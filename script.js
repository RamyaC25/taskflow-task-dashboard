
const taskForm = document.getElementById("taskForm");
const tasksContainer = document.getElementById("tasks");

// Load and display all tasks
async function loadTasks() {
    try {
        const response = await fetch("/api/tasks");
        if (!response.ok) throw new Error("Could not load tasks");

        const tasks = await response.json();

        tasksContainer.innerHTML = "";

        if (tasks.length === 0) {
            tasksContainer.innerHTML = "<p>No tasks yet. Add your first task!</p>";
            return;
        }

        tasks.forEach(task => {
            const card = document.createElement("div");
            card.className = "task-card";

            const title = document.createElement("h3");
            title.textContent = task.title;

            const description = document.createElement("p");
            description.textContent = task.description || "No description";

            const status = document.createElement("p");
            status.className = "task-status";
            status.textContent = "Status: " + task.status;

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => editTask(task));

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";
            deleteButton.addEventListener("click", () => deleteTask(task.id));

            card.append(title, description, status, editButton, deleteButton);
            tasksContainer.appendChild(card);
        });
    } catch (error) {
        tasksContainer.textContent = "Error loading tasks. Please try again.";
        console.error(error);
    }
}

// CREATE - Add a new task
taskForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const task = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        status: document.getElementById("status").value
    };

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task)
        });

        if (!response.ok) throw new Error("Could not add task");

        taskForm.reset();
        loadTasks();
    } catch (error) {
        alert(error.message);
    }
});

// UPDATE - Edit an existing task
async function editTask(task) {
    const title = prompt("Enter updated task title:", task.title);
    if (title === null) return;

    if (!title.trim()) {
        alert("Task title cannot be empty.");
        return;
    }

    const description = prompt("Enter updated description:", task.description);
    if (description === null) return;

    const status = prompt(
        "Enter status: Pending, In Progress, or Completed",
        task.status
    );

    if (status === null) return;

    const statusMap = {
    "pending": "Pending",
    "in progress": "In Progress",
    "completed": "Completed"
};

const finalStatus = statusMap[status.trim().toLowerCase()];

if (!finalStatus) {
    alert("Please enter Pending, In Progress, or Completed.");
    return;
}

    try {
        const response = await fetch(`/api/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, status: finalStatus })
        });

        if (!response.ok) throw new Error("Could not update task");

        loadTasks();
    } catch (error) {
        alert(error.message);
    }
}

// DELETE - Delete a task
async function deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Could not delete task");

        loadTasks();
    } catch (error) {
        alert(error.message);
    }
}

// Display tasks when the page opens
loadTasks();
