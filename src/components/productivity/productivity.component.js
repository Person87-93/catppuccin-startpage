// Browser-local notes, tasks, and portable startpage backups
class ProductivityTools extends Component {
  static storageKey = "startpageProductivity";
  static backupVersion = 1;

  imports() {
    return [this.getResource("icons", "tabler"), this.getResource("fonts", "roboto")];
  }

  style() {
    return `
      :host { display: inline-flex; align-items: center; height: 100%; color: ${CONFIG.palette.text}; font-family: 'Roboto', sans-serif; }
      .tools-toggle { display: inline-flex; align-items: center; gap: 6px; height: 100%; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; }
      .tools-toggle i { font-size: 17px; }
      .tools-dialog { width: min(620px, calc(100vw - 28px)); max-height: min(88vh, 760px); margin: auto; padding: 0; border: 1px solid ${CONFIG.palette.surface1}; border-radius: 12px; background: ${CONFIG.palette.base}; color: ${CONFIG.palette.text}; box-shadow: 0 18px 60px #0009; }
      .tools-dialog::backdrop { background: #0009; backdrop-filter: blur(5px); }
      .panel { padding: 22px; }
      .header, .section-heading, .actions, .task-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .header { margin-bottom: 18px; }
      h2 { margin: 0; font-size: 20px; }
      h3 { margin: 0; font-size: 14px; }
      button, input, textarea { font: inherit; }
      button { border: 0; border-radius: 6px; padding: 8px 11px; background: ${CONFIG.palette.surface0}; color: ${CONFIG.palette.text}; cursor: pointer; }
      button:hover { background: ${CONFIG.palette.surface1}; }
      button.primary { background: ${CONFIG.palette.blue}; color: ${CONFIG.palette.crust}; font-weight: 700; }
      button.danger { color: ${CONFIG.palette.red}; }
      .close { padding: 4px 9px; font-size: 20px; }
      .workspace { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      .section { min-width: 0; }
      .section-heading { margin-bottom: 9px; }
      textarea { box-sizing: border-box; width: 100%; min-height: 220px; resize: vertical; padding: 12px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: 8px; outline-color: ${CONFIG.palette.blue}; background: ${CONFIG.palette.mantle}; color: ${CONFIG.palette.text}; line-height: 1.5; }
      .task-form { display: flex; gap: 7px; margin-bottom: 10px; }
      .task-form input { min-width: 0; flex: 1; }
      input { box-sizing: border-box; padding: 9px 10px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: 6px; background: ${CONFIG.palette.mantle}; color: ${CONFIG.palette.text}; }
      .task-list { display: grid; gap: 7px; max-height: 185px; overflow: auto; }
      .task-row { justify-content: flex-start; padding: 8px; border-radius: 7px; background: ${CONFIG.palette.mantle}; }
      .task-row input { accent-color: ${CONFIG.palette.green}; }
      .task-row span { flex: 1; overflow-wrap: anywhere; }
      .task-row.completed span { color: ${CONFIG.palette.subtext0}; text-decoration: line-through; }
      .task-row button { padding: 4px 7px; color: ${CONFIG.palette.red}; }
      .empty { padding: 12px 4px; color: ${CONFIG.palette.subtext0}; font-size: 13px; }
      .footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-top: 18px; padding-top: 14px; border-top: 1px solid ${CONFIG.palette.surface1}; }
      .footer-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .status { min-height: 18px; margin: 10px 0 0; color: ${CONFIG.palette.subtext0}; font-size: 12px; }
      .help { margin: 0; color: ${CONFIG.palette.subtext0}; font-size: 12px; line-height: 1.5; }
      @media (max-width: 560px) { .workspace { grid-template-columns: 1fr; } textarea { min-height: 130px; } .panel { padding: 16px; } }
    `;
  }

  template() {
    return `
      <button class="tools-toggle" type="button" aria-label="Open notes and tasks" title="Notes and tasks"><i class="ti ti-notebook"></i></button>
      <dialog class="tools-dialog" aria-labelledby="tools-title">
        <div class="panel">
          <div class="header"><h2 id="tools-title">Notes & tasks</h2><button class="close" type="button" aria-label="Close">×</button></div>
          <div class="workspace">
            <section class="section">
              <div class="section-heading"><h3>Quick notes</h3><span class="help">saved automatically</span></div>
              <textarea class="notes" aria-label="Quick notes" placeholder=" jot something down..."></textarea>
            </section>
            <section class="section">
              <div class="section-heading"><h3>To-do list</h3><span class="help task-count">0 tasks</span></div>
              <form class="task-form"><input class="task-input" type="text" maxlength="160" placeholder="Add a task..." aria-label="New task"><button class="primary" type="submit">Add</button></form>
              <div class="task-list" aria-live="polite"></div>
            </section>
          </div>
          <div class="footer">
            <p class="help">Notes and tasks stay in this browser. Back up your startpage settings to move them.</p>
            <div class="footer-actions">
              <button class="export" type="button">Export backup</button>
              <button class="import" type="button">Import backup</button>
              <input class="backup-file" type="file" accept="application/json,.json" hidden>
            </div>
          </div>
          <p class="status" role="status" aria-live="polite"></p>
        </div>
      </dialog>`;
  }

  connectedCallback() {
    this.render().then(() => this.bindEvents());
  }

