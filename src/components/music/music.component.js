// A compact player for audio loaded into this page
class MusicControl extends Component {
  objectUrl = null;
  remoteMedia = null;
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
      .music-button i { color: ${CONFIG.palette.mauve}; font-size: 16pt; filter: drop-shadow(0 0 7px color-mix(in srgb, ${CONFIG.palette.mauve} 45%, transparent)); }
      .player-dialog { position: fixed; inset: auto 16px 48px auto; width: min(380px, calc(100vw - 32px)); max-width: calc(100vw - 32px); max-height: min(90vh, 660px); margin: 0; padding: 0; overflow: visible; border: 0; background: transparent; color: ${CONFIG.palette.text}; }
      .player-dialog::backdrop { background: transparent; }
      .player { position: relative; isolation: isolate; width: 100%; max-height: min(90vh, 660px); overflow: auto; box-sizing: border-box; padding: 20px; border: 1px solid color-mix(in srgb, ${CONFIG.palette.mauve} 34%, ${CONFIG.palette.surface1}); border-radius: 18px; background: linear-gradient(145deg, color-mix(in srgb, ${CONFIG.palette.mantle} 96%, ${CONFIG.palette.mauve}), ${CONFIG.palette.base} 54%, color-mix(in srgb, ${CONFIG.palette.mantle} 92%, ${CONFIG.palette.blue})); color: ${CONFIG.palette.text}; box-shadow: 0 18px 48px rgb(0 0 0 / 42%), 0 0 32px color-mix(in srgb, ${CONFIG.palette.mauve} 13%, transparent); backdrop-filter: blur(var(--startpage-blur, 0px)); font: 400 13px 'Nunito', 'Roboto', sans-serif; }
      .player::before { content: ''; position: absolute; z-index: -1; width: 190px; height: 190px; top: -105px; right: -70px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, ${CONFIG.palette.mauve} 25%, transparent), transparent 70%); pointer-events: none; }
      .player-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 18px; }
      .eyebrow { display: flex; align-items: center; gap: 7px; color: ${CONFIG.palette.subtext1}; font: 800 10px 'Nunito', sans-serif; letter-spacing: .14em; text-transform: uppercase; }
      .eyebrow::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, ${CONFIG.palette.mauve}, ${CONFIG.palette.blue}); box-shadow: 0 0 10px color-mix(in srgb, ${CONFIG.palette.mauve} 65%, transparent); }
      .close-player { flex: none; width: 30px; height: 30px; display: grid; place-items: center; padding: 0 !important; border: 1px solid ${CONFIG.palette.surface1} !important; border-radius: 10px !important; background: color-mix(in srgb, ${CONFIG.palette.surface0} 70%, transparent) !important; color: ${CONFIG.palette.subtext1} !important; }
      .close-player:hover { color: ${CONFIG.palette.text} !important; border-color: ${CONFIG.palette.mauve} !important; }
      .now-playing { display: grid; grid-template-columns: 76px minmax(0, 1fr); align-items: center; gap: 14px; margin-bottom: 18px; }
      .artwork { position: relative; display: grid; place-items: center; width: 76px; height: 76px; overflow: hidden; border: 1px solid color-mix(in srgb, ${CONFIG.palette.text} 14%, transparent); border-radius: 15px; background: linear-gradient(135deg, ${CONFIG.palette.mauve}, ${CONFIG.palette.blue} 58%, ${CONFIG.palette.teal}); box-shadow: 0 8px 20px color-mix(in srgb, ${CONFIG.palette.mauve} 22%, transparent); }
      .artwork::before, .artwork::after { content: ''; position: absolute; border: 1px solid rgb(255 255 255 / 25%); border-radius: 50%; }
      .artwork::before { width: 54px; height: 54px; }
      .artwork::after { width: 36px; height: 36px; }
      .artwork i { z-index: 1; color: white; font-size: 25px; text-shadow: 0 2px 8px rgb(0 0 0 / 25%); }
      .track-info { min-width: 0; }
      .track { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${CONFIG.palette.text}; font: 900 19px/1.2 'Nunito', sans-serif; letter-spacing: -.035em; margin-bottom: 6px; }
      .source { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${CONFIG.palette.subtext1}; font-size: 12px; font-weight: 700; }
      .controls { display: grid; grid-template-columns: 42px 1fr; align-items: center; gap: 12px; }
      .player button { border: 1px solid ${CONFIG.palette.surface1}; border-radius: 10px; padding: 8px; background: color-mix(in srgb, ${CONFIG.palette.surface0} 82%, transparent); color: ${CONFIG.palette.text}; cursor: pointer; transition: transform .16s ease, border-color .16s ease, background .16s ease; }
      .player button:hover:not(:disabled) { transform: translateY(-1px); border-color: ${CONFIG.palette.mauve}; background: ${CONFIG.palette.surface1}; }
      .player button:disabled { opacity: .42; cursor: not-allowed; }
      .player button.play { width: 42px; height: 42px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 14px; background: linear-gradient(135deg, ${CONFIG.palette.mauve}, ${CONFIG.palette.blue}); color: ${CONFIG.palette.crust}; box-shadow: 0 5px 16px color-mix(in srgb, ${CONFIG.palette.mauve} 30%, transparent); }
      .player button.play i { font-size: 23px; }
      .player input[type="range"] { width: 100%; height: 5px; margin: 0; border-radius: 99px; accent-color: ${CONFIG.palette.mauve}; cursor: pointer; }
      .time { display: flex; justify-content: space-between; color: ${CONFIG.palette.subtext0}; font: 700 10px 'Roboto', sans-serif; font-variant-numeric: tabular-nums; margin: 7px 0 0 54px; }
      .volume, .file-row { display: flex; align-items: center; gap: 10px; margin-top: 17px; }
      .volume { padding-top: 14px; border-top: 1px solid color-mix(in srgb, ${CONFIG.palette.surface1} 75%, transparent); }
      .volume i { color: ${CONFIG.palette.subtext1}; font-size: 18px; }
      .volume input { flex: 1; }
      .file-row { flex-wrap: wrap; margin-top: 15px; }
      .file-row label { display: inline-block; cursor: pointer; }
      .file-row button { padding: 8px 11px; font-size: 11px; font-weight: 800; }
      .file-row button.primary { border: 0; background: linear-gradient(110deg, ${CONFIG.palette.mauve}, ${CONFIG.palette.blue}); color: ${CONFIG.palette.crust}; }
      .file-row input[type="file"] { display: none; }
      .hint { margin: 13px 0 0; color: ${CONFIG.palette.subtext0}; font-size: 10px; line-height: 1.5; }
      audio { display: none; }
      @media (max-width: 420px) { .player { padding: 16px; } .now-playing { grid-template-columns: 64px minmax(0, 1fr); gap: 11px; } .artwork { width: 64px; height: 64px; } .track { font-size: 17px; } }
    `;
  }

  template() {
    return `<button class="music-button" type="button" aria-expanded="false" title="Open this page's music player"><i class="material-icons">music_note</i><span>Music</span></button>
      <dialog class="player-dialog" aria-label="Music player">
       <section class="player">
        <div class="player-heading"><span class="eyebrow">now playing</span><button class="close-player" type="button" aria-label="Close music player"><i class="material-icons">close</i></button></div>
        <div class="now-playing">
          <div class="artwork" aria-hidden="true"><i class="material-icons">music_note</i></div>
          <div class="track-info"><div class="track">Looking for music in other tabs…</div><div class="source">Media control extension not connected</div></div>
        </div>
        <audio preload="metadata"></audio>
        <div class="controls"><button class="play" type="button" aria-label="Play" disabled><i class="material-icons">play_arrow</i></button><input class="seek" type="range" min="0" max="1000" value="0" aria-label="Track position" disabled></div>
        <div class="time"><span class="elapsed">0:00</span><span class="duration">0:00</span></div>
        <div class="volume"><i class="material-icons">volume_down</i><input class="volume-range" type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Volume"></div>
        <div class="file-row"><label><button class="primary" type="button">Choose audio</button><input class="file" type="file" accept="audio/*"></label><button class="clear" type="button" disabled>Clear audio</button></div>
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
