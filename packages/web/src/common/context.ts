import { createContext, Dispatch, SetStateAction } from "react";
import { InitedClient } from "./mcp";

/**
 * Defines the shape of the user data stored in UserContext.
 */
interface UserData {
  // TODO: Define the properties of the user object, e.g., name, email, etc.
  [key: string]: any; 
}

/**
 * Context for providing user-related data throughout the application.
 * It is recommended to define a proper interface for the user object.
 */
export const UserContext = createContext<UserData | null>(null);

/**
 * Defines the shape of the data provided by HeaderContext.
 */
export interface HeaderContextType {
  /**
   * A numeric state value used globally, e.g., for triggering updates.
   */
  globalState: number;
  /**
   * A function to set the application's language.
   * @param lang The language code (e.g., "en", "zh").
   */
  setLang: (lang: string) => void;
  /**
   * A function to update the global state.
   * @param num The new numeric value for the global state.
   */
  updateGlobalState: (num: number) => void;
}

/**
 * Context for providing header-related states and actions, such as
 * MCP clients, global state, and language settings.
 */
export const HeaderContext = createContext<HeaderContextType | null>(null);

/**
 * Defines the shape of the data provided by GlobalContext.
 */
interface GlobalContextType {
  // TODO: Define the properties of the global context as needed.
  [key: string]: any;
}

/**
 * A general-purpose context for sharing global state across the application.
 * It is recommended to define a more specific interface for its value.
 */
export const GlobalContext = createContext<GlobalContextType>({});