const BASE_URL = import.meta.env.VITE_API_URL || "";
const isDev = import.meta.env.DEV;

/**
 * Generic fetch wrapper for API calls
 * Handles JSON parsing and error management with improved debugging
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  if (isDev) {
    console.log(`[API Request] ${options.method || "GET"} ${url}`, {
      headers: options.headers,
      body: options.body ? JSON.parse(options.body) : null,
    });
  }

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    if (isDev) console.error(`[API Network Error] ${url}`, error);
    throw new Error(`Verkkovirhe: ${error.message}`);
  }

  if (isDev) {
    console.log(`[API Response Status] ${response.status} ${url}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  let data;

  // Check if response is actually JSON before parsing
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (error) {
      if (isDev) {
        console.error(`[API JSON Parse Error] ${url}`, error);
      }
      throw new Error("Palvelimen vastaus ei ollut kelvollista JSON-muotoa.");
    }
  } else {
    // Non-JSON response (could be an HTML error page from proxy/server)
    const text = await response.text();
    if (isDev) {
      console.warn(`[API Non-JSON Response] ${url}`, {
        status: response.status,
        preview: text.substring(0, 500),
      });
    }

    if (!response.ok) {
      throw new Error(
        `Palvelinvirhe (${response.status}): Palvelin palautti muuta kuin JSON-dataa.`,
      );
    }
    return text;
  }

  // Handle error responses that ARE JSON
  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.error ||
      data?.details ||
      `Pyyntö epäonnistui koodilla ${response.status}`;

    if (isDev) {
      console.error(`[API Error Data] ${url}`, data);
    }

    throw new Error(errorMessage);
  }

  if (isDev) {
    console.log(`[API Success Data] ${url}`, data);
  }

  return data;
}

const api = {
  get: (url, options) => request(url, { ...options, method: "GET" }),
  post: (url, body, options) =>
    request(url, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (url, body, options) =>
    request(url, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: (url, body, options) =>
    request(url, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: (url, options) => request(url, { ...options, method: "DELETE" }),
};

export default api;
