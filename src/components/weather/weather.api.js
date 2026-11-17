/**
 * WeatherForecastClient fetches and parses weather data for a given location
 * from the OpenWeatherMap API
 */
class WeatherForecastClient {
  /**
   * Create a new WeatherForecastClient instance
   * @param {string} location - The location to fetch weather data for
   * @param {string} appId - OpenWeatherMap API key (optional)
   */
  constructor(location, appId) {
    this.appId = appId;
    this.location = location;
  }

  /**
   * Fetch current weather for the browser's location when available,
   * otherwise use the configured fallback city.
   * @returns {Promise<{temperature: number, condition: string, location: string} | null>}
   */
  async getWeather() {
    if (!this.appId) return null;

    try {
      const coordinates = await this.getCurrentPosition();
      const params = new URLSearchParams({ units: "metric", appid: this.appId });

      if (coordinates) {
        params.set("lat", coordinates.latitude);
        params.set("lon", coordinates.longitude);
      } else {
        params.set("q", this.location);
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?${params}`,
      );
      if (!response.ok) throw new Error(`Weather API returned ${response.status}`);

      const data = await response.json();
      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main.toLowerCase(),
        location: data.name || this.location,
      };
    } catch (err) {
      console.warn("Weather API returned an error:", err);
      return null;
    }
  }

  /**
   * Resolve the current browser position, or return null when unavailable
   * or permission is denied.
   * @returns {Promise<GeolocationCoordinates | null>}
   */
  getCurrentPosition() {
    if (!navigator.geolocation) return Promise.resolve(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve(coords),
        () => resolve(null),
        { enableHighAccuracy: false, maximumAge: 15 * 60 * 1000, timeout: 8000 },
      );
    });
  }
}
