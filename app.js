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
        <li class="task-item ${task.done ? "completed" : ""}">
          <input
            type="checkbox"
            ${task.done ? "checked" : ""}
            onchange="toggleTask(${objIndex}, ${taskIndex})"
          >
          <span>${escapeHTML(task.text)}</span>
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
  const input = event.target.querySelector("input");
  const text = input.value.trim();

  if (!text) return;

  objectives[objIndex].tasks.push({ text, done: false });
  input.value = "";
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

// ===== Initial Render =====
render();
