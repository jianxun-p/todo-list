const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '..', "dist")));

let todos = [];
let nextId = 1;

function getMissingPriorities(items) {
  if (items.length === 0) {
    return [];
  }

  const used = new Set(items.map((item) => item.priority));
  const maxPriority = Math.max(...used);
  const missing = [];

  for (let priority = 1; priority <= maxPriority; priority += 1) {
    if (!used.has(priority)) {
      missing.push(priority);
    }
  }

  return missing;
}

function sortByPriorityThenId(items) {
  return [...items].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.id - b.id;
  });
}

app.get("/api/todos", (_req, res) => {
  res.json(sortByPriorityThenId(todos));
});

app.get("/api/priorities/missing", (_req, res) => {
  res.json(getMissingPriorities(todos));
});

app.post("/api/todos", (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const priority = Number(req.body.priority);

  if (!title) {
    return res.status(400).json({ message: "Title is required." });
  }

  if (!Number.isInteger(priority) || priority <= 0) {
    return res
      .status(400)
      .json({ message: "Priority must be a positive integer." });
  }

  const todo = {
    id: nextId,
    title,
    priority,
    createdAt: new Date().toISOString()
  };

  nextId += 1;
  todos.push(todo);

  return res.status(201).json(todo);
});

app.delete("/api/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const initialLength = todos.length;

  todos = todos.filter((todo) => todo.id !== id);

  if (todos.length === initialLength) {
    return res.status(404).json({ message: "Todo not found." });
  }

  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
}).on('error', e => console.error('Error starting server:', e));;
