// Shows whether this browser currently has network connectivity
class OnlineStatus extends Component {
  imports() {
    return [this.getResource("icons", "material"), this.getResource("fonts", "roboto")];
  }

  style() {
    return `
      .online { display: flex; align-items: center; gap: 5px; height: 100%; color: ${CONFIG.palette.text}; font: 300 9pt 'Roboto', sans-serif; white-space: nowrap; }
      .online-icon { color: ${CONFIG.palette.green}; font-size: 14pt; }
      .offline .online-icon { color: ${CONFIG.palette.red}; }
    `;
  }

  template() {
    return `<span class="online"><i class="material-icons online-icon">wifi</i><span class="online-label">Online</span></span>`;
  }

  connectedCallback() {
    this.render().then(() => {
      this.updateStatus();
      window.addEventListener("online", () => this.updateStatus());
      window.addEventListener("offline", () => this.updateStatus());
    });
  }

  updateStatus() {
    const root = this.shadow.querySelector(".online");
    if (!root) return;
    const connected = navigator.onLine;
    root.classList.toggle("offline", !connected);
    root.querySelector(".online-label").textContent = connected ? "Online" : "Offline";
    root.querySelector(".online-icon").textContent = connected ? "wifi" : "wifi_off";
    root.title = connected ? "Browser reports a network connection" : "Browser reports no network connection";
  }
}
