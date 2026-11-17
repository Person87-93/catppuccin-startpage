// Shows battery charge and charging state where the browser exposes it
class BatteryStatus extends Component {
  imports() {
    return [this.getResource("icons", "material"), this.getResource("fonts", "roboto")];
  }

  style() {
    return `
      .battery { display: flex; align-items: center; gap: 5px; height: 100%; color: ${CONFIG.palette.text}; font: 300 9pt 'Roboto', sans-serif; white-space: nowrap; }
      .battery-icon { color: ${CONFIG.palette.green}; font-size: 14pt; }
      .unavailable { color: ${CONFIG.palette.subtext0}; }
    `;
  }

  template() {
    return `<span class="battery" title="Battery status (when supported by this browser)"><i class="material-icons battery-icon">battery_unknown</i><span class="battery-label">Battery —</span></span>`;
  }

  connectedCallback() {
    this.render().then(() => this.loadBattery());
  }

  async loadBattery() {
    const label = this.shadow.querySelector(".battery-label");
    const icon = this.shadow.querySelector(".battery-icon");
    if (!navigator.getBattery) {
      label.textContent = "Battery unavailable";
      label.classList.add("unavailable");
      return;
    }
    try {
      this.battery = await navigator.getBattery();
      const update = () => {
        const percentage = Math.round(this.battery.level * 100);
        label.textContent = `${percentage}%${this.battery.charging ? " charging" : ""}`;
        icon.textContent = this.battery.charging ? "battery_charging_full" : percentage > 80 ? "battery_full" : percentage > 35 ? "battery_5_bar" : "battery_2_bar";
        icon.style.color = percentage <= 20 && !this.battery.charging ? CONFIG.palette.red : CONFIG.palette.green;
      };
      ["levelchange", "chargingchange"].forEach((eventName) => this.battery.addEventListener(eventName, update));
      update();
    } catch {
      label.textContent = "Battery unavailable";
      label.classList.add("unavailable");
    }
  }
}