  readData() {
    try {
      const value = JSON.parse(localStorage.getItem(ProductivityTools.storageKey) || "{}");
      return { notes: typeof value.notes === "string" ? value.notes : "", tasks: Array.isArray(value.tasks) ? value.tasks : [] };
    } catch {
      return { notes: "", tasks: [] };
    }
  }

  saveData() {
    localStorage.setItem(ProductivityTools.storageKey, JSON.stringify(this.data));
  }

  bindEvents() {
    this.dialog = this.shadow.querySelector(".tools-dialog");
    this.notes = this.shadow.querySelector(".notes");
    this.taskInput = this.shadow.querySelector(".task-input");
    this.taskList = this.shadow.querySelector(".task-list");
    this.status = this.shadow.querySelector(".status");
    this.data = this.readData();
    this.notes.value = this.data.notes;
    this.renderTasks();

    this.shadow.querySelector(".tools-toggle").addEventListener("click", () => this.dialog.showModal());
    this.shadow.querySelector(".close").addEventListener("click", () => this.dialog.close());
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
    this.notes.addEventListener("input", () => {
      this.data.notes = this.notes.value;
      this.saveData();
      this.setStatus("Notes saved.");
    });
    this.shadow.querySelector(".task-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const title = this.taskInput.value.trim();
      if (!title) return;
      this.data.tasks.push({ id: this.createId(), title, completed: false });
      this.taskInput.value = "";
      this.saveData();
      this.renderTasks();
      this.setStatus("Task added.");
    });
    this.taskList.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-task-check]");
      if (!checkbox) return;
      const task = this.data.tasks.find((item) => item.id === checkbox.dataset.taskCheck);
      if (!task) return;
      task.completed = checkbox.checked;
      this.saveData();
      this.renderTasks();
    });
    this.taskList.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-task-remove]");
      if (!remove) return;
      this.data.tasks = this.data.tasks.filter((task) => task.id !== remove.dataset.taskRemove);
      this.saveData();
      this.renderTasks();
      this.setStatus("Task removed.");
    });
    this.shadow.querySelector(".export").addEventListener("click", () => this.exportBackup());
    this.shadow.querySelector(".import").addEventListener("click", () => this.shadow.querySelector(".backup-file").click());
    this.shadow.querySelector(".backup-file").addEventListener("change", (event) => this.importBackup(event));
  }

  createId() {
    return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  renderTasks() {
    this.taskList.replaceChildren();
    const count = this.data.tasks.length;
    this.shadow.querySelector(".task-count").textContent = `${count} task${count === 1 ? "" : "s"}`;
    if (!count) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Nothing on the list yet.";
      this.taskList.append(empty);
      return;
    }

    this.data.tasks.forEach((task) => {
      const row = document.createElement("div");
      row.className = `task-row${task.completed ? " completed" : ""}`;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(task.completed);
      checkbox.dataset.taskCheck = task.id;
      checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`);
      const label = document.createElement("span");
      label.textContent = task.title;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.dataset.taskRemove = task.id;
      remove.setAttribute("aria-label", `Remove ${task.title}`);
      row.append(checkbox, label, remove);
      this.taskList.append(row);
    });
  }

  setStatus(message) {
    this.status.textContent = message;
  }

  createBackup() {
    const config = {};
    Object.keys(CONFIG.defaults).forEach((key) => { config[key] = CONFIG[key]; });
    let appearance = null;
    try { appearance = JSON.parse(localStorage.getItem("startpageAppearance") || "null"); } catch {}
    return {
      application: "catppuccin-startpage",
      version: ProductivityTools.backupVersion,
      exportedAt: new Date().toISOString(),
      config,
      appearance,
      customLinks: JSON.parse(localStorage.getItem("customStartpageLinks") || "[]"),
      productivity: this.data,
    };
  }

  exportBackup() {
    try {
      const blob = new Blob([JSON.stringify(this.createBackup(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `catppuccin-startpage-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      this.setStatus("Backup exported.");
    } catch {
      this.setStatus("Could not create the backup.");
    }
  }

  async importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (backup.application !== "catppuccin-startpage" || backup.version !== ProductivityTools.backupVersion ||
          !backup.config || typeof backup.config !== "object" || Array.isArray(backup.config) ||
          !backup.productivity || typeof backup.productivity.notes !== "string" || !Array.isArray(backup.productivity.tasks)) {
        throw new Error("This file is not a supported startpage backup.");
      }
      if (!backup.productivity.tasks.every((task) => task && typeof task.title === "string" && typeof task.id === "string")) {
        throw new Error("The backup contains invalid task data.");
      }

      localStorage.setItem("configurationImport", JSON.stringify(backup.config));
      if (backup.appearance && typeof backup.appearance === "object") localStorage.setItem("startpageAppearance", JSON.stringify(backup.appearance));
      if (Array.isArray(backup.customLinks)) localStorage.setItem("customStartpageLinks", JSON.stringify(backup.customLinks));
      localStorage.setItem(ProductivityTools.storageKey, JSON.stringify(backup.productivity));
      this.setStatus("Backup imported. Reloading...");
      window.location.reload();
    } catch (error) {
      this.setStatus(error.message || "Could not read that backup file.");
    } finally {
      event.target.value = "";
    }
  }
}
