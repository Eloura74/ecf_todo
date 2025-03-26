// App.js
import { useState, useEffect } from "react";
function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
      });
  }, []);

  function renderTasks() {
    return tasks.map((task) => {
      return <li key={task.id}>{task.title}</li>;
    });
  }

  return (
    <main>
      <h1>Hello</h1>
      {renderTasks()}
    </main>
  );
}

export default App;
