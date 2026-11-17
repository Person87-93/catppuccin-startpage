// A compact player for audio loaded into this page
class MusicControl extends Component {
  objectUrl = null;
  remoteMedia = null;
  localMode = false;
  refreshTimer = null;
  requestId = 0;
  pendingRequests = new Map();

  imports() {
    return [this.getResource("icons", "material"), this.getResource("fonts", "roboto")];
  }

  style() {
    return `
      .music-button { height: 100%; display: flex; align-items: center; gap: 5px; padding: 0; border: 0; background: transparent; color: ${CONFIG.palette.text}; font: 300 9pt 'Roboto', sans-serif; cursor: pointer; white-space: nowrap; }
      .music-button i { color: ${CONFIG.palette.mauve}; font-size: 14pt; }
      .player-dialog { position: fixed; inset: auto 16px 48px auto; width: min(340px, calc(100vw - 32px)); max-width: calc(100vw - 32px); max-height: min(90vh, 600px); margin: 0; padding: 0; overflow: visible; border: 0; background: transparent; color: ${CONFIG.palette.text}; }
      .player-dialog::backdrop { background: transparent; }
      .player { width: 100%; max-height: min(90vh, 600px); overflow: auto; padding: 16px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: var(--startpage-radius, 10px); background: color-mix(in srgb, ${CONFIG.palette.mantle} var(--startpage-opacity, 100%), transparent); color: ${CONFIG.palette.text}; box-shadow: 0 12px 32px rgb(0 0 0 / 35%); backdrop-filter: blur(var(--startpage-blur, 0px)); font: 400 13px 'Roboto', sans-serif; }
      .player-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
      .track { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; margin-bottom: 4px; }
      .close-player { flex: none; padding: 3px !important; }
      .source { color: ${CONFIG.palette.subtext0}; font-size: 11px; margin-bottom: 12px; }
      .controls { display: grid; grid-template-columns: 36px 1fr; align-items: center; gap: 8px; }
      .player button { border: 0; border-radius: 7px; padding: 7px; background: ${CONFIG.palette.surface0}; color: ${CONFIG.palette.text}; cursor: pointer; }
      .player input[type="range"] { width: 100%; accent-color: var(--startpage-accent, var(--accent)); }
      .time { display: flex; justify-content: space-between; color: ${CONFIG.palette.subtext0}; font-size: 11px; margin-top: 3px; }
      .volume, .file-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
      .volume i { color: ${CONFIG.palette.subtext0}; font-size: 17px; }
      .file-row label { display: inline-block; cursor: pointer; }
      .file-row input[type="file"] { display: none; }
      .hint { margin-top: 10px; color: ${CONFIG.palette.subtext0}; font-size: 11px; line-height: 1.4; }
      audio { display: none; }
    `;
  }

  template() {
    return `<button class="music-button" type="button" aria-expanded="false" title="Open this page's music player"><i class="material-icons">music_note</i><span>Music</span></button>
      <dialog class="player-dialog" aria-label="Music player">
       <section class="player">
        <div class="player-heading"><div class="track">Looking for music in other tabs…</div><button class="close-player" type="button" aria-label="Close music player"><i class="material-icons">close</i></button></div>
        <div class="source">Media control extension not connected</div>
        <audio preload="metadata"></audio>
        <div class="controls"><button class="play" type="button" aria-label="Play" disabled><i class="material-icons">play_arrow</i></button><input class="seek" type="range" min="0" max="1000" value="0" aria-label="Track position" disabled></div>
        <div class="time"><span class="elapsed">0:00</span><span class="duration">0:00</span></div>
        <div class="volume"><i class="material-icons">volume_down</i><input class="volume-range" type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Volume"></div>
        <div class="file-row"><label><button type="button">Choose audio</button><input class="file" type="file" accept="audio/*"></label><button class="clear" type="button" disabled>Clear</button></div>
        <p class="hint">Connect the optional browser extension to control media in other tabs, or choose an audio file to play here.</p>
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
      query(".track").textContent = "Choose an audio file to play";
      query(".source").textContent = "Media control extension not connected";
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

  async refreshRemote() {
    if (this.localMode) return;
    const response = await this.requestRemote("getState");
    if (response?.media) {
      this.remoteMedia = response.media;
      const media = this.remoteMedia;
      const title = [media.title, media.artist].filter(Boolean).join(" — ");
      this.shadow.querySelector(".track").textContent = title || "Media in another tab";
      this.shadow.querySelector(".source").textContent = `${media.host}${media.playing ? " · Playing" : " · Paused"}`;
      const audio = this.shadow.querySelector("audio");
      const play = this.shadow.querySelector(".play");
      const seek = this.shadow.querySelector(".seek");
      play.disabled = false;
      this.shadow.querySelector(".play i").textContent = media.playing ? "pause" : "play_arrow";
      play.setAttribute("aria-label", media.playing ? "Pause" : "Play");
      seek.disabled = !media.seekable;
      if (media.seekable && media.duration > 0) seek.value = String(Math.round(media.currentTime / media.duration * 1000));
      this.shadow.querySelector(".elapsed").textContent = this.formatTime(media.currentTime);
      this.shadow.querySelector(".duration").textContent = this.formatTime(media.duration);
      this.shadow.querySelector(".volume-range").value = String(media.volume);
      this.shadow.querySelector(".clear").disabled = !audio.src;
      return;
    }

    this.remoteMedia = null;
    const audio = this.shadow.querySelector("audio");
    if (audio.src) {
      this.shadow.querySelector(".track").textContent = audio.paused ? "Ready to play" : "Playing from this device";
      this.shadow.querySelector(".source").textContent = "Local audio file";
      this.shadow.querySelector(".play").disabled = false;
      this.shadow.querySelector(".seek").disabled = false;
    } else {
      this.shadow.querySelector(".track").textContent = "No media found in other tabs";
      this.shadow.querySelector(".source").textContent = "Extension unavailable or site access not allowed";
      this.shadow.querySelector(".play").disabled = true;
      this.shadow.querySelector(".seek").disabled = true;
    }
  }

  async sendRemote(action, value) {
    if (!this.remoteMedia) return;
    const { tabId, frameId, mediaIndex } = this.remoteMedia;
    const result = await this.requestRemote(action, value, this.remoteMedia);
    if (result?.error) {
      this.shadow.querySelector(".source").textContent = result.error;
      return;
    }
    if (action === "play") this.remoteMedia.playing = true;
    if (action === "pause") this.remoteMedia.playing = false;
    if (action === "seek") this.remoteMedia.currentTime = Number(value);
    if (action === "volume") this.remoteMedia.volume = Number(value);
    this.remoteMedia = { ...this.remoteMedia, tabId, frameId, mediaIndex };
    if (action === "play" || action === "pause") {
      this.shadow.querySelector(".play i").textContent = this.remoteMedia.playing ? "pause" : "play_arrow";
      this.shadow.querySelector(".play").setAttribute("aria-label", this.remoteMedia.playing ? "Pause" : "Play");
    }
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
