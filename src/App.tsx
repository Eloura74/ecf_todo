interface Task {
  _id: string;
  title: string;
  completed: boolean;
}

import { useState, useEffect } from "react";
import "./index.css";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");

  // Charger les tâches
  useEffect(() => {
    fetch(`/api/tasks`)
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  // ✅ Ajouter une tâche
  function handleAddTask() {
    if (!newTask.trim()) return alert("Please enter a task");

    fetch(`/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask, completed: false }),
    })
      .then((res) => res.json())
      .then((task) => {
        setTasks((prev) => [...prev, task]);
        setNewTask("");
      });
  }

  // ✏️ Modifier une tâche (toggle completed)
  function handleModifyTask(id: string) {
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t._id === id ? { ...t, completed: !t.completed } : t
      )
    );

    // On récupère la valeur mise à jour depuis le nouvel état (immédiat)
    const updatedTask = tasks.find((t) => t._id === id);
    const updatedCompleted = !(updatedTask?.completed ?? false); // 🔄 toggle local

    fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: updatedCompleted }),
    }).catch((err) => {
      console.error("❌ PUT error:", err);
      // En cas d’erreur, tu pourrais même faire un rollback ici si besoin
    });
  }

  // ❌ Supprimer une tâche
  function handleDeleteTask(id: string) {
    if (!id) {
      console.warn("ID de suppression invalide :", id);
      return;
    }

    fetch(`/api/tasks/${id}`, { method: "DELETE" }).then(() => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
    });
  }

  // 🖼️ Rendu des tâches
  function renderTasks() {
    return tasks.map((task) => (
      <li key={task._id} className="task-item">
        <span
          className={task.completed ? "completed" : ""}
          onClick={() => handleModifyTask(task._id)}
        >
          {task.title}
        </span>

        <button onClick={() => handleDeleteTask(task._id)}>Delete</button>
      </li>
    ));
  }

  return (
    <main>
      <h1>Todo List</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddTask();
        }}
      >
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="New task"
        />
        <button type="submit">Add Task</button>
      </form>

      {tasks.length > 0 ? <ul>{renderTasks()}</ul> : <p>No tasks yet</p>}
    </main>
  );
}

export default App;
