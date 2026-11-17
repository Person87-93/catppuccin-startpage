// Browser-local appearance controls for the start page
class AppearanceSettings extends Component {
  static storageKey = "startpageAppearance";

  imports() {
    return [this.getResource("icons", "material"), this.getResource("fonts", "roboto")];
  }

  style() {
    return `
      .settings-toggle { height: 100%; display: flex; align-items: center; padding: 0; border: 0; background: transparent; color: ${CONFIG.palette.text}; cursor: pointer; }
      .settings-toggle i { font-size: 16pt; }
      .settings-dialog { width: min(430px, calc(100vw - 32px)); max-height: min(90vh, 700px); margin: auto; padding: 0; overflow: visible; border: 0; background: transparent; color: ${CONFIG.palette.text}; }
      .settings-dialog::backdrop { background: rgb(0 0 0 / 55%); }
      .panel { width: 100%; max-height: min(90vh, 700px); overflow: auto; padding: 22px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: var(--startpage-radius, 10px); background: color-mix(in srgb, ${CONFIG.palette.mantle} var(--startpage-opacity, 100%), transparent); color: ${CONFIG.palette.text}; box-shadow: 0 16px 50px rgb(0 0 0 / 40%); backdrop-filter: blur(var(--startpage-blur, 0px)); font: 400 14px 'Roboto', sans-serif; }
      .heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
      .heading h2 { font-size: 20px; }
      .heading button { border: 0; background: none; color: ${CONFIG.palette.text}; cursor: pointer; }
      .control { margin: 16px 0; }
      .control label { display: flex; justify-content: space-between; margin-bottom: 7px; }
      .control input[type="range"] { width: 100%; accent-color: var(--startpage-accent, var(--accent)); }
      .control input[type="color"] { width: 44px; height: 30px; border: 0; background: transparent; cursor: pointer; }
      .control select { width: 100%; padding: 9px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: 6px; background: ${CONFIG.palette.base}; color: ${CONFIG.palette.text}; }
      .help { color: ${CONFIG.palette.subtext0}; font-size: 12px; line-height: 1.5; }
      .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
      .actions button { border: 0; border-radius: 6px; padding: 9px 13px; background: ${CONFIG.palette.surface0}; color: ${CONFIG.palette.text}; cursor: pointer; }
    `;
  }

  template() {
    return `<button type="button" class="settings-toggle" aria-label="Appearance settings" title="Customize appearance"><i class="material-icons">settings</i></button>
      <dialog class="settings-dialog" aria-label="Appearance settings">
        <section class="panel">
          <div class="heading"><h2>Customize</h2><button type="button" class="close" aria-label="Close"><i class="material-icons">close</i></button></div>
          <div class="control"><label for="transparency">Panel transparency <output data-value="transparency"></output></label><input id="transparency" type="range" min="55" max="100" value="100"></div>
          <div class="control"><label for="roundness">Corner roundness <output data-value="roundness"></output></label><input id="roundness" type="range" min="0" max="28" value="10"></div>
          <div class="control"><label for="blur">Background blur <output data-value="blur"></output></label><input id="blur" type="range" min="0" max="24" value="0"></div>
          <div class="control"><label for="spacing">Status bar spacing</label><select id="spacing"><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></div>
          <div class="control"><label for="accent">Accent colour</label><input id="accent" type="color" value="${CONFIG.palette.mauve}"></div>
          <p class="help">Your appearance choices are saved in this browser only.</p>
          <div class="actions"><button type="button" class="reset">Reset defaults</button><button type="button" class="done">Done</button></div>
        </section>
      </dialog>`;
  }

  connectedCallback() {
    this.render().then(() => this.bindSettings());
  }

  defaults() {
    return { transparency: 100, roundness: 10, blur: 0, spacing: "compact", accent: CONFIG.palette.mauve };
  }

  getSettings() {
    try {
      return { ...this.defaults(), ...JSON.parse(localStorage.getItem(AppearanceSettings.storageKey) || "{}") };
    } catch {
      return this.defaults();
    }
  }

  bindSettings() {
    const dialog = this.shadow.querySelector(".settings-dialog");
    const toggle = this.shadow.querySelector(".settings-toggle");
    const controls = ["transparency", "roundness", "blur", "spacing", "accent"];
    const update = () => {
      const settings = Object.fromEntries(controls.map((id) => [id, this.shadow.querySelector(`#${id}`).value]));
      const transparency = Math.min(100, Math.max(55, Number(settings.transparency)));
      const roundness = Math.min(28, Math.max(0, Number(settings.roundness)));
      const blur = Math.min(24, Math.max(0, Number(settings.blur)));
      const root = document.documentElement;
      root.style.setProperty("--startpage-opacity", `${transparency}%`);
      root.style.setProperty("--startpage-radius", `${roundness}px`);
      root.style.setProperty("--startpage-blur", `${blur}px`);
      root.style.setProperty("--startpage-accent", settings.accent);
      root.style.setProperty("--accent", settings.accent);
      root.style.setProperty("--startpage-widget-padding", settings.spacing === "comfortable" ? "14px" : "10px");
      this.shadow.querySelector('[data-value="transparency"]').textContent = `${transparency}%`;
      this.shadow.querySelector('[data-value="roundness"]').textContent = `${roundness}px`;
      this.shadow.querySelector('[data-value="blur"]').textContent = `${blur}px`;
      localStorage.setItem(AppearanceSettings.storageKey, JSON.stringify({ transparency, roundness, blur, spacing: settings.spacing, accent: settings.accent }));
    };

    const settings = this.getSettings();
    controls.forEach((id) => { this.shadow.querySelector(`#${id}`).value = settings[id]; });
    update();
    controls.forEach((id) => this.shadow.querySelector(`#${id}`).addEventListener("input", update));
    toggle.onclick = () => { if (!dialog.open) dialog.showModal(); };
    this.shadow.querySelector(".close").onclick = () => dialog.close();
    this.shadow.querySelector(".done").onclick = () => dialog.close();
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    this.shadow.querySelector(".reset").onclick = () => {
      const defaults = this.defaults();
      controls.forEach((id) => { this.shadow.querySelector(`#${id}`).value = defaults[id]; });
      update();
    };
  }
}
