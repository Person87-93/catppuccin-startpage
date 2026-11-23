// Browser-local appearance controls for the start page
class AppearanceSettings extends Component {
  static storageKey = "startpageAppearance";

  imports() {
    return [this.getResource("icons", "material"), this.getResource("fonts", "roboto"), this.getResource("fonts", "nunito"), this.getResource("fonts", "raleway")];
  }

  style() {
    return `
      .settings-toggle { height: 100%; display: flex; align-items: center; padding: 0; border: 0; background: transparent; color: ${CONFIG.palette.text}; cursor: pointer; }
      .settings-toggle i { font-size: 16pt; }
      .settings-dialog { width: min(790px, calc(100vw - 32px)); max-height: min(92vh, 820px); margin: auto; padding: 0; overflow: visible; border: 0; background: transparent; color: ${CONFIG.palette.text}; }
      .settings-dialog::backdrop { background: rgb(10 10 18 / 68%); backdrop-filter: blur(7px); }
      .panel { width: 100%; max-height: min(92vh, 820px); overflow: auto; box-sizing: border-box; padding: 26px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: 18px; background: linear-gradient(145deg, color-mix(in srgb, ${CONFIG.palette.mantle} 97%, ${CONFIG.palette.mauve}), color-mix(in srgb, ${CONFIG.palette.base} 96%, ${CONFIG.palette.blue})); color: ${CONFIG.palette.text}; box-shadow: 0 22px 70px rgb(0 0 0 / 48%); backdrop-filter: blur(var(--startpage-blur, 0px)); font: 400 14px 'Nunito', 'Roboto', sans-serif; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 14px; }
      .heading { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 4px 0 16px; border-bottom: 1px solid ${CONFIG.palette.surface1}; }
      .heading h2 { color: ${CONFIG.palette.lavender || CONFIG.palette.mauve}; font: 800 26px 'Nunito', sans-serif; letter-spacing: -.035em; margin: 0; }
      .heading::after { content: "PERSONALIZE YOUR SPACE"; margin-left: auto; margin-right: 18px; color: ${CONFIG.palette.subtext0}; font: 700 10px 'Raleway', sans-serif; letter-spacing: .16em; }
      .heading button { border: 0; background: none; color: ${CONFIG.palette.text}; cursor: pointer; }
      .settings-nav { grid-column: 1; grid-row: 2 / span 4; display: flex; flex-direction: column; gap: 8px; max-height: min(70vh, 620px); overflow-y: auto; padding: 10px; border: 1px solid ${CONFIG.palette.surface0}; border-radius: 14px; background: color-mix(in srgb, ${CONFIG.palette.surface0} 32%, transparent); align-self: start; position: sticky; top: 0; }
      .category { display: grid; grid-template-columns: 28px 1fr; grid-template-rows: auto auto; align-items: center; column-gap: 8px; min-height: 56px; padding: 9px 10px; text-align: left; border: 1px solid transparent; border-radius: 10px; color: ${CONFIG.palette.subtext1}; background: transparent; cursor: pointer; transition: .18s ease; }
      .category i { grid-row: 1 / 3; font-size: 19px; }
      .category span { color: inherit; font: 800 13px 'Nunito', sans-serif; }
      .category small { color: ${CONFIG.palette.subtext0}; font: 600 10px 'Roboto', sans-serif; }
      .category:hover { color: ${CONFIG.palette.text}; background: color-mix(in srgb, ${CONFIG.palette.surface1} 45%, transparent); }
      .category.active { color: ${CONFIG.palette.lavender || CONFIG.palette.mauve}; border-color: color-mix(in srgb, ${CONFIG.palette.mauve} 42%, transparent); background: linear-gradient(110deg, color-mix(in srgb, ${CONFIG.palette.mauve} 17%, transparent), color-mix(in srgb, ${CONFIG.palette.blue} 12%, transparent)); }
      .settings-main { grid-column: 2; grid-row: 2; min-width: 0; }
      .settings-page { display: none; grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: start; gap: 0 12px; }
      .settings-page.active { display: grid; }
      .page-heading { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: baseline; margin: 2px 0 13px; color: ${CONFIG.palette.text}; font: 800 17px 'Nunito', sans-serif; }
      .page-heading span { color: ${CONFIG.palette.subtext0}; font: 700 9px 'Raleway', sans-serif; letter-spacing: .15em; }
      .settings-page > .control { min-width: 0; }
      .settings-page > .section-title, .settings-page > .widget-switches, .settings-page > .website-settings, .settings-page > .element-hiding { grid-column: 1 / -1; }
      .control { min-width: 0; margin: 7px 0; padding: 13px 14px; border: 1px solid ${CONFIG.palette.surface0}; border-radius: 12px; background: color-mix(in srgb, ${CONFIG.palette.surface0} 42%, transparent); transition: border-color .18s ease, background .18s ease, transform .18s ease; }
      .control:hover { border-color: ${CONFIG.palette.mauve}; background: color-mix(in srgb, ${CONFIG.palette.surface0} 68%, transparent); transform: translateY(-1px); }
      .section-title { grid-column: 1 / -1; margin: 22px 0 5px; padding: 0 0 9px 2px; border-bottom: 1px solid ${CONFIG.palette.surface1}; color: ${CONFIG.palette.mauve}; font: 800 11px 'Raleway', 'Nunito', sans-serif; letter-spacing: .16em; text-transform: uppercase; }
      .section-title::before { content: "✦"; margin-right: 8px; color: ${CONFIG.palette.peach}; }
      .control label { display: flex; justify-content: space-between; margin-bottom: 7px; color: ${CONFIG.palette.text}; font-weight: 700; }
      .control input[type="range"] { width: 100%; accent-color: var(--startpage-accent, var(--accent)); cursor: pointer; }
      .control input[type="range"]::-webkit-slider-runnable-track { height: 6px; border-radius: 99px; background: linear-gradient(90deg, ${CONFIG.palette.mauve}, ${CONFIG.palette.blue}); }
      .control input[type="range"]::-webkit-slider-thumb { margin-top: -5px; }
      .control output { color: ${CONFIG.palette.lavender || CONFIG.palette.blue}; font: 800 12px 'Roboto', sans-serif; font-variant-numeric: tabular-nums; }
      .control select { outline: none; transition: border-color .15s ease; }
      .control select:focus, .element-hiding textarea:focus { border-color: ${CONFIG.palette.mauve}; }
      .control input[type="color"] { width: 44px; height: 30px; border: 0; background: transparent; cursor: pointer; }
      .control select { width: 100%; padding: 9px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: 6px; background: ${CONFIG.palette.base}; color: ${CONFIG.palette.text}; }
      .widget-switches { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
      .widget-switches label { display: flex; align-items: center; gap: 9px; min-height: 48px; padding: 0 12px; border: 1px solid ${CONFIG.palette.surface0}; border-radius: 10px; background: color-mix(in srgb, ${CONFIG.palette.surface0} 42%, transparent); cursor: pointer; font-weight: 700; transition: .18s ease; }
      .widget-switches label:hover { border-color: ${CONFIG.palette.teal}; background: color-mix(in srgb, ${CONFIG.palette.teal} 10%, transparent); }
      .widget-switches input { width: 16px; height: 16px; }
      .widget-switches input { accent-color: var(--startpage-accent, var(--accent)); }
      .website-settings { grid-column: 1 / -1; margin-top: 4px; padding: 10px 14px 14px; border: 1px solid ${CONFIG.palette.surface0}; border-radius: 12px; background: color-mix(in srgb, ${CONFIG.palette.surface0} 25%, transparent); display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
      .website-settings > .help, .website-settings > .website-grid { grid-column: 1 / -1; }
      .website-settings > .control:first-child { grid-column: 1 / -1; }
      .website-settings > .control { background: transparent; border: 0; padding: 7px 2px; }
      .website-settings > .control:hover { transform: none; background: transparent; }
      .website-settings > .website-grid .control { background: transparent; border: 0; padding: 4px 2px; }
      .element-hiding { grid-column: 1 / -1; padding: 12px 14px; border: 1px solid ${CONFIG.palette.surface0}; border-radius: 12px; background: color-mix(in srgb, ${CONFIG.palette.surface0} 25%, transparent); }
      .element-hiding .control { background: transparent; border: 0; padding: 5px 0; }
      .element-hiding .control:hover { transform: none; }
      .element-hiding textarea { width: 100%; min-height: 76px; resize: vertical; box-sizing: border-box; padding: 10px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: 8px; background: ${CONFIG.palette.base}; color: ${CONFIG.palette.text}; font: 12px monospace; }
      .website-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
      .website-grid .control { margin: 8px 0; }
      .website-colour { display: flex; align-items: center; justify-content: space-between; }
      .help { grid-column: 1 / -1; color: ${CONFIG.palette.subtext1}; font-size: 12px; line-height: 1.6; }
      .panel > .help { margin: 12px 0 0; }
      .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 15px; border-top: 1px solid ${CONFIG.palette.surface1}; }
      .actions button { border: 1px solid ${CONFIG.palette.surface1}; border-radius: 8px; padding: 10px 15px; background: ${CONFIG.palette.surface0}; color: ${CONFIG.palette.text}; cursor: pointer; font-weight: 800; transition: .18s ease; }
      .actions button:hover { border-color: ${CONFIG.palette.mauve}; filter: brightness(1.08); transform: translateY(-1px); }
      .actions .done { background: linear-gradient(110deg, ${CONFIG.palette.mauve}, ${CONFIG.palette.blue}); color: ${CONFIG.palette.crust}; border: 0; }
      .website-status, .hiding-status { margin-top: 8px; }
      @media (max-width: 640px) { .panel { grid-template-columns: 1fr; padding: 17px; } .heading::after { display: none; } .settings-nav { grid-column: 1; grid-row: auto; flex-direction: row; overflow-x: auto; position: static; padding: 6px; } .category { flex: 1 0 112px; min-height: 48px; } .category small { display: none; } .settings-main { grid-column: 1; grid-row: auto; } .settings-page { grid-template-columns: 1fr; } .settings-page > .control { grid-column: 1; } .section-title, .widget-switches, .website-settings, .element-hiding, .actions, .panel > .help { grid-column: 1; } .widget-switches { grid-template-columns: 1fr 1fr; } .website-settings { grid-template-columns: 1fr; } }
    `;
  }

