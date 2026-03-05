import { BASE_URL } from "./http";

const baseUrl = `${BASE_URL}/notifications-api`;

async function httpJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return null;
}

export const notificationService = {
  async listByUser(userId) {
    return httpJson(`${baseUrl}/notifications?userId=${encodeURIComponent(userId)}`);
  },

  async create(notification) {
    return httpJson(`${baseUrl}/notifications`, {
      method: "POST",
      body: JSON.stringify(notification),
    });
  },

  async ping() {
    return httpJson(`${baseUrl}/ping`);
  },
};