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
      .section-title { margin: 24px 0 10px; padding-bottom: 7px; border-bottom: 1px solid ${CONFIG.palette.surface1}; color: ${CONFIG.palette.subtext1}; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
      .control label { display: flex; justify-content: space-between; margin-bottom: 7px; }
      .control input[type="range"] { width: 100%; accent-color: var(--startpage-accent, var(--accent)); }
      .control input[type="color"] { width: 44px; height: 30px; border: 0; background: transparent; cursor: pointer; }
      .control select { width: 100%; padding: 9px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: 6px; background: ${CONFIG.palette.base}; color: ${CONFIG.palette.text}; }
      .widget-switches { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
      .widget-switches label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
      .widget-switches input { accent-color: var(--startpage-accent, var(--accent)); }
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
          <div class="control"><label for="dim">Wallpaper dimming <output data-value="dim"></output></label><input id="dim" type="range" min="0" max="70" value="0"></div>
          <div class="control"><label for="panel-width">Panel width <output data-value="panel-width"></output></label><input id="panel-width" type="range" min="75" max="100" value="94"></div>
          <div class="control"><label for="text-scale">Link text size <output data-value="text-scale"></output></label><input id="text-scale" type="range" min="80" max="130" value="100"></div>
          <div class="control"><label for="spacing">Status bar spacing</label><select id="spacing"><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></div>
          <div class="control"><label for="accent">Accent colour</label><input id="accent" type="color" value="${CONFIG.palette.mauve}"></div>
          <h3 class="section-title">Show in the status bar</h3>
          <div class="widget-switches">
            <label><input id="show-clock" type="checkbox"> Clock</label>
            <label><input id="show-weather" type="checkbox"> Weather</label>
            <label><input id="show-battery" type="checkbox"> Battery</label>
            <label><input id="show-online" type="checkbox"> Online status</label>
            <label><input id="show-music" type="checkbox"> Music button</label>
          </div>
          <p class="help">Your appearance choices are saved in this browser only.</p>
          <div class="actions"><button type="button" class="reset">Reset defaults</button><button type="button" class="done">Done</button></div>
        </section>
      </dialog>`;
  }

  connectedCallback() {
    this.render().then(() => this.bindSettings());
  }

  defaults() {
    return {
      transparency: 100,
      roundness: 10,
      blur: 0,
      dim: 0,
      panelWidth: 94,
      textScale: 100,
      spacing: "compact",
      accent: CONFIG.palette.mauve,
      widgets: { clock: true, weather: true, battery: true, online: true, music: true },
    };
  }

  getSettings() {
    try {
      const defaults = this.defaults();
      const saved = JSON.parse(localStorage.getItem(AppearanceSettings.storageKey) || "{}");
      return { ...defaults, ...saved, widgets: { ...defaults.widgets, ...saved.widgets } };
    } catch {
      return this.defaults();
    }
  }

  bindSettings() {
    const dialog = this.shadow.querySelector(".settings-dialog");
    const toggle = this.shadow.querySelector(".settings-toggle");
    const controls = ["transparency", "roundness", "blur", "dim", "panel-width", "text-scale", "spacing", "accent"];
    const update = () => {
      const settings = Object.fromEntries(controls.map((id) => [id, this.shadow.querySelector(`#${id}`).value]));
      const transparency = Math.min(100, Math.max(55, Number(settings.transparency)));
      const roundness = Math.min(28, Math.max(0, Number(settings.roundness)));
      const blur = Math.min(24, Math.max(0, Number(settings.blur)));
      const dim = Math.min(70, Math.max(0, Number(settings.dim)));
      const panelWidth = Math.min(100, Math.max(75, Number(settings["panel-width"])));
      const textScale = Math.min(130, Math.max(80, Number(settings["text-scale"])));
      const widgets = Object.fromEntries(["clock", "weather", "battery", "online", "music"].map((name) => [
        name,
        this.shadow.querySelector(`#show-${name}`).checked,
      ]));
      const root = document.documentElement;
      root.style.setProperty("--startpage-opacity", `${transparency}%`);
      root.style.setProperty("--startpage-radius", `${roundness}px`);
      root.style.setProperty("--startpage-blur", `${blur}px`);
      root.style.setProperty("--startpage-wallpaper-dim", String(dim / 100));
      root.style.setProperty("--startpage-panel-width", `${panelWidth}%`);
      root.style.setProperty("--startpage-text-scale", String(textScale / 100));
      root.style.setProperty("--startpage-accent", settings.accent);
      root.style.setProperty("--accent", settings.accent);
      root.style.setProperty("--startpage-widget-padding", settings.spacing === "comfortable" ? "14px" : "10px");
      Object.entries(widgets).forEach(([name, visible]) => {
        root.style.setProperty(`--startpage-show-${name}`, visible ? "inline-flex" : "none");
      });
      this.shadow.querySelector('[data-value="transparency"]').textContent = `${transparency}%`;
      this.shadow.querySelector('[data-value="roundness"]').textContent = `${roundness}px`;
      this.shadow.querySelector('[data-value="blur"]').textContent = `${blur}px`;
      this.shadow.querySelector('[data-value="dim"]').textContent = `${dim}%`;
      this.shadow.querySelector('[data-value="panel-width"]').textContent = `${panelWidth}%`;
      this.shadow.querySelector('[data-value="text-scale"]').textContent = `${textScale}%`;
      localStorage.setItem(AppearanceSettings.storageKey, JSON.stringify({ transparency, roundness, blur, dim, panelWidth, textScale, spacing: settings.spacing, accent: settings.accent, widgets }));
    };

    const settings = this.getSettings();
    const settingIds = { "panel-width": "panelWidth", "text-scale": "textScale" };
    controls.forEach((id) => { this.shadow.querySelector(`#${id}`).value = settings[settingIds[id] || id]; });
    Object.entries(settings.widgets).forEach(([name, visible]) => {
      this.shadow.querySelector(`#show-${name}`).checked = visible;
    });
    update();
    controls.forEach((id) => this.shadow.querySelector(`#${id}`).addEventListener("input", update));
    Object.keys(settings.widgets).forEach((name) => this.shadow.querySelector(`#show-${name}`).addEventListener("change", update));
    toggle.onclick = () => { if (!dialog.open) dialog.showModal(); };
    this.shadow.querySelector(".close").onclick = () => dialog.close();
    this.shadow.querySelector(".done").onclick = () => dialog.close();
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    this.shadow.querySelector(".reset").onclick = () => {
      const defaults = this.defaults();
      controls.forEach((id) => { this.shadow.querySelector(`#${id}`).value = defaults[settingIds[id] || id]; });
      Object.entries(defaults.widgets).forEach(([name, visible]) => {
        this.shadow.querySelector(`#show-${name}`).checked = visible;
      });
      update();
    };
  }
}
