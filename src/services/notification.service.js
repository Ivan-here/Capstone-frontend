import { apiFetch } from "./http";

function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export const notificationService = {
  listByUser(userId, filters = {}) {
    return apiFetch(`/notifications${buildQuery({ userId, ...filters })}`);
  },

  getUnreadCount(userId) {
    return apiFetch(`/notifications/unread-count${buildQuery({ userId })}`);
  },

  create(notification) {
    return apiFetch(`/notifications`, {
      method: "POST",
      body: JSON.stringify(notification),
    });
  },

  markRead(notificationId, read = true) {
    return apiFetch(`/notifications/${notificationId}/read${buildQuery({ read })}`, {
      method: "PATCH",
    });
  },

  markAllRead(userId) {
    return apiFetch(`/notifications/user/${encodeURIComponent(userId)}/read-all`, {
      method: "PATCH",
    });
  },

  delete(notificationId) {
    return apiFetch(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  },
};
