// User configuration for the startpage - update the palette, location, and your preferred tabs, categories, and links

// Available themes: latte, frappe, mocha, macchiato
const preferredLightTheme = latte;
const preferredDarkTheme = mocha;

let palette = initThemeSystem(preferredLightTheme, preferredDarkTheme);

const default_configuration = {
  overrideStorage: true,
  temperature: {
    location: "London",
    scale: "C",
    // Optional OpenWeatherMap API key, get a free one at https://openweathermap.org/api
    // Leave empty to keep the placeholder and skip the network request
    appId: "",
  },
  clock: {
    format: "k:i p",
    icon_color: palette.maroon,
  },
  additionalClocks: [
    {
      label: "UA",
      timezone: "Europe/Kyiv",
      format: "h:i",
      icon_color: palette.peach,
    },
  ],
  search: {
    engines: {
      p: ["https://www.perplexity.ai/search/?q=", "PerplexityAI"],
      d: ["https://duckduckgo.com/?q=", "DuckDuckGo"],
      g: ["https://google.com/search?q=", "Google"],
    },
    default: "g",
  },
  keybindings: {
    "s": "search-bar",
  },
  disabled: [],
  localIcons: true,
  localFonts: true,
  fastlink: "https://www.perplexity.ai",
  openLastVisitedTab: true,
  tabs: [
    {
      name: "everyday",
      background_url: "src/img/banners/banner_14.gif",
      categories: [
        { name: "social", links: [
          { name: "TikTok", url: "https://www.tiktok.com", icon: "brand-tiktok", icon_color: palette.green },
          { name: "Discord", url: "https://discord.com/app", icon: "brand-discord", icon_color: palette.blue },
          { name: "Instagram", url: "https://www.instagram.com", icon: "brand-instagram", icon_color: palette.mauve },
        ] },
        { name: "general workspace", links: [
          { name: "Gmail", url: "https://mail.google.com", icon: "brand-gmail", icon_color: palette.red },
          { name: "Google Calendar", url: "https://calendar.google.com", icon: "calendar-event", icon_color: palette.blue },
          { name: "Sheets", url: "https://docs.google.com/spreadsheets", icon: "table", icon_color: palette.green },
          { name: "Drive", url: "https://drive.google.com/drive/home", icon: "brand-google-drive", icon_color: palette.yellow },
          { name: "ChatGPT", url: "https://chatgpt.com", icon: "brand-openai", icon_color: palette.teal },
        ] },
        { name: "music", links: [
          { name: "Apple Music", url: "https://music.apple.com", icon: "brand-apple", icon_color: palette.red },
          { name: "Spotify", url: "https://open.spotify.com", icon: "brand-spotify", icon_color: palette.green },
        ] },
      ],
    },
    {
      name: "entertainment",
      background_url: "src/img/banners/banner_07.gif",
      categories: [
        { name: "gaming", links: [
          { name: "Xbox Cloud Gaming", url: "https://www.xbox.com/en-us/play", icon: "brand-xbox", icon_color: palette.green },
          { name: "Steam Store", url: "https://store.steampowered.com", icon: "brand-steam", icon_color: palette.blue },
          { name: "Epic Games Store", url: "https://store.epicgames.com", icon: "brand-fortnite", icon_color: palette.mauve },
          { name: "Poki", url: "https://poki.com", icon: "device-gamepad", icon_color: palette.yellow },
        ] },
        { name: "streaming", links: [
          { name: "Tubi", url: "https://tubitv.com", icon: "device-tv", icon_color: palette.yellow },
          { name: "YouTube", url: "https://www.youtube.com", icon: "brand-youtube", icon_color: palette.red },
          { name: "Pluto TV", url: "https://pluto.tv", icon: "device-tv", icon_color: palette.blue },
        ] },
        { name: "school", links: [
          { name: "Clever", url: "https://clever.com/in/", icon: "school", icon_color: palette.blue },
          { name: "Schoology", url: "https://app.schoology.com", icon: "chalkboard", icon_color: palette.green },
          { name: "PowerSchool", url: "https://www.powerschool.com", icon: "building-community", icon_color: palette.red },
          { name: "Desmos", url: "https://www.desmos.com/calculator", icon: "chart-line", icon_color: palette.orange },
          { name: "Khan Academy", url: "https://www.khanacademy.org", icon: "book-2", icon_color: palette.teal },
        ] },
      ],
    },
    {
      name: "technical",
      background_url: "src/img/banners/banner_15.gif",
      categories: [
        { name: "development", links: [
          { name: "GitHub", url: "https://github.com", icon: "brand-github", icon_color: palette.green },
          { name: "Stack Overflow", url: "https://stackoverflow.com", icon: "brand-stackoverflow", icon_color: palette.orange },
          { name: "MDN", url: "https://developer.mozilla.org", icon: "book-2", icon_color: palette.blue },
          { name: "Microsoft Learn", url: "https://learn.microsoft.com", icon: "brand-windows", icon_color: palette.teal },
          { name: "VS Code", url: "https://code.visualstudio.com", icon: "brand-vscode", icon_color: palette.blue },
        ] },
        { name: "robotics & engineering", links: [
          { name: "VEX Robotics", url: "https://www.vexrobotics.com", icon: "robot", icon_color: palette.red },
          { name: "VEX Forum", url: "https://www.vexforum.com", icon: "messages", icon_color: palette.blue },
          { name: "VEXcode", url: "https://code.vex.com", icon: "code", icon_color: palette.green },
          { name: "RobotEvents", url: "https://www.robotevents.com", icon: "calendar-event", icon_color: palette.orange },
          { name: "REC Foundation", url: "https://recf.org", icon: "building-store", icon_color: palette.mauve },
        ] },
        { name: "cybersecurity & learning", links: [
          { name: "TryHackMe", url: "https://tryhackme.com", icon: "shield-lock", icon_color: palette.red },
          { name: "picoCTF", url: "https://picoctf.org", icon: "flag-code", icon_color: palette.green },
          { name: "Cisco Skills for All", url: "https://skillsforall.com", icon: "network", icon_color: palette.blue },
          { name: "OverTheWire", url: "https://overthewire.org/wargames", icon: "terminal-2", icon_color: palette.mauve },
          { name: "Wireshark", url: "https://www.wireshark.org", icon: "wifi", icon_color: palette.teal },
        ] },
      ],
    },
  ],
};

const CONFIG = new Config(default_configuration, palette);

const root = document.querySelector(":root");
root.style.setProperty("--bg", palette.mantle);
root.style.setProperty("--accent", palette.blue);
