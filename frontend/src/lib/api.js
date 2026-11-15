const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (configuredApiUrl || "/api").replace(/\/+$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
}

export function authHeaders(token = localStorage.getItem("token")) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
