// A compact player for audio loaded into this page
class MusicControl extends Component {
  objectUrl = null;
  remoteMedia = null;
  remoteSources = [];
  selectedSourceKey = null;
  localMode = false;
  refreshTimer = null;
  requestId = 0;
  pendingRequests = new Map();

  imports() {
    return [this.getResource("icons", "material"), this.getResource("fonts", "roboto"), this.getResource("fonts", "nunito"), this.getResource("fonts", "raleway")];
  }

  style() {
    return `
      :host { color: ${CONFIG.palette.text}; }
      .music-button { height: 100%; display: flex; align-items: center; gap: 6px; padding: 0; border: 0; background: transparent; color: ${CONFIG.palette.text}; font: 700 9pt 'Nunito', 'Roboto', sans-serif; cursor: pointer; white-space: nowrap; transition: color .18s ease; }
      .music-button:hover { color: ${CONFIG.palette.mauve}; }
      .music-button i { color: ${CONFIG.palette.mauve}; font-size: 16pt; }
      .player-dialog { position: fixed; inset: auto 16px 48px auto; width: min(390px, calc(100vw - 32px)); max-width: calc(100vw - 32px); max-height: min(90vh, 700px); margin: 0; padding: 0; overflow: visible; border: 0; background: transparent; color: ${CONFIG.palette.text}; }
      .player-dialog::backdrop { background: transparent; }
      .player { width: 100%; max-height: min(90vh, 700px); overflow: auto; box-sizing: border-box; padding: 17px; border: 1px solid color-mix(in srgb, ${CONFIG.palette.mauve} 35%, ${CONFIG.palette.surface1}); border-radius: 15px; background: linear-gradient(145deg, color-mix(in srgb, ${CONFIG.palette.mantle} 96%, ${CONFIG.palette.mauve} 4%), ${CONFIG.palette.base} 58%, color-mix(in srgb, ${CONFIG.palette.mantle} 93%, ${CONFIG.palette.blue} 7%)); color: ${CONFIG.palette.text}; box-shadow: 0 15px 42px rgb(0 0 0 / 42%); backdrop-filter: blur(var(--startpage-blur, 0px)); font: 400 13px 'Nunito', 'Roboto', sans-serif; }
      .player-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 13px; }
      .heading-title { color: ${CONFIG.palette.mauve}; font: 900 12px 'Nunito', sans-serif; letter-spacing: .13em; text-transform: uppercase; }
      .heading-subtitle { margin-top: 2px; color: ${CONFIG.palette.subtext0}; font: 600 10px 'Nunito', sans-serif; }
      .close-player { flex: none; width: 28px; height: 28px; display: grid; place-items: center; padding: 0 !important; border: 1px solid ${CONFIG.palette.surface1} !important; border-radius: 8px !important; background: color-mix(in srgb, ${CONFIG.palette.surface0} 72%, transparent) !important; color: ${CONFIG.palette.subtext1} !important; }
      .now-playing-card { position: relative; overflow: hidden; padding: 16px; border: 1px solid color-mix(in srgb, ${CONFIG.palette.mauve} 28%, ${CONFIG.palette.blue}); border-radius: 12px; background: linear-gradient(125deg, color-mix(in srgb, ${CONFIG.palette.mauve} 30%, ${CONFIG.palette.mantle}) 0%, color-mix(in srgb, ${CONFIG.palette.blue} 25%, ${CONFIG.palette.base}) 100%); box-shadow: inset 0 1px 0 rgb(255 255 255 / 5%), 0 7px 20px rgb(0 0 0 / 18%); }
      .now-playing-card::after { content: ''; position: absolute; width: 170px; height: 170px; right: -95px; top: -105px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, ${CONFIG.palette.pink} 18%, transparent), transparent 70%); pointer-events: none; }
      .card-label { color: ${CONFIG.palette.lavender}; font: 800 9px 'Nunito', sans-serif; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 10px; }
      .track { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${CONFIG.palette.text}; font: 900 20px/1.2 'Nunito', sans-serif; letter-spacing: -.035em; margin-bottom: 5px; }
      .source { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${CONFIG.palette.subtext1}; font: 600 11px 'Nunito', sans-serif; }
      .idle { color: ${CONFIG.palette.subtext0}; font-size: 12px; line-height: 1.5; }
      .controls { display: grid; grid-template-columns: 38px 1fr; align-items: center; gap: 10px; margin-top: 15px; }
      .player button { border: 1px solid ${CONFIG.palette.surface1}; border-radius: 8px; padding: 7px; background: color-mix(in srgb, ${CONFIG.palette.surface0} 80%, transparent); color: ${CONFIG.palette.text}; cursor: pointer; transition: border-color .15s ease, background .15s ease, transform .15s ease; }
      .player button:hover:not(:disabled) { border-color: ${CONFIG.palette.mauve}; background: ${CONFIG.palette.surface1}; }
      .player button:disabled { opacity: .42; cursor: not-allowed; }
      .player button.play { width: 38px; height: 38px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 10px; background: linear-gradient(120deg, ${CONFIG.palette.mauve}, ${CONFIG.palette.blue}); color: ${CONFIG.palette.crust}; box-shadow: 0 4px 13px color-mix(in srgb, ${CONFIG.palette.mauve} 28%, transparent); }
      .player button.play i { font-size: 21px; }
      .player input[type="range"] { width: 100%; height: 5px; margin: 0; border-radius: 99px; accent-color: ${CONFIG.palette.pink}; cursor: pointer; }
      .player input.seek { accent-color: ${CONFIG.palette.peach}; }
      .time { display: flex; justify-content: space-between; color: ${CONFIG.palette.subtext0}; font: 600 10px 'Roboto Mono', monospace; font-variant-numeric: tabular-nums; margin: 6px 0 0 48px; }
      .volume { display: flex; align-items: center; gap: 9px; margin-top: 13px; padding-top: 12px; border-top: 1px solid color-mix(in srgb, ${CONFIG.palette.surface1} 75%, transparent); }
      .volume i { color: ${CONFIG.palette.subtext1}; font-size: 17px; }
      .volume input { flex: 1; }
      .section-heading { display: flex; align-items: center; justify-content: space-between; margin: 16px 1px 7px; }
      .section-title { color: ${CONFIG.palette.subtext1}; font: 800 9px 'Nunito', sans-serif; letter-spacing: .13em; text-transform: uppercase; }
      .source-count { color: ${CONFIG.palette.subtext0}; font: 600 10px 'Nunito', sans-serif; }
      .source-list { display: grid; gap: 5px; }
      .source-row { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px !important; border: 1px solid transparent !important; border-radius: 8px !important; background: color-mix(in srgb, ${CONFIG.palette.surface0} 48%, transparent) !important; text-align: left; }
      .source-row:hover, .source-row.selected { border-color: color-mix(in srgb, ${CONFIG.palette.mauve} 42%, ${CONFIG.palette.surface1}) !important; background: linear-gradient(105deg, color-mix(in srgb, ${CONFIG.palette.mauve} 18%, ${CONFIG.palette.surface0}), color-mix(in srgb, ${CONFIG.palette.blue} 16%, ${CONFIG.palette.surface0})) !important; }
      .source-indicator { flex: none; width: 7px; height: 7px; border-radius: 50%; background: ${CONFIG.palette.overlay1}; }
      .source-indicator.playing { background: ${CONFIG.palette.green}; box-shadow: 0 0 7px color-mix(in srgb, ${CONFIG.palette.green} 55%, transparent); }
      .source-copy { display: grid; min-width: 0; flex: 1; gap: 2px; }
      .source-name { overflow: hidden; color: ${CONFIG.palette.text}; font: 800 11px 'Nunito', sans-serif; text-overflow: ellipsis; white-space: nowrap; }
      .source-detail { overflow: hidden; color: ${CONFIG.palette.subtext0}; font: 600 10px 'Nunito', sans-serif; text-overflow: ellipsis; white-space: nowrap; }
      .file-row { display: flex; align-items: center; gap: 8px; margin-top: 13px; }
      .file-row label { display: inline-block; cursor: pointer; }
      .file-row button { padding: 7px 10px; font: 800 10px 'Nunito', sans-serif; }
      .file-row button.primary { border: 0; background: linear-gradient(110deg, ${CONFIG.palette.mauve}, ${CONFIG.palette.blue}); color: ${CONFIG.palette.crust}; }
      .file-row input[type="file"] { display: none; }
      .hint { margin: 10px 0 0; color: ${CONFIG.palette.subtext0}; font-size: 10px; line-height: 1.45; }
      audio { display: none; }
      @media (max-width: 420px) { .player { padding: 14px; } .track { font-size: 18px; } }
    `;
  }

