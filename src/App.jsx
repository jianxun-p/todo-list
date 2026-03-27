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
  },
  async completeTodo(id) {
    const response = await fetch(`/api/todos/${id}/complete`, {
      method: "PATCH"
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to mark todo complete");
    }

    return response.json();
  },
  async updateTodo(id, payload) {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to update todo");
    }

    return response.json();
  }
};

function App() {
  const [todos, setTodos] = useState([]);
  const [missingPriorities, setMissingPriorities] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingPriority, setEditingPriority] = useState("");
  const [pendingConflict, setPendingConflict] = useState(null);

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

    const trimmedTitle = title.trim();
    const newPriority = Number(priority);
    const existingTodo = todos.find((todo) => todo.priority === newPriority);

    if (existingTodo) {
      setPendingConflict({
        title: trimmedTitle,
        priority: newPriority,
        existingTodo
      });
      return;
    }

    try {
      await api.createTodo({
        title: trimmedTitle,
        priority: newPriority
      });

      setTitle("");
      setPriority("");
      setPendingConflict(null);
      setEditingTodoId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAutoIncr() {
    
    const nextAvailablePriority = (() => {
      const used = new Set(todos.map((item) => item.priority));
      let priority = pendingConflict.priority + 1;
      while (used.has(priority)) {
        priority += 1;
      }
      return priority;
    })();

    setError("");

    try {
      if (editingTodoId === null) {
        await api.createTodo({
          title: pendingConflict.title,
          priority: nextAvailablePriority
        });
      } else {
        await api.updateTodo(editingTodoId, {
          title: pendingConflict.title,
          priority: nextAvailablePriority
        });
      }

      setTitle("");
      setPriority("");
      setPendingConflict(null);
      setEditingTodoId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancelNewTask() {
    setPendingConflict(null);
    setEditingTodoId(null);
    setTitle("");
    setPriority("");
    setError("");
  }

  async function handleOverwriteExistingTask() {
    if (!pendingConflict) {
      return;
    }

    setError("");

    try {
      if (editingTodoId === null) {
        await api.updateTodo(pendingConflict.existingTodo.id, {
          title: pendingConflict.title,
          priority: pendingConflict.priority
        });
      } else {
        await api.deleteTodo(pendingConflict.existingTodo.id);
        await api.updateTodo(editingTodoId, {
          title: pendingConflict.title,
          priority: pendingConflict.priority
        });
      }
      setPendingConflict(null);
      setTitle("");
      setPriority("");
      setEditingTodoId(null);
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

  async function handleComplete(id) {
    setError("");
    try {
      await api.completeTodo(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleStartEdit(todo) {
    setError("");
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
    setEditingPriority(String(todo.priority));
  }

  function handleCancelEdit() {
    setEditingTodoId(null);
    setEditingTitle("");
    setEditingPriority("");
  }

  async function handleSaveEdit(id) {
    setError("");

    const trimmedTitle = editingTitle.trim();
    const newPriority = Number(editingPriority);
    const existingTodo = todos.find((todo) => todo.priority === newPriority);

    if (existingTodo) {
      setPendingConflict({
        title: trimmedTitle,
        priority: newPriority,
        existingTodo
      });
      return;
    }

    try {
      await api.updateTodo(id, {
        title: editingTitle,
        priority: Number(editingPriority)
      });
      handleCancelEdit();
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
                onChange={(event) => {
                  setTitle(event.target.value);
                  setPendingConflict(null);
                }}
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
                onChange={(event) => {
                  setPriority(event.target.value);
                  setPendingConflict(null);
                }}
                placeholder="1"
                required
              />
            </label>

            <button type="submit">Add Item</button>

            {pendingConflict && editingTodoId === null ? (
              <div className="conflict-panel" role="alert">
                <p>
                  Priority {pendingConflict.priority} already exists for task
                  "{pendingConflict.existingTodo.title}".
                </p>
                <div className="conflict-actions">
                  <button type="button" className="ghost" onClick={handleAutoIncr}>
                    Auto Increment Priority
                  </button>
                  <button type="button" className="danger" onClick={handleCancelNewTask}>
                    Cancel New Task
                  </button>
                  <button
                    type="button"
                    className="warning"
                    onClick={handleOverwriteExistingTask}
                  >
                    Overwrite Existing Task
                  </button>
                </div>
              </div>
            ) : null}
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
              <li key={todo.id} className={todo.completed ? "is-complete" : ""}>
                {editingTodoId === todo.id ? (
                  <input
                    className="edit-input"
                    type="text"
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    aria-label={`Edit task ${todo.title}`}
                  />
                ) : (
                  <span className="task-text">{todo.title}</span>
                )}
                {pendingConflict !== null && editingTodoId === todo.id ? (
              <div className="conflict-panel" role="alert">
                <p>
                  Priority {pendingConflict.priority} already exists for task
                  "{pendingConflict.existingTodo.title}".
                </p>
                <div className="conflict-actions">
                  <button type="button" className="ghost" onClick={handleAutoIncr}>
                    Auto Increment Priority
                  </button>
                  <button type="button" className="danger" onClick={handleCancelNewTask}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="warning"
                    onClick={handleOverwriteExistingTask}
                  >
                    Overwrite Existing Task
                  </button>
                </div>
              </div>
            ) : null}
                {editingTodoId === todo.id ? (
                  <input
                    className="edit-priority-input"
                    type="number"
                    min="1"
                    step="1"
                    value={editingPriority}
                    onChange={(event) => setEditingPriority(event.target.value)}
                    aria-label={`Edit priority for ${todo.title}`}
                  />
                ) : (
                  <span className="badge">P{todo.priority}</span>
                )}
                {editingTodoId === todo.id ? (
                  <>
                    <button
                      className="save"
                      type="button"
                      onClick={() => handleSaveEdit(todo.id)}
                    >
                      Save
                    </button>
                    <button
                      className="ghost"
                      type="button"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => handleStartEdit(todo)}
                  >
                    Edit
                  </button>
                )}
                {todo.completed ? (
                  <span className="done-tag">Done</span>
                ) : (
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => handleComplete(todo.id)}
                  >
                    Complete
                  </button>
                )}
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
