// ===== Data =====
// Load saved data from localStorage, or start with an empty array
let objectives = JSON.parse(localStorage.getItem("objectives")) || [];

// ===== Save & Render =====
function save() {
  localStorage.setItem("objectives", JSON.stringify(objectives));
}

function render() {
  renderObjectives();
  updateStats();
  save();
}

// ===== Stats =====
function updateStats() {
  const totalObjectives = objectives.length;
  const totalTasks = objectives.reduce((sum, obj) => sum + obj.tasks.length, 0);
  const completedTasks = objectives.reduce(
    (sum, obj) => sum + obj.tasks.filter((t) => t.done).length,
    0
  );
  const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  document.getElementById("total-objectives").textContent = totalObjectives;
  document.getElementById("total-tasks").textContent = totalTasks;
  document.getElementById("completed-tasks").textContent = completedTasks;
  document.getElementById("completion-rate").textContent = rate + "%";
  document.getElementById("overall-progress-fill").style.width = rate + "%";
}

// ===== Render Objectives =====
function renderObjectives() {
  const container = document.getElementById("objectives-container");

  if (objectives.length === 0) {
    container.innerHTML =
      '<p class="empty-message">No objectives yet. Add one above to get started!</p>';
    return;
  }

  container.innerHTML = objectives.map((obj, objIndex) => {
    const totalTasks = obj.tasks.length;
    const doneTasks = obj.tasks.filter((t) => t.done).length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const tasksHTML = obj.tasks
      .map(
        (task, taskIndex) => `
        <li class="task-item ${task.done ? "completed" : ""} ${getDueClass(task)}">
          <input
            type="checkbox"
            ${task.done ? "checked" : ""}
            onchange="toggleTask(${objIndex}, ${taskIndex})"
          >
          <span>${escapeHTML(task.text)}</span>
          ${task.dueDate ? `<span class="task-due ${getDueClass(task)}">${formatDate(task.dueDate)}</span>` : ""}
          <button class="delete-task" onclick="deleteTask(${objIndex}, ${taskIndex})" title="Delete task">&times;</button>
        </li>
      `
      )
      .join("");

    return `
      <div class="objective-card">
        <div class="objective-header">
          <h3>${escapeHTML(obj.title)}</h3>
          <button class="delete-objective" onclick="deleteObjective(${objIndex})">Delete</button>
        </div>
        ${obj.description ? `<p class="objective-description">${escapeHTML(obj.description)}</p>` : ""}
        <div class="objective-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <span class="progress-text">${doneTasks} / ${totalTasks} tasks completed (${progress}%)</span>
        </div>
        <ul class="task-list">${tasksHTML}</ul>
        <form class="add-task-form" onsubmit="addTask(event, ${objIndex})">
          <input type="text" placeholder="Add a task..." required>
          <input type="date" class="task-date-input" title="Due date (optional)">
          <button type="submit">+ Task</button>
        </form>
      </div>
    `;
  }).join("");
}

// ===== Actions =====

// Add a new objective
document.getElementById("objective-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("objective-title").value.trim();
  const description = document.getElementById("objective-description").value.trim();

  if (!title) return;

  objectives.push({
    title,
    description,
    tasks: [],
  });

  // Clear the form
  document.getElementById("objective-title").value = "";
  document.getElementById("objective-description").value = "";

  render();
});

// Delete an objective
function deleteObjective(index) {
  if (confirm("Delete this objective and all its tasks?")) {
    objectives.splice(index, 1);
    render();
  }
}

// Add a task to an objective
function addTask(event, objIndex) {
  event.preventDefault();
  const textInput = event.target.querySelector('input[type="text"]');
  const dateInput = event.target.querySelector('input[type="date"]');
  const text = textInput.value.trim();
  const dueDate = dateInput.value || null;

  if (!text) return;

  objectives[objIndex].tasks.push({ text, done: false, dueDate });
  textInput.value = "";
  dateInput.value = "";
  render();
}

// Toggle a task's completion
function toggleTask(objIndex, taskIndex) {
  objectives[objIndex].tasks[taskIndex].done =
    !objectives[objIndex].tasks[taskIndex].done;
  render();
}

// Delete a task
function deleteTask(objIndex, taskIndex) {
  objectives[objIndex].tasks.splice(taskIndex, 1);
  render();
}

// ===== Helpers =====
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Returns "overdue", "due-soon", or "" based on the task's due date
function getDueClass(task) {
  if (!task.dueDate || task.done) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate + "T00:00:00");
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "due-soon";
  return "";
}

// Formats a date string like "2026-03-15" into "Mar 15"
function formatDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ===== Initial Render =====
render();