  template() {
    return `<button class="music-button" type="button" aria-expanded="false" title="Open music controls"><i class="material-icons">music_note</i><span>Music</span></button>
      <dialog class="player-dialog" aria-label="Music controls">
       <section class="player">
        <div class="player-heading"><div><div class="heading-title">music</div><div class="heading-subtitle">browser media controls</div></div><button class="close-player" type="button" aria-label="Close music player"><i class="material-icons">close</i></button></div>
        <section class="now-playing-card" aria-label="Currently playing">
          <div class="card-label">now playing</div>
          <div class="track">Nothing playing right now</div>
          <div class="source idle">Start audio in another tab or choose a local file.</div>
          <audio preload="metadata"></audio>
          <div class="controls"><button class="play" type="button" aria-label="Play" disabled><i class="material-icons">play_arrow</i></button><input class="seek" type="range" min="0" max="1000" value="0" aria-label="Track position" disabled></div>
          <div class="time"><span class="elapsed">0:00</span><span class="duration">0:00</span></div>
          <div class="volume"><i class="material-icons">volume_down</i><input class="volume-range" type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Volume"></div>
        </section>
        <section class="other-sources">
          <div class="section-heading"><span class="section-title">other media sources</span><span class="source-count">0 found</span></div>
          <div class="source-list"><div class="idle">No other media sources found.</div></div>
        </section>
        <div class="file-row"><label><button class="primary" type="button">Choose audio</button><input class="file" type="file" accept="audio/*"></label><button class="clear" type="button" disabled>Clear audio</button></div>
        <p class="hint">Select a source to bring it into the main player. Local audio stays in this page.</p>
       </section>
      </dialog>`;
  }