  template() {
    return `<button type="button" class="settings-toggle" aria-label="Appearance settings" title="Customize appearance"><i class="material-icons">settings</i></button>
      <dialog class="settings-dialog" aria-label="Appearance settings">
        <section class="panel">
          <div class="heading"><h2>Customize</h2><button type="button" class="close" aria-label="Close"><i class="material-icons">close</i></button></div>
          <nav class="settings-nav" aria-label="Settings categories" role="tablist">
            <button type="button" class="category active" role="tab" aria-selected="true" data-category="appearance"><i class="material-icons">palette</i><span>Appearance</span><small>Theme & style</small></button>
            <button type="button" class="category" role="tab" aria-selected="false" data-category="widgets"><i class="material-icons">widgets</i><span>Widgets</span><small>Your status bar</small></button>
            <button type="button" class="category" role="tab" aria-selected="false" data-category="websites"><i class="material-icons">language</i><span>Websites</span><small>Browser styling</small></button>
            <button type="button" class="category" role="tab" aria-selected="false" data-category="advanced"><i class="material-icons">tune</i><span>Advanced</span><small>Fine controls</small></button>
            <button type="button" class="category" role="tab" aria-selected="false" data-category="workspaces"><i class="material-icons">workspaces</i><span>Workspaces</span><small>Organize tabs</small></button>
            <button type="button" class="category" role="tab" aria-selected="false" data-category="focus"><i class="material-icons">do_not_disturb_on</i><span>Focus mode</span><small>Site schedules</small></button>
            <button type="button" class="category" role="tab" aria-selected="false" data-category="commands"><i class="material-icons">terminal</i><span>Commands</span><small>Palette & shortcuts</small></button>
            <button type="button" class="category" role="tab" aria-selected="false" data-category="updates"><i class="material-icons">feed</i><span>Updates</span><small>Topics & frequency</small></button>
            <button type="button" class="category" role="tab" aria-selected="false" data-category="notifications"><i class="material-icons">notifications</i><span>Notifications</span><small>Browser & email</small></button>
            <button type="button" class="category" role="tab" aria-selected="false" data-category="diagnostics"><i class="material-icons">monitor_heart</i><span>Diagnostics</span><small>Browser health</small></button>
          </nav>
          <div class="settings-main">
            <section class="settings-page active" role="tabpanel" data-page="appearance">
              <h3 class="page-heading">Make it yours <span>APPEARANCE</span></h3>
              <div class="control"><label for="transparency">Panel transparency <output data-value="transparency"></output></label><input id="transparency" type="range" min="55" max="100" value="100"></div>
          <div class="control"><label for="roundness">Corner roundness <output data-value="roundness"></output></label><input id="roundness" type="range" min="0" max="28" value="10"></div>
          <div class="control"><label for="blur">Background blur <output data-value="blur"></output></label><input id="blur" type="range" min="0" max="24" value="0"></div>
          <div class="control"><label for="dim">Wallpaper dimming <output data-value="dim"></output></label><input id="dim" type="range" min="0" max="70" value="0"></div>
          <div class="control"><label for="panel-width">Panel width <output data-value="panel-width"></output></label><input id="panel-width" type="range" min="75" max="100" value="94"></div>
          <div class="control"><label for="text-scale">Link text size <output data-value="text-scale"></output></label><input id="text-scale" type="range" min="80" max="130" value="100"></div>
          <div class="control"><label for="spacing">Status bar spacing</label><select id="spacing"><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></div>
          <div class="control"><label for="accent">Accent colour</label><input id="accent" type="color" value="${CONFIG.palette.mauve}"></div>
            </section>
            <section class="settings-page" role="tabpanel" data-page="widgets">
              <h3 class="page-heading">Your dashboard <span>WIDGETS</span></h3>
              <h3 class="section-title">Show in the status bar</h3>
              <div class="widget-switches">
            <label><input id="show-clock" type="checkbox"> Clock</label>
            <label><input id="show-weather" type="checkbox"> Weather</label>
            <label><input id="show-battery" type="checkbox"> Battery</label>
            <label><input id="show-online" type="checkbox"> Online status</label>
            <label><input id="show-music" type="checkbox"> Music button</label>
          </div>
            </section>
            <section class="settings-page" role="tabpanel" data-page="websites">
              <h3 class="page-heading">Across the web <span>WEBSITE APPEARANCE</span></h3>
              <h3 class="section-title">Website appearance</h3>
              <div class="website-settings">
            <div class="control"><label><span>Enable website styling</span><input id="websites-enabled" type="checkbox"></label></div>
            <p class="help">Applies colours and typography to ordinary HTTP and HTTPS pages while the companion extension is installed.</p>
            <div class="website-grid">
              <div class="control website-colour"><label for="websites-background">Background</label><input id="websites-background" type="color"></div>
              <div class="control website-colour"><label for="websites-text">Text</label><input id="websites-text" type="color"></div>
              <div class="control website-colour"><label for="websites-accent">Links</label><input id="websites-accent" type="color"></div>
              <div class="control website-colour"><label for="websites-border">Borders</label><input id="websites-border" type="color"></div>
            </div>
            <div class="control"><label for="websites-opacity">Panel transparency <output data-value="websites-opacity"></output></label><input id="websites-opacity" type="range" min="55" max="100" value="94"></div>
            <div class="control"><label for="websites-blur">Panel blur <output data-value="websites-blur"></output></label><input id="websites-blur" type="range" min="0" max="16" value="0"></div>
            <div class="control"><label for="websites-font">Typography</label><select id="websites-font"><option value="system">System</option><option value="arial">Arial</option><option value="roboto">Roboto</option><option value="georgia">Georgia</option></select></div>
            <div class="control"><label for="websites-spacing">Page spacing</label><select id="websites-spacing"><option value="compact">Compact</option><option value="normal">Normal</option><option value="comfortable">Comfortable</option></select></div>
            <p class="help website-status" role="status">Website styling settings are saved on this device. The companion extension applies them to pages.</p>
          </div>
            </section>
            <section class="settings-page" role="tabpanel" data-page="advanced">
              <h3 class="page-heading">Power user tools <span>ADVANCED</span></h3>
              <h3 class="section-title">Hide elements by site</h3>
              <div class="element-hiding">
            <div class="control"><label><span>Enable element hiding</span><input id="hiding-enabled" type="checkbox"></label></div>
            <p class="help">On a website, click the Startpage extension button and choose “Start element picker”, or press Alt+Shift+P. Click an element to hide it. This works independently of website styling.</p>
            <div class="control"><label for="hidden-rules">Hidden elements by site</label><textarea id="hidden-rules" spellcheck="false" placeholder="example.com | .advertisement\nnews.example.com | #signup-banner"></textarea></div>
            <p class="help hiding-status" role="status">Element hiding settings are saved on this device.</p>
          </div>
            </section>
            <section class="settings-page" role="tabpanel" data-page="workspaces">
              <h3 class="page-heading">Keep tabs organized <span>WORKSPACES</span></h3>
              <div class="control"><label for="workspace-default">Default workspace</label><select id="workspace-default"><option value="">None selected</option></select><p class="help">The command palette can restore this workspace with one command.</p></div>
              <div class="control"><label><span>Save before restoring</span><input id="workspace-save-before-restore" type="checkbox"></label><p class="help">When enabled, save the currently active workspace before opening another one.</p></div>
              <p class="help">Create, rename, restore, and delete workspaces from the browser dashboard. Restoring opens missing tabs and never closes your existing tabs.</p>
              <div class="control"><button type="button" id="open-browser-dashboard">Open browser dashboard</button></div>
            </section>
            <section class="settings-page" role="tabpanel" data-page="focus">
              <h3 class="page-heading">Protect your focus <span>FOCUS MODE</span></h3>
              <div class="control"><label><span>Enable manual focus mode</span><input id="focus-enabled" type="checkbox"></label></div>
              <div class="control"><label><span>Enable scheduled focus</span><input id="focus-schedule-enabled" type="checkbox"></label></div>
              <div class="control"><label for="focus-start">Start time</label><input id="focus-start" type="time" value="09:00"></div>
              <div class="control"><label for="focus-end">End time</label><input id="focus-end" type="time" value="17:00"></div>
              <div class="control"><label for="focus-sites">Websites to pause</label><textarea id="focus-sites" rows="5" placeholder="example.com&#10;social.example"></textarea></div>
              <div class="control focus-days"><label>Repeat on</label><div class="days">
                <label><input type="checkbox" value="1"> Mon</label><label><input type="checkbox" value="2"> Tue</label><label><input type="checkbox" value="3"> Wed</label><label><input type="checkbox" value="4"> Thu</label><label><input type="checkbox" value="5"> Fri</label><label><input type="checkbox" value="6"> Sat</label><label><input type="checkbox" value="0"> Sun</label>
              </div></div>
              <p class="help">Focus mode displays a reminder screen on matching websites. It is a productivity aid, not a security restriction.</p>
              <div class="control"><button type="button" id="open-focus-dashboard">Open focus dashboard</button></div>
            </section>
            <section class="settings-page" role="tabpanel" data-page="commands">
              <h3 class="page-heading">Move faster <span>COMMANDS</span></h3>
              <div class="control"><label><span>Enable right-click tools</span><input id="context-menu-enabled" type="checkbox"></label><p class="help">Adds the Startpage tools submenu to the browser context menu.</p></div>
              <div class="control"><label>Browser-wide command palette</label><strong>Ctrl + Shift + K</strong><p class="help">On macOS, the suggested shortcut is Command + Shift + K.</p></div>
              <div class="control"><label>Right-click menu</label><strong>Startpage tools</strong><p class="help">The submenu adds relevant actions for links and selected text without replacing a website's own context menu.</p></div>
              <p class="help">To change the keyboard shortcut, use Chrome's extension shortcut manager.</p>
              <div class="control"><button type="button" id="open-shortcut-settings">Manage browser shortcuts</button></div>
            </section>
            <section class="settings-page" role="tabpanel" data-page="updates">
              <h3 class="page-heading">Choose what matters <span>UPDATE CENTER</span></h3>
              <div class="control"><label><span>VEX & REC Foundation</span><input id="update-vex" type="checkbox"></label></div>
              <div class="control"><label><span>Xbox sales & releases</span><input id="update-xbox" type="checkbox"></label></div>
              <div class="control"><label><span>Fortnite updates</span><input id="update-fortnite" type="checkbox"></label></div>
              <div class="control"><label><span>Browser & extension news</span><input id="update-browser" type="checkbox"></label></div>
              <div class="control"><label for="update-frequency">Collection preference</label><select id="update-frequency"><option value="daily">Daily summary preference</option><option value="weekly">Weekly summary preference</option></select></div>
              <div class="control"><label for="update-api-url">Google Apps Script web app URL</label><input id="update-api-url" type="url" placeholder="https://script.google.com/macros/s/.../exec"></div>
              <div class="control"><label for="update-api-key">Apps Script API key</label><input id="update-api-key" type="password" autocomplete="off" placeholder="paste the key from the setup log"></div>
              <p class="help">Connect your own Google Apps Script deployment. The key is stored in extension-local storage and is not copied into the startpage's saved settings.</p>
              <div class="control"><button type="button" id="open-update-dashboard">Open update center</button></div>
            </section>
            <section class="settings-page" role="tabpanel" data-page="notifications">
              <h3 class="page-heading">Choose how you hear <span>NOTIFICATIONS</span></h3>
              <div class="control"><label><span>Browser notifications</span><input id="browser-notifications" type="checkbox"></label><p class="help">Requires optional notification permission from the extension dashboard.</p></div>
              <div class="control"><label><span>Email digests</span><input id="email-digests" type="checkbox" disabled></label><p class="help">Unavailable until the approved Google Apps Script update pipeline is verified.</p></div>
              <div class="control"><button type="button" id="open-notification-dashboard">Open notification setup</button></div>
            </section>
            <section class="settings-page" role="tabpanel" data-page="diagnostics">
              <h3 class="page-heading">Know what's happening <span>DIAGNOSTICS</span></h3>
              <div class="control"><label><span>Keep recent diagnostic history</span><input id="diagnostics-history" type="checkbox"></label><p class="help">Stores a small local history of extension errors to help troubleshoot issues.</p></div>
              <p class="help">The dashboard reports tab counts, tab groups, extension status, local storage size, and available active-page load timings. Chrome does not expose every internal performance metric.</p>
              <div class="control"><button type="button" id="open-diagnostics-dashboard">Open diagnostics dashboard</button></div>
            </section>
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
      websiteAppearance: {
        enabled: false,
        background: CONFIG.palette.base,
        text: CONFIG.palette.text,
        accent: CONFIG.palette.blue,
        border: CONFIG.palette.surface1,
        opacity: 94,
        blur: 0,
        font: "system",
        spacing: "normal",
      },
      elementHiding: { enabled: false, hiddenElementsByHost: {} },
      browserFeatures: {
        saveBeforeRestore: false,
        defaultWorkspaceId: "",
        contextMenuEnabled: true,
        focus: { enabled: false, sites: [], schedule: { enabled: false, start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] } },
        updates: { topics: ["vex", "xbox", "fortnite", "browser"], frequency: "daily", apiUrl: "", apiKey: "" },
        notifications: { browser: false, email: false },
        diagnosticsHistory: true,
      },
    };
  }

  getSettings() {
    try {
      const defaults = this.defaults();
      const saved = JSON.parse(localStorage.getItem(AppearanceSettings.storageKey) || "{}");
      const legacyRules = saved.websiteAppearance?.hiddenElementsByHost || {};
      return {
        ...defaults,
        ...saved,
        widgets: { ...defaults.widgets, ...saved.widgets },
        websiteAppearance: { ...defaults.websiteAppearance, ...saved.websiteAppearance },
        elementHiding: saved.elementHiding || { enabled: Object.keys(legacyRules).length > 0, hiddenElementsByHost: legacyRules },
        browserFeatures: {
          ...defaults.browserFeatures,
          ...(saved.browserFeatures || {}),
          focus: { ...defaults.browserFeatures.focus, ...(saved.browserFeatures?.focus || {}), schedule: { ...defaults.browserFeatures.focus.schedule, ...(saved.browserFeatures?.focus?.schedule || {}) } },
          updates: { ...defaults.browserFeatures.updates, ...(saved.browserFeatures?.updates || {}) },
          notifications: { ...defaults.browserFeatures.notifications, ...(saved.browserFeatures?.notifications || {}) },
        },
      };
    } catch {
      return this.defaults();
    }
  }

  bindSettings() {
    const dialog = this.shadow.querySelector(".settings-dialog");
    const toggle = this.shadow.querySelector(".settings-toggle");
    const categoryButtons = [...this.shadow.querySelectorAll(".category")];
    const settingsPages = [...this.shadow.querySelectorAll(".settings-page")];
    const activateCategory = (category) => {
      categoryButtons.forEach((button) => {
        const active = button.dataset.category === category;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      });
      settingsPages.forEach((page) => page.classList.toggle("active", page.dataset.page === category));
    };
    categoryButtons.forEach((button, index) => {
      button.addEventListener("click", () => activateCategory(button.dataset.category));
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        const next = (index + (event.key === "ArrowDown" ? 1 : -1) + categoryButtons.length) % categoryButtons.length;
        categoryButtons[next].focus();
        activateCategory(categoryButtons[next].dataset.category);
      });
    });
    const controls = ["transparency", "roundness", "blur", "dim", "panel-width", "text-scale", "spacing", "accent"];
    const websiteControls = ["websites-background", "websites-text", "websites-accent", "websites-border", "websites-opacity", "websites-blur", "websites-font", "websites-spacing"];
    const rulesInput = this.shadow.querySelector("#hidden-rules");
    const websiteStatus = this.shadow.querySelector(".website-status");
    const hidingStatus = this.shadow.querySelector(".hiding-status");
    this.browserFeatureSettings = this.getSettings().browserFeatures;
    const hidingEnabled = this.shadow.querySelector("#hiding-enabled");
    let extensionSettingsRequest = null;
    let extensionHidingRequest = null;
    let extensionConnected = false;
    let publishTimer = null;
    let publishHidingTimer = null;
    let lastPublishedWebsiteAppearance = null;
    let lastPublishedElementHiding = null;
    const updateConfigRequestId = `update-config-${Date.now()}`;
    const parseHiddenRules = (text) => {
      const rules = {};
      for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        const separator = line.indexOf("|");
        if (separator < 0) continue;
        const host = line.slice(0, separator).trim().toLowerCase();
        const selector = line.slice(separator + 1).trim();
        try {
          if (new URL(`https://${host}`).hostname !== host || !selector || selector.length > 512 || /[{};@\n\r]/.test(selector) || selector.includes("/*") || selector.includes("*/")) continue;
          document.createElement("div").matches(selector);
          rules[host] ||= [];
          if (!rules[host].includes(selector) && rules[host].length < 50) rules[host].push(selector);
        } catch {
          // Ignore invalid hosts and CSS selectors rather than breaking the settings panel.
        }
      }
      return rules;
    };
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.origin !== location.origin) return;
      const message = event.data;
      if (message?.type === "browser-tools-response" && message.requestId === updateConfigRequestId && message.response?.ok) {
        const remote = message.response.settings || {};
        this.browserFeatureSettings.updates = {
          ...this.browserFeatureSettings.updates,
          apiUrl: remote.updateApiUrl || this.browserFeatureSettings.updates.apiUrl || "",
          apiKey: remote.updateApiKey || "",
        };
        this.shadow.querySelector("#update-api-url").value = this.browserFeatureSettings.updates.apiUrl;
        this.shadow.querySelector("#update-api-key").value = this.browserFeatureSettings.updates.apiKey;
      }
      if (message?.type === "startpage-site-settings-response" && message.requestId === extensionSettingsRequest) {
        extensionConnected = Boolean(message.settings);
        websiteStatus.textContent = extensionConnected
          ? "Connected: website appearance settings sync to the companion extension."
          : "Companion extension not detected. Local appearance settings are saved, but website styling will not apply until it is installed.";
      }
      if (message?.type === "startpage-element-hiding-response" && message.requestId === extensionHidingRequest) {
        hidingStatus.textContent = message.settings
          ? "Connected: hidden elements sync to the companion extension independently of website styling."
          : "Companion extension not detected. Install or reload it to use element hiding.";
        const remoteRules = message.settings?.hiddenElementsByHost || {};
        if (message.settings?.enabled) hidingEnabled.checked = true;
        const mergedRules = { ...remoteRules };
        Object.entries(parseHiddenRules(rulesInput.value)).forEach(([host, selectors]) => {
          mergedRules[host] = [...new Set([...(mergedRules[host] || []), ...selectors])];
        });
        rulesInput.value = Object.entries(mergedRules).flatMap(([host, selectors]) => (selectors || []).map((selector) => `${host} | ${selector}`)).join("\n");
        updateElementHiding();
      }
    });
    const update = (publish = true) => {
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
      const websiteAppearance = {
        enabled: this.shadow.querySelector("#websites-enabled").checked,
        background: this.shadow.querySelector("#websites-background").value,
        text: this.shadow.querySelector("#websites-text").value,
        accent: this.shadow.querySelector("#websites-accent").value,
        border: this.shadow.querySelector("#websites-border").value,
        opacity: Math.min(100, Math.max(55, Number(this.shadow.querySelector("#websites-opacity").value))),
        blur: Math.min(16, Math.max(0, Number(this.shadow.querySelector("#websites-blur").value))),
        font: this.shadow.querySelector("#websites-font").value,
        spacing: this.shadow.querySelector("#websites-spacing").value,
      };
      const elementHiding = {
        enabled: hidingEnabled.checked,
        hiddenElementsByHost: parseHiddenRules(rulesInput.value),
      };
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
      this.shadow.querySelector('[data-value="websites-opacity"]').textContent = `${websiteAppearance.opacity}%`;
      this.shadow.querySelector('[data-value="websites-blur"]').textContent = `${websiteAppearance.blur}px`;
      this.shadow.querySelector('[data-value="text-scale"]').textContent = `${textScale}%`;
      const localBrowserFeatures = { ...this.browserFeatureSettings, updates: { ...this.browserFeatureSettings.updates, apiKey: "" } };
      localStorage.setItem(AppearanceSettings.storageKey, JSON.stringify({ transparency, roundness, blur, dim, panelWidth, textScale, spacing: settings.spacing, accent: settings.accent, widgets, websiteAppearance, elementHiding, browserFeatures: localBrowserFeatures }));
      if (publish) {
        const serializedWebsiteAppearance = JSON.stringify(websiteAppearance);
        if (serializedWebsiteAppearance !== lastPublishedWebsiteAppearance) {
          window.clearTimeout(publishTimer);
          publishTimer = window.setTimeout(() => {
            lastPublishedWebsiteAppearance = serializedWebsiteAppearance;
            window.postMessage({ type: "startpage-site-settings", settings: websiteAppearance }, location.origin);
          }, 300);
        }
      }
    };
    const updateElementHiding = (publish = true) => {
      const elementHiding = { enabled: hidingEnabled.checked, hiddenElementsByHost: parseHiddenRules(rulesInput.value) };
      const saved = JSON.parse(localStorage.getItem(AppearanceSettings.storageKey) || "{}");
      const localBrowserFeatures = { ...this.browserFeatureSettings, updates: { ...this.browserFeatureSettings.updates, apiKey: "" } };
      localStorage.setItem(AppearanceSettings.storageKey, JSON.stringify({ ...saved, elementHiding, browserFeatures: localBrowserFeatures }));
      if (!publish) return;
      const serialized = JSON.stringify(elementHiding);
      if (serialized !== lastPublishedElementHiding) {
        window.clearTimeout(publishHidingTimer);
        publishHidingTimer = window.setTimeout(() => {
          lastPublishedElementHiding = serialized;
          window.postMessage({ type: "startpage-element-hiding-settings", settings: elementHiding }, location.origin);
        }, 250);
      }
    };

    const publishBrowserFeatureSettings = () => {
      const focus = {
        enabled: this.shadow.querySelector("#focus-enabled").checked,
        sites: this.shadow.querySelector("#focus-sites").value.split("\n").map((site) => site.trim()).filter(Boolean),
        schedule: {
          enabled: this.shadow.querySelector("#focus-schedule-enabled").checked,
          start: this.shadow.querySelector("#focus-start").value || "09:00",
          end: this.shadow.querySelector("#focus-end").value || "17:00",
          days: [...this.shadow.querySelectorAll(".focus-days input:checked")].map((input) => Number(input.value)),
        },
      };
      this.browserFeatureSettings = {
        ...this.browserFeatureSettings,
        saveBeforeRestore: this.shadow.querySelector("#workspace-save-before-restore").checked,
        defaultWorkspaceId: this.shadow.querySelector("#workspace-default").value,
        contextMenuEnabled: this.shadow.querySelector("#context-menu-enabled").checked,
        focus,
        updates: {
          topics: ["vex", "xbox", "fortnite", "browser"].filter((topic) => this.shadow.querySelector("#update-" + topic).checked),
          frequency: this.shadow.querySelector("#update-frequency").value,
          apiUrl: this.shadow.querySelector("#update-api-url").value.trim(),
          apiKey: this.shadow.querySelector("#update-api-key").value.trim(),
        },
        notifications: {
          browser: this.shadow.querySelector("#browser-notifications").checked,
          email: false,
        },
        diagnosticsHistory: this.shadow.querySelector("#diagnostics-history").checked,
      };
      const saved = JSON.parse(localStorage.getItem(AppearanceSettings.storageKey) || "{}");
      const localBrowserFeatures = { ...this.browserFeatureSettings, updates: { ...this.browserFeatureSettings.updates, apiKey: "" } };
      localStorage.setItem(AppearanceSettings.storageKey, JSON.stringify({ ...saved, browserFeatures: localBrowserFeatures }));
      const requestId = `features-${Date.now()}`;
      window.postMessage({ type: "browser-tools-settings-set", requestId, settings: {
        saveBeforeRestore: this.browserFeatureSettings.saveBeforeRestore,
        defaultWorkspaceId: this.browserFeatureSettings.defaultWorkspaceId,
        contextMenuEnabled: this.browserFeatureSettings.contextMenuEnabled,
        diagnosticsHistory: this.browserFeatureSettings.diagnosticsHistory,
        browserNotifications: this.browserFeatureSettings.notifications.browser,
        updateApiUrl: this.browserFeatureSettings.updates.apiUrl,
        updateApiKey: this.browserFeatureSettings.updates.apiKey,
        updateTopics: this.browserFeatureSettings.updates.topics,
      } }, location.origin);
      window.postMessage({ type: "browser-tools-focus-set", requestId: `focus-${Date.now()}`, settings: focus }, location.origin);
    };

    const workspaceRequestId = `workspace-options-${Date.now()}`;
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.origin !== location.origin) return;
      const message = event.data;
      if (message?.type !== "browser-tools-response" || message.requestId !== workspaceRequestId) return;
      const response = message.response;
      const select = this.shadow.querySelector("#workspace-default");
      const selected = this.browserFeatureSettings.defaultWorkspaceId || response?.defaultWorkspaceId || "";
      select.replaceChildren(new Option("None selected", ""));
      (response?.workspaces || []).forEach((workspace) => {
        const option = new Option(workspace.name, workspace.id);
        select.append(option);
      });
      select.value = selected;
    });
    window.postMessage({ type: "browser-tools-workspaces-get", requestId: workspaceRequestId }, location.origin);

    const settings = this.getSettings();
    const browserFeatures = settings.browserFeatures;
    this.browserFeatureSettings = browserFeatures;
    this.shadow.querySelector("#workspace-save-before-restore").checked = browserFeatures.saveBeforeRestore === true;
    this.shadow.querySelector("#workspace-default").value = browserFeatures.defaultWorkspaceId || "";
    this.shadow.querySelector("#context-menu-enabled").checked = browserFeatures.contextMenuEnabled !== false;
    this.shadow.querySelector("#focus-enabled").checked = browserFeatures.focus.enabled === true;
    this.shadow.querySelector("#focus-schedule-enabled").checked = browserFeatures.focus.schedule.enabled === true;
    this.shadow.querySelector("#focus-start").value = browserFeatures.focus.schedule.start || "09:00";
    this.shadow.querySelector("#focus-end").value = browserFeatures.focus.schedule.end || "17:00";
    this.shadow.querySelector("#focus-sites").value = (browserFeatures.focus.sites || []).join("\n");
    this.shadow.querySelectorAll(".focus-days input").forEach((input) => {
      input.checked = (browserFeatures.focus.schedule.days || []).includes(Number(input.value));
    });
    ["vex", "xbox", "fortnite", "browser"].forEach((topic) => {
      this.shadow.querySelector("#update-" + topic).checked = (browserFeatures.updates.topics || []).includes(topic);
    });
    this.shadow.querySelector("#update-frequency").value = browserFeatures.updates.frequency || "daily";
    this.shadow.querySelector("#browser-notifications").checked = browserFeatures.notifications.browser === true;
    this.shadow.querySelector("#diagnostics-history").checked = browserFeatures.diagnosticsHistory !== false;
    const featureControls = [
      "#workspace-save-before-restore", "#workspace-default", "#context-menu-enabled", "#focus-enabled", "#focus-schedule-enabled", "#focus-start", "#focus-end", "#focus-sites",
      ".focus-days input", "#update-vex", "#update-xbox", "#update-fortnite", "#update-browser",
      "#update-frequency", "#update-api-url", "#update-api-key", "#browser-notifications", "#diagnostics-history",
    ];
    featureControls.forEach((selector) => this.shadow.querySelectorAll(selector).forEach((control) => {
      control.addEventListener("change", publishBrowserFeatureSettings);
      control.addEventListener("input", publishBrowserFeatureSettings);
    }));
    const openDashboard = () => window.postMessage({ type: "browser-tools-open-dashboard", requestId: `dashboard-${Date.now()}` }, location.origin);
    ["#open-browser-dashboard", "#open-focus-dashboard", "#open-notification-dashboard", "#open-diagnostics-dashboard", "#open-update-dashboard"].forEach((selector) => {
      this.shadow.querySelector(selector).addEventListener("click", openDashboard);
    });
    this.shadow.querySelector("#open-shortcut-settings").addEventListener("click", () => {
      window.postMessage({ type: "browser-tools-open-shortcut-settings", requestId: `shortcuts-${Date.now()}` }, location.origin);
    });
    window.postMessage({ type: "browser-tools-settings-set", requestId: `features-init-${Date.now()}`, settings: {
      saveBeforeRestore: browserFeatures.saveBeforeRestore,
      defaultWorkspaceId: browserFeatures.defaultWorkspaceId,
      contextMenuEnabled: browserFeatures.contextMenuEnabled,
      diagnosticsHistory: browserFeatures.diagnosticsHistory,
      browserNotifications: browserFeatures.notifications.browser,
      updateApiUrl: browserFeatures.updates.apiUrl || "",
      updateTopics: browserFeatures.updates.topics || ["vex", "xbox", "fortnite", "browser"],
    } }, location.origin);
    window.postMessage({ type: "browser-tools-settings-get", requestId: updateConfigRequestId }, location.origin);
    window.postMessage({ type: "browser-tools-focus-set", requestId: `focus-init-${Date.now()}`, settings: browserFeatures.focus }, location.origin);
    const settingIds = { "panel-width": "panelWidth", "text-scale": "textScale" };
    controls.forEach((id) => { this.shadow.querySelector(`#${id}`).value = settings[settingIds[id] || id]; });
    Object.entries(settings.widgets).forEach(([name, visible]) => {
      this.shadow.querySelector(`#show-${name}`).checked = visible;
    });
    this.shadow.querySelector("#websites-enabled").checked = settings.websiteAppearance.enabled;
    ["background", "text", "accent", "border"].forEach((name) => { this.shadow.querySelector(`#websites-${name}`).value = settings.websiteAppearance[name]; });
    this.shadow.querySelector("#websites-opacity").value = settings.websiteAppearance.opacity;
    this.shadow.querySelector("#websites-blur").value = settings.websiteAppearance.blur;
    this.shadow.querySelector("#websites-font").value = settings.websiteAppearance.font;
    this.shadow.querySelector("#websites-spacing").value = settings.websiteAppearance.spacing;
    hidingEnabled.checked = settings.elementHiding.enabled;
    rulesInput.value = Object.entries(settings.elementHiding.hiddenElementsByHost).flatMap(([host, selectors]) => (selectors || []).map((selector) => `${host} | ${selector}`)).join("\n");
    update(false);
    controls.forEach((id) => this.shadow.querySelector(`#${id}`).addEventListener("input", update));
    Object.keys(settings.widgets).forEach((name) => this.shadow.querySelector(`#show-${name}`).addEventListener("change", update));
    websiteControls.forEach((id) => {
      const control = this.shadow.querySelector(`#${id}`);
      control.addEventListener("input", update);
      control.addEventListener("change", update);
    });
    this.shadow.querySelector("#websites-enabled").addEventListener("change", update);
    hidingEnabled.addEventListener("change", updateElementHiding);
    rulesInput.addEventListener("input", updateElementHiding);
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
      this.shadow.querySelector("#websites-enabled").checked = defaults.websiteAppearance.enabled;
      ["background", "text", "accent", "border"].forEach((name) => { this.shadow.querySelector(`#websites-${name}`).value = defaults.websiteAppearance[name]; });
      this.shadow.querySelector("#websites-opacity").value = defaults.websiteAppearance.opacity;
      this.shadow.querySelector("#websites-blur").value = defaults.websiteAppearance.blur;
      this.shadow.querySelector("#websites-font").value = defaults.websiteAppearance.font;
      this.shadow.querySelector("#websites-spacing").value = defaults.websiteAppearance.spacing;
      update();
    };
    extensionSettingsRequest = `settings-${Date.now()}`;
    window.postMessage({ type: "startpage-site-settings-get", requestId: extensionSettingsRequest }, location.origin);
    extensionHidingRequest = `hiding-${Date.now()}`;
    window.postMessage({ type: "startpage-element-hiding-get", requestId: extensionHidingRequest }, location.origin);
    window.setTimeout(() => {
      if (!extensionConnected) websiteStatus.textContent = "Companion extension not detected. Local appearance settings are saved, but website styling will not apply until it is installed.";
    }, 1800);
  }
}
