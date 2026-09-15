const STORAGE_KEY = "daily-checklist:v1";

const elements = {
  form: document.querySelector("#taskForm"),
  input: document.querySelector("#taskInput"),
  list: document.querySelector("#taskList"),
  template: document.querySelector("#taskTemplate"),
  todayLabel: document.querySelector("#todayLabel"),
  doneCount: document.querySelector("#doneCount"),
  totalCount: document.querySelector("#totalCount"),
  statusText: document.querySelector("#statusText"),
  resetTodayButton: document.querySelector("#resetTodayButton"),
  progressRing: document.querySelector(".progress-ring"),
};

const getTodayKey = () => new Date().toLocaleDateString("en-CA");

const createTask = (title) => ({
  id: crypto.randomUUID(),
  title,
  done: false,
});

const loadState = () => {
  const fallback = { date: getTodayKey(), tasks: [] };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.tasks)) return fallback;

    const today = getTodayKey();
    if (saved.date !== today) {
      return {
        date: today,
        tasks: saved.tasks.map((task) => ({ ...task, done: false })),
      };
    }

    return saved;
  } catch {
    return fallback;
  }
};

let state = loadState();

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const refreshForNewDay = () => {
  const today = getTodayKey();
  if (state.date === today) return;

  state = {
    date: today,
    tasks: state.tasks.map((task) => ({ ...task, done: false })),
  };
  saveState();
};

const updateSummary = () => {
  const total = state.tasks.length;
  const done = state.tasks.filter((task) => task.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  elements.doneCount.textContent = done;
  elements.totalCount.textContent = `/${total}`;
  elements.progressRing.style.setProperty("--progress", `${percent}%`);
  elements.todayLabel.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (total === 0) {
    elements.statusText.textContent = "Add your first task.";
  } else if (done === total) {
    elements.statusText.textContent = "Everything is green.";
  } else {
    elements.statusText.textContent = `${total - done} still red.`;
  }
};

const render = () => {
  refreshForNewDay();
  elements.list.replaceChildren();

  if (state.tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No tasks yet.";
    elements.list.append(empty);
    updateSummary();
    return;
  }

  state.tasks.forEach((task) => {
    const item = elements.template.content.firstElementChild.cloneNode(true);
    const checkButton = item.querySelector(".check-button");
    const deleteButton = item.querySelector(".delete-button");
    const title = item.querySelector(".task-title");

    item.classList.toggle("done", task.done);
    title.textContent = task.title;
    checkButton.setAttribute("aria-label", task.done ? "Mark task red" : "Mark task green");

    checkButton.addEventListener("click", () => {
      task.done = !task.done;
      saveState();
      render();
    });

    deleteButton.addEventListener("click", () => {
      state.tasks = state.tasks.filter((savedTask) => savedTask.id !== task.id);
      saveState();
      render();
    });

    elements.list.append(item);
  });

  updateSummary();
};

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = elements.input.value.trim();
  if (!title) return;

  refreshForNewDay();
  state.tasks.unshift(createTask(title));
  elements.input.value = "";
  saveState();
  render();
});

elements.resetTodayButton.addEventListener("click", () => {
  state.tasks = state.tasks.map((task) => ({ ...task, done: false }));
  state.date = getTodayKey();
  saveState();
  render();
});

setInterval(render, 60 * 1000);
render();
