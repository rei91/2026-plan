// ===== Data =====
let objectives = JSON.parse(localStorage.getItem("objectives")) || [];
let currentFilter = "all";
let searchQuery = "";

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

  // Check if any objectives have visible tasks after filtering
  const hasVisibleContent = objectives.some((obj) => {
    const filtered = filterTasks(obj.tasks);
    return filtered.length > 0 || (currentFilter === "all" && searchQuery === "");
  });

  if (!hasVisibleContent) {
    container.innerHTML =
      '<p class="empty-message">No tasks match your search or filter.</p>';
    return;
  }

  container.innerHTML = objectives
    .map((obj, objIndex) => {
      const allTasks = obj.tasks;
      const filteredTasks = filterTasks(allTasks);
      const totalTasks = allTasks.length;
      const doneTasks = allTasks.filter((t) => t.done).length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      // Hide objective if no tasks match and we're searching/filtering
      if (filteredTasks.length === 0 && (searchQuery !== "" || currentFilter !== "all")) {
        return "";
      }

      // Sort tasks: high priority first, then medium, then low/none — completed sink to bottom
      const sortedTasks = filteredTasks
        .map((task) => ({ ...task, originalIndex: allTasks.indexOf(task) }))
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          return priorityOrder(a.priority) - priorityOrder(b.priority);
        });

      const tasksHTML = sortedTasks
        .map(
          (task) => `
        <li class="task-item ${task.done ? "completed" : ""} ${getDueClass(task)} ${task.priority ? "priority-" + task.priority : ""}"
            draggable="true"
            ondragstart="dragStart(event, ${objIndex}, ${task.originalIndex})"
            ondragover="dragOver(event)"
            ondrop="drop(event, ${objIndex}, ${task.originalIndex})">
          <span class="drag-handle" title="Drag to reorder">⠿</span>
          <input
            type="checkbox"
            ${task.done ? "checked" : ""}
            onchange="toggleTask(${objIndex}, ${task.originalIndex})"
          >
          <span class="task-text" ondblclick="editTask(${objIndex}, ${task.originalIndex})">${escapeHTML(task.text)}</span>
          ${task.dueDate ? `<span class="task-due ${getDueClass(task)}">${formatDate(task.dueDate)}</span>` : ""}
          <button class="delete-task" onclick="deleteTask(${objIndex}, ${task.originalIndex})" title="Delete task">&times;</button>
        </li>
      `
        )
        .join("");

      return `
      <div class="objective-card">
        <div class="objective-header">
          <h3 ondblclick="editObjective(${objIndex}, 'title')">${escapeHTML(obj.title)}</h3>
          <button class="delete-objective" onclick="deleteObjective(${objIndex})">Delete</button>
        </div>
        ${obj.description ? `<p class="objective-description" ondblclick="editObjective(${objIndex}, 'description')">${escapeHTML(obj.description)}</p>` : `<p class="objective-description add-desc" ondblclick="editObjective(${objIndex}, 'description')">+ Add description</p>`}
        <div class="objective-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <span class="progress-text">${doneTasks} / ${totalTasks} tasks completed (${progress}%)</span>
        </div>
        <ul class="task-list">${tasksHTML}</ul>
        <form class="add-task-form" onsubmit="addTask(event, ${objIndex})">
          <input type="text" placeholder="Add a task..." required>
          <select class="task-priority-select" title="Priority">
            <option value="">No priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input type="date" class="task-date-input" title="Due date (optional)">
          <button type="submit">+ Task</button>
        </form>
      </div>
    `;
    })
    .join("");
}

// ===== Filter Tasks =====
function filterTasks(tasks) {
  return tasks.filter((task) => {
    // Filter by status
    if (currentFilter === "active" && task.done) return false;
    if (currentFilter === "completed" && !task.done) return false;
    // Filter by search
    if (searchQuery && !task.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });
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

  const prioritySelect = event.target.querySelector("select");
  const priority = prioritySelect.value || null;

  objectives[objIndex].tasks.push({ text, done: false, dueDate, priority });
  textInput.value = "";
  dateInput.value = "";
  prioritySelect.value = "";
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

// ===== Issue #3: Inline Editing =====

function editObjective(objIndex, field) {
  const obj = objectives[objIndex];
  const currentValue = field === "title" ? obj.title : obj.description || "";
  const newValue = prompt(
    field === "title" ? "Edit objective title:" : "Edit description:",
    currentValue
  );

  if (newValue !== null) {
    if (field === "title" && newValue.trim() === "") return;
    objectives[objIndex][field] = newValue.trim();
    render();
  }
}

function editTask(objIndex, taskIndex) {
  const task = objectives[objIndex].tasks[taskIndex];
  const newText = prompt("Edit task:", task.text);

  if (newText !== null && newText.trim() !== "") {
    objectives[objIndex].tasks[taskIndex].text = newText.trim();
    render();
  }
}

// ===== Issue #6: Drag and Drop =====

let dragData = null;

function dragStart(event, objIndex, taskIndex) {
  dragData = { objIndex, taskIndex };
  event.target.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}

function dragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const li = event.target.closest(".task-item");
  if (li) {
    // Remove previous drop indicators
    document.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
    li.classList.add("drag-over");
  }
}

function drop(event, targetObjIndex, targetTaskIndex) {
  event.preventDefault();
  document.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
  document.querySelectorAll(".dragging").forEach((el) => el.classList.remove("dragging"));

  if (!dragData) return;
  if (dragData.objIndex !== targetObjIndex) return; // Only reorder within same objective

  const tasks = objectives[targetObjIndex].tasks;
  const [movedTask] = tasks.splice(dragData.taskIndex, 1);
  // Adjust target index if the source was before the target
  const adjustedIndex =
    dragData.taskIndex < targetTaskIndex ? targetTaskIndex - 1 : targetTaskIndex;
  tasks.splice(adjustedIndex, 0, movedTask);

  dragData = null;
  render();
}

// Clean up drag state on dragend
document.addEventListener("dragend", function () {
  document.querySelectorAll(".dragging").forEach((el) => el.classList.remove("dragging"));
  document.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
  dragData = null;
});

// ===== Issue #5: Search & Filter =====

document.getElementById("search-input").addEventListener("input", function (e) {
  searchQuery = e.target.value;
  render();
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    currentFilter = this.dataset.filter;
    render();
  });
});

// ===== Issue #4: Dark Mode =====

function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeButton(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeButton(next);
}

function updateThemeButton(theme) {
  const btn = document.getElementById("theme-toggle");
  btn.textContent = theme === "light" ? "Dark" : "Light";
}

document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

// ===== Issue #7: Export / Import =====

document.getElementById("export-btn").addEventListener("click", function () {
  const data = JSON.stringify(objectives, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "2026-plan-backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("import-btn").addEventListener("click", function () {
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) {
        alert("Invalid file format. Expected an array of objectives.");
        return;
      }
      if (confirm("This will replace all your current data. Continue?")) {
        objectives = imported;
        render();
      }
    } catch (err) {
      alert("Could not read file. Make sure it's a valid JSON export.");
    }
  };
  reader.readAsText(file);
  // Reset file input so the same file can be imported again
  e.target.value = "";
});

// ===== Helpers =====
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

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

function priorityOrder(priority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  if (priority === "low") return 2;
  return 3;
}

function formatDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ===== Init =====
initTheme();
render();
