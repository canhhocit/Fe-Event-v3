const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const authHeader = (token && token !== "null" && token !== "undefined") ? `Bearer ${token}` : "";
  
  const getUrl = (p) => {
    return `${BASE}${p}`;
  };

  const res = await fetch(getUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...options.headers,
    },
  });
  
  if (res.status === 401) {
    // Optionally handle logout or token refresh
  }

  return res.json();
}

export const API_BASE = BASE;