  connectedCallback() {
    this.render().then(() => this.bindPlayer());
  }

  bindPlayer() {
    const query = (selector) => this.shadow.querySelector(selector);
    const audio = query("audio");
    const panel = query(".player-dialog");
    const toggle = query(".music-button");
    const play = query(".play");
    const seek = query(".seek");
    const file = query(".file");
    audio.volume = Number(query(".volume-range").value);

    window.addEventListener("message", (event) => {
      if (event.source !== window || event.origin !== location.origin) return;
      const message = event.data;
      if (message?.type !== "startpage-media-response") return;
      const pending = this.pendingRequests.get(message.requestId);
      if (!pending) return;
      this.pendingRequests.delete(message.requestId);
      clearTimeout(pending.timeout);
      pending.resolve(message.response);
    });

    toggle.onclick = () => {
      if (panel.open) {
        panel.close();
      } else {
        panel.showModal();
        toggle.setAttribute("aria-expanded", "true");
        this.refreshRemote();
        this.refreshTimer = window.setInterval(() => this.refreshRemote(), 2500);
      }
    };
    panel.addEventListener("close", () => {
      toggle.setAttribute("aria-expanded", "false");
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    });
    query(".close-player").onclick = () => panel.close();
    query(".source-list").addEventListener("click", (event) => {
      const row = event.target.closest(".source-row");
      if (!row) return;
      this.selectedSourceKey = row.dataset.sourceKey || null;
      this.localMode = false;
      this.refreshRemote();
    });
    panel.addEventListener("click", (event) => { if (event.target === panel) panel.close(); });
    file.onchange = () => {
      const selected = file.files?.[0];
      if (!selected) return;
      this.releaseAudioUrl();
      this.objectUrl = URL.createObjectURL(selected);
      audio.src = this.objectUrl;
      query(".track").textContent = selected.name;
      query(".source").textContent = "Playing from this device";
      this.remoteMedia = null;
      this.localMode = true;
      this.remoteSources = [];
      this.remoteMedia = null;
      query(".other-sources").hidden = true;
      query(".track").textContent = selected.name;
      query(".source").textContent = "Playing from this device";
      play.disabled = false;
      seek.disabled = false;
      query(".clear").disabled = false;
      audio.play().catch(() => {});
    };
    play.onclick = () => {
      if (this.remoteMedia) {
        this.sendRemote(this.remoteMedia.playing ? "pause" : "play");
        return;
      }
      audio.paused ? audio.play() : audio.pause();
    };
    audio.onplay = () => { query(".play i").textContent = "pause"; play.setAttribute("aria-label", "Pause"); };
    audio.onpause = () => { query(".play i").textContent = "play_arrow"; play.setAttribute("aria-label", "Play"); };
    audio.ontimeupdate = () => {
      if (this.remoteMedia) return;
      if (Number.isFinite(audio.duration) && audio.duration > 0) seek.value = String(Math.round(audio.currentTime / audio.duration * 1000));
      query(".elapsed").textContent = this.formatTime(audio.currentTime);
    };
    audio.onloadedmetadata = () => { query(".duration").textContent = this.formatTime(audio.duration); };
    seek.oninput = () => {
      if (this.remoteMedia?.seekable && this.remoteMedia.duration) {
        const seconds = Number(seek.value) / 1000 * this.remoteMedia.duration;
        query(".elapsed").textContent = this.formatTime(seconds);
      } else if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 1000 * audio.duration;
    };
    seek.onchange = () => {
      if (this.remoteMedia?.seekable) this.sendRemote("seek", Number(seek.value) / 1000 * this.remoteMedia.duration);
    };
    query(".volume-range").oninput = (event) => {
      const volume = Number(event.target.value);
      if (this.remoteMedia) this.sendRemote("volume", volume);
      else audio.volume = volume;
    };
    query(".clear").onclick = () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      this.releaseAudioUrl();
      file.value = "";
      query(".other-sources").hidden = false;
      query(".track").textContent = "Nothing playing right now";
      query(".source").textContent = "Start audio in another tab or choose a local file.";
      query(".duration").textContent = "0:00";
      query(".elapsed").textContent = "0:00";
      seek.value = "0";
      play.disabled = true;
      seek.disabled = true;
      query(".clear").disabled = true;
      this.localMode = false;
      if (panel.open) this.refreshRemote();
    };
    window.addEventListener("beforeunload", () => this.releaseAudioUrl(), { once: true });
    this.refreshRemote();
  }

  requestRemote(action, value, target) {
    return new Promise((resolve) => {
      const requestId = `media-${++this.requestId}`;
      const timeout = window.setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve({ error: "Media extension not connected" });
      }, 1800);
      this.pendingRequests.set(requestId, { resolve, timeout });
      window.postMessage({ type: "startpage-media-request", requestId, action, value, target }, location.origin);
    });
  }

  sourceKey(media) {
    return `${media.tabId}:${media.frameId}:${media.mediaIndex}`;
  }

  renderSources(sources) {
    const list = this.shadow.querySelector(".source-list");
    const section = this.shadow.querySelector(".other-sources");
    const others = sources.filter((source) => this.sourceKey(source) !== this.selectedSourceKey);
    section.hidden = this.localMode || others.length === 0;
    this.shadow.querySelector(".source-count").textContent = `${others.length} found`;
    list.replaceChildren();
    if (!others.length) return;

    others.forEach((source) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "source-row";
      row.dataset.sourceKey = this.sourceKey(source);
      const indicator = document.createElement("span");
      indicator.className = `source-indicator${source.playing ? " playing" : ""}`;
      const copy = document.createElement("span");
      copy.className = "source-copy";
      const name = document.createElement("span");
      name.className = "source-name";
      name.textContent = [source.title, source.artist].filter(Boolean).join(" · ") || source.host || "Media source";
      const detail = document.createElement("span");
      detail.className = "source-detail";
      detail.textContent = `${source.host || "browser tab"} · ${source.playing ? "playing" : "paused"}`;
      copy.append(name, detail);
      row.append(indicator, copy);
      list.append(row);
    });
  }

  async refreshRemote() {
    if (this.localMode) return;
    const response = await this.requestRemote("getState");
    const media = Array.isArray(response?.media) ? response.media : (response?.media ? [response.media] : []);
    this.remoteSources = media;
    if (media.length) {
      const selected = media.find((source) => this.sourceKey(source) === this.selectedSourceKey)
        || media.find((source) => source.playing)
        || media[0];
      this.selectedSourceKey = this.sourceKey(selected);
      this.remoteMedia = selected;
      const title = [selected.title, selected.artist].filter(Boolean).join(" · ");
      this.shadow.querySelector(".track").textContent = title || "Media in another tab";
      this.shadow.querySelector(".source").textContent = `${selected.host || "Other tab"} · ${selected.playing ? "Playing" : "Paused"}`;
      this.shadow.querySelector(".source").classList.remove("idle");
      const audio = this.shadow.querySelector("audio");
      const play = this.shadow.querySelector(".play");
      const seek = this.shadow.querySelector(".seek");
      play.disabled = false;
      this.shadow.querySelector(".play i").textContent = selected.playing ? "pause" : "play_arrow";
      play.setAttribute("aria-label", selected.playing ? "Pause" : "Play");
      seek.disabled = !selected.seekable;
      if (selected.seekable && selected.duration > 0) seek.value = String(Math.round(selected.currentTime / selected.duration * 1000));
      this.shadow.querySelector(".elapsed").textContent = this.formatTime(selected.currentTime);
      this.shadow.querySelector(".duration").textContent = this.formatTime(selected.duration);
      this.shadow.querySelector(".volume-range").value = String(selected.volume);
      this.shadow.querySelector(".clear").disabled = !audio.src;
      this.renderSources(media);
      return;
    }

    this.remoteMedia = null;
    this.selectedSourceKey = null;
    this.renderSources([]);
    const audio = this.shadow.querySelector("audio");
    if (audio.src) {
      this.shadow.querySelector(".track").textContent = audio.paused ? "Local audio ready" : "Playing from this device";
      this.shadow.querySelector(".source").textContent = "Local audio file";
      this.shadow.querySelector(".play").disabled = false;
      this.shadow.querySelector(".seek").disabled = false;
      this.shadow.querySelector(".other-sources").hidden = true;
    } else {
      this.shadow.querySelector(".track").textContent = "Nothing playing right now";
      this.shadow.querySelector(".source").textContent = "Start audio in another tab or choose a local file.";
      this.shadow.querySelector(".source").classList.add("idle");
      this.shadow.querySelector(".play").disabled = true;
      this.shadow.querySelector(".seek").disabled = true;
      this.shadow.querySelector(".play i").textContent = "play_arrow";
      this.shadow.querySelector(".elapsed").textContent = "0:00";
      this.shadow.querySelector(".duration").textContent = "0:00";
    }
  }

  async sendRemote(action, value) {
    if (!this.remoteMedia) return;
    const result = await this.requestRemote(action, value, this.remoteMedia);
    if (!result || result.ok !== true) {
      this.shadow.querySelector(".source").textContent = result?.error || "The browser extension could not execute that media action.";
      return;
    }
    if (result.media) this.remoteMedia = { ...this.remoteMedia, ...result.media };
    await this.refreshRemote();
  }

  formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  releaseAudioUrl() {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }
}
