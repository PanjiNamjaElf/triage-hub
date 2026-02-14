/**
 * API client for communicating with the backend.
 *
 * @author Panji Setya Nur Prawira
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * Fetch wrapper with error handling.
 *
 * @param {string} path - API path relative to base URL.
 * @param {RequestInit} options - Fetch options.
 * @returns {Promise<object>} Parsed JSON response.
 * @throws {Error} When the request fails or returns non-OK status.
 */
async function request(path, options = {}) {
  const url = `${API_URL}${path}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data.error || data.details?.[0]?.message || "Request failed.";
    const error = new Error(message);
    error.status = res.status;
    error.details = data.details;
    throw error;
  }

  return data;
}

export async function getTickets(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/tickets${query ? `?${query}` : ""}`);
}

export async function getTicket(id) {
  return request(`/tickets/${id}`);
}

export async function createTicket(body) {
  return request("/tickets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function resolveTicket(id, resolvedReply) {
  return request(`/tickets/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ resolvedReply }),
  });
}

export async function retryTriage(id) {
  return request(`/tickets/${id}/retry`, { method: "POST" });
}

export async function getStats() {
  return request("/tickets/stats");
}
