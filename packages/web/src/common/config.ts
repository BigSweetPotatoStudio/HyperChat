/**
 * Defines the structure for the application's configuration.
 */
interface AppConfig {
  /**
   * The root path of the application.
   * @type {string}
   */
  approot: string;
  /**
   * The port for the AI service.
   * @type {string}
   */
  aiServicePort: string;
  /**
   * The WebSocket port for real-time comments (danmu).
   * @type {string}
   */
  danmuWSport: string;
  /**
   * The version of the application.
   * @type {string}
   */
  version: string;
}

/**
 * Holds the global configuration for the application.
 */
export const config: AppConfig = {
  approot: "",
  aiServicePort: "",
  danmuWSport: "",
  version: "",
};