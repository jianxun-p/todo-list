import { useEffect, useMemo, useState } from "react";

const api = {
  async getTodos() {
    const response = await fetch("/api/todos");
    if (!response.ok) {
      throw new Error("Failed to fetch todos");
    }
    return response.json();
  },
  async getMissingPriorities() {
    const response = await fetch("/api/priorities/missing");
    if (!response.ok) {
      throw new Error("Failed to fetch missing priorities");
    }
    return response.json();
  },
  async createTodo(payload) {
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create todo");
    }

    return response.json();
  },
  async deleteTodo(id) {
    const response = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Failed to delete todo");
    }
  }
};

function App() {
  const [todos, setTodos] = useState([]);
  const [missingPriorities, setMissingPriorities] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [todoItems, missing] = await Promise.all([
        api.getTodos(),
        api.getMissingPriorities()
      ]);
      setTodos(todoItems);
      setMissingPriorities(missing);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await api.createTodo({
        title,
        priority: Number(priority)
      });

      setTitle("");
      setPriority("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.deleteTodo(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const missingPriorityLabel = useMemo(() => {
    if (missingPriorities.length === 0) {
      return "None - priorities are continuous from 1 to current max.";
    }
    return missingPriorities.join(", ");
  }, [missingPriorities]);

  return (
    <main className="page">
      <section className="card hero">
        <p className="eyebrow">React + Express</p>
        <h1>Priority Todo List</h1>
        <p className="subtitle">
          Lower numbers are higher priority. Add tasks and see missing priorities
          instantly.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Add Todo</h2>
          <form onSubmit={handleSubmit} className="todo-form">
            <label>
              Task
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Prepare sprint report"
                required
              />
            </label>

            <label>
              Priority (positive integer)
              <input
                type="number"
                min="1"
                step="1"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                placeholder="1"
                required
              />
            </label>

            <button type="submit">Add Item</button>
          </form>
        </article>

        <article className="card">
          <h2>Missing Priorities</h2>
          <p className="missing-values">{missingPriorityLabel}</p>
        </article>
      </section>

      <section className="card">
        <div className="list-head">
          <h2>Todo Items</h2>
          {loading ? <span className="status">Loading...</span> : null}
        </div>

        {error ? <p className="error">{error}</p> : null}

        {todos.length === 0 && !loading ? (
          <p className="empty">No tasks yet. Add your first todo above.</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id}>
                <span className="task-text">{todo.title}</span>
                <span className="badge">P{todo.priority}</span>
                <button
                  className="danger"
                  type="button"
                  onClick={() => handleDelete(todo.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
