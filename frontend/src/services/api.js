const BASE_URL = import.meta.env.VITE_API_URL || "";
const isDev = import.meta.env.DEV;

/**
 * Generic fetch wrapper for API calls
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // 1. Get the token from storage
  const token = localStorage.getItem("token");

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // 2. Automatically attach Authorization header if token exists
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  if (isDev) {
    console.log(`[API Request] ${options.method || "GET"} ${url}`, {
      headers: config.headers,
      body: options.body ? JSON.parse(options.body) : null,
    });
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    throw new Error(`Verkkovirhe: ${error.message}`);
  }

  // 3. Handle 401 Unauthorized (Token expired or invalid)
  if (response.status === 401) {
    localStorage.removeItem("token");
    // Optional: redirect to login if not already there
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Istunto vanhentunut. Kirjaudu sisään uudelleen.");
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type");
  let data;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) throw new Error(`Palvelinvirhe (${response.status})`);
    return text;
  }

  if (!response.ok) {
    const errorMessage =
      data?.message || data?.error || `Virhe: ${response.status}`;
    throw new Error(errorMessage);
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
