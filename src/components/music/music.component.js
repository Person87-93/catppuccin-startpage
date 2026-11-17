// A compact player for audio loaded into this page
class MusicControl extends Component {
  objectUrl = null;

  imports() {
    return [this.getResource("icons", "material"), this.getResource("fonts", "roboto")];
  }

  style() {
    return `
      .music-button { height: 100%; display: flex; align-items: center; gap: 5px; padding: 0; border: 0; background: transparent; color: ${CONFIG.palette.text}; font: 300 9pt 'Roboto', sans-serif; cursor: pointer; white-space: nowrap; }
      .music-button i { color: ${CONFIG.palette.mauve}; font-size: 14pt; }
      .player { position: fixed; z-index: 40; right: 16px; bottom: 48px; width: min(340px, calc(100vw - 32px)); padding: 16px; border: 1px solid ${CONFIG.palette.surface1}; border-radius: var(--startpage-radius, 10px); background: color-mix(in srgb, ${CONFIG.palette.mantle} var(--startpage-opacity, 100%), transparent); color: ${CONFIG.palette.text}; box-shadow: 0 12px 32px rgb(0 0 0 / 35%); backdrop-filter: blur(var(--startpage-blur, 0px)); font: 400 13px 'Roboto', sans-serif; }
      .player[hidden] { display: none; }
      .track { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; margin-bottom: 12px; }
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
      <section class="player" hidden aria-label="Music player">
        <div class="track">Choose an audio file to play</div>
        <audio preload="metadata"></audio>
        <div class="controls"><button class="play" type="button" aria-label="Play" disabled><i class="material-icons">play_arrow</i></button><input class="seek" type="range" min="0" max="1000" value="0" aria-label="Track position" disabled></div>
        <div class="time"><span class="elapsed">0:00</span><span class="duration">0:00</span></div>
        <div class="volume"><i class="material-icons">volume_down</i><input class="volume-range" type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Volume"></div>
        <div class="file-row"><label><button type="button">Choose audio</button><input class="file" type="file" accept="audio/*"></label><button class="clear" type="button" disabled>Clear</button></div>
        <p class="hint">This player controls audio opened here. Browsers don’t let a new tab control music in other tabs.</p>
      </section>`;
  }

  connectedCallback() {
    this.render().then(() => this.bindPlayer());
  }

  bindPlayer() {
    const query = (selector) => this.shadow.querySelector(selector);
    const audio = query("audio");
    const panel = query(".player");
    const toggle = query(".music-button");
    const play = query(".play");
    const seek = query(".seek");
    const file = query(".file");

    toggle.onclick = () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
    };
    file.onchange = () => {
      const selected = file.files?.[0];
      if (!selected) return;
      this.releaseAudioUrl();
      this.objectUrl = URL.createObjectURL(selected);
      audio.src = this.objectUrl;
      query(".track").textContent = selected.name;
      play.disabled = false;
      seek.disabled = false;
      query(".clear").disabled = false;
      audio.play().catch(() => {});
    };
    play.onclick = () => audio.paused ? audio.play() : audio.pause();
    audio.onplay = () => { query(".play i").textContent = "pause"; play.setAttribute("aria-label", "Pause"); };
    audio.onpause = () => { query(".play i").textContent = "play_arrow"; play.setAttribute("aria-label", "Play"); };
    audio.ontimeupdate = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) seek.value = String(Math.round(audio.currentTime / audio.duration * 1000));
      query(".elapsed").textContent = this.formatTime(audio.currentTime);
    };
    audio.onloadedmetadata = () => { query(".duration").textContent = this.formatTime(audio.duration); };
    seek.oninput = () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 1000 * audio.duration; };
    query(".volume-range").oninput = (event) => { audio.volume = Number(event.target.value); };
    query(".clear").onclick = () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      this.releaseAudioUrl();
      file.value = "";
      query(".track").textContent = "Choose an audio file to play";
      query(".duration").textContent = "0:00";
      query(".elapsed").textContent = "0:00";
      seek.value = "0";
      play.disabled = true;
      seek.disabled = true;
      query(".clear").disabled = true;
    };
    window.addEventListener("beforeunload", () => this.releaseAudioUrl(), { once: true });
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
