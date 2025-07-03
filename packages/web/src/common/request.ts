import { call } from "./call";
import { Modal } from "antd";

/**
 * Defines the structure for the options parameter of the request function.
 */
interface RequestOptions extends Omit<RequestInit, 'body'> {
  /**
   * The body of the request. Can be a FormData object or any JSON-serializable object.
   */
  body?: FormData | object;
  /**
   * Whether to hide error messages displayed via Ant Design Modal.
   * @default false
   */
  hideMsg?: boolean;
}

/**
 * Makes an authenticated API request to the backend.
 * It automatically attaches an Authorization header with a bearer token.
 * Handles JSON and FormData request bodies, and provides error handling with Ant Design Modal.
 *
 * @param {string} url - The API endpoint URL (relative to BASE_URL).
 * @param {RequestOptions} [options={}] - Configuration options for the request.
 * @param {string} [BASE_URL=process.env.REACT_APP_REMOTE_URL] - The base URL for the API. Defaults to `process.env.REACT_APP_REMOTE_URL`.
 * @returns {Promise<any>} A promise that resolves with the JSON response data if successful, or rejects with an error.
 * @throws {Error} If the request fails, returns a 401 status, or the API response indicates an error.
 */
export async function request(
  url: string,
  options: RequestOptions = {},
  BASE_URL: string = process.env.REACT_APP_REMOTE_URL || "",
) {
  // Retrieve authentication token.
  const token: string = await call("readFile", { path: ".token" });

  // Set Authorization header.
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  // Handle request body: FormData or JSON.
  let requestOptions: RequestInit;
  if (!(options.body instanceof FormData)) {
    requestOptions = {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options.body),
    };
  } else {
    requestOptions = options as RequestInit;
  }

  return fetch(BASE_URL + url, requestOptions)
    .then((res) => {
      // Handle unauthorized access.
      if (res.status === 401) {
        throw new Error("Unauthorized: Please log in.");
      }
      return res;
    })
    .then((res) => res.json())
    .then((res) => {
      // Handle API-specific success/error response.
      if (!res.success) {
        // Display error message if not hidden.
        if (!options.hideMsg && res.message) {
          Modal.error({
            title: "Error",
            content: res.message,
          });
        }
        throw new Error(res.message || "An unknown API error occurred.");
      }
      return res;
    });
}

