class Actions {
  /**
   * Activate a registered component by its name
   * @param {string} componentName
   * @returns {*}
   */
  static activate(componentName) {
    const component = RenderedComponents[componentName];
    if (component) return component.activate();

    const quickLinks = {
      "open-gmail": "https://mail.google.com/",
      "open-apple-music": "https://music.apple.com/",
      "open-youtube": "https://www.youtube.com/",
    };

    if (quickLinks[componentName]) {
      return window.open(quickLinks[componentName], "_blank", "noopener,noreferrer");
    }

    return RenderedComponents["shortcut-tools"]?.open(componentName);
  }
}
