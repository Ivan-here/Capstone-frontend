import { apiFetch } from "./http";

function withOptionalRead(path, read) {
    if (read == null) return path;
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}read=${read}`;
}

export const adminService = {
    // Dashboard
    getDashboardStats() {
        return apiFetch("/admin/dashboard/stats");
    },

    // Users
    getAllUsers() {
        return apiFetch("/admin/users");
    },

    getUserById(id) {
        return apiFetch(`/admin/users/${id}`);
    },

    searchUsers(query) {
        return apiFetch(`/admin/users/search?query=${encodeURIComponent(query)}`);
    },

    getUsersByStatus(status) {
        return apiFetch(`/admin/users/status/${encodeURIComponent(status)}`);
    },

    getUsersByRole(role) {
        return apiFetch(`/admin/users/role/${encodeURIComponent(role)}`);
    },

    updateUserStatus(id, status) {
        return apiFetch(`/admin/users/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
    },

    addUserRole(id, role) {
        return apiFetch(`/admin/users/${id}/roles`, {
            method: "POST",
            body: JSON.stringify({ role }),
        });
    },

    removeUserRole(id, role) {
        return apiFetch(`/admin/users/${id}/roles`, {
            method: "DELETE",
            body: JSON.stringify({ role }),
        });
    },

    updateUserDetails(id, payload) {
        return apiFetch(`/admin/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    deleteUser(id) {
        return apiFetch(`/admin/users/${id}`, {
            method: "DELETE",
        });
    },

    // Profiles
    getProfileByUserId(userId) {
        return apiFetch(`/admin/profiles/${userId}`);
    },

    getPersonalProfile(userId) {
        return apiFetch(`/admin/profiles/${userId}/personal`);
    },

    getBusinessProfile(userId) {
        return apiFetch(`/admin/profiles/${userId}/business`);
    },

    getAllPersonalProfiles() {
        return apiFetch("/admin/profiles/personal");
    },

    getAllBusinessProfiles() {
        return apiFetch("/admin/profiles/business");
    },

    getBusinessProfilesByType(type) {
        return apiFetch(`/admin/profiles/business/type/${encodeURIComponent(type)}`);
    },

    getBusinessProfilesByVerified(verified) {
        return apiFetch(`/admin/profiles/business/verified/${verified}`);
    },

    setBusinessVerified(userId, verified) {
        return apiFetch(`/admin/profiles/${userId}/business/verified?verified=${verified}`, {
            method: "PATCH",
        });
    },

    verifyUser(userId) {
        return apiFetch(`/admin/profiles/${userId}/verify`, {
            method: "POST",
        });
    },

    deletePersonalProfile(userId) {
        return apiFetch(`/admin/profiles/${userId}/personal`, {
            method: "DELETE",
        });
    },

    deleteBusinessProfile(userId) {
        return apiFetch(`/admin/profiles/${userId}/business`, {
            method: "DELETE",
        });
    },

    // Verifications
    getVerificationQueue() {
        return apiFetch("/admin/verifications/queue");
    },

    getAllVerifications() {
        return apiFetch("/admin/verifications");
    },

    getVerificationById(id) {
        return apiFetch(`/admin/verifications/${id}`);
    },

    getVerificationsByStatus(status) {
        return apiFetch(`/admin/verifications/status/${encodeURIComponent(status)}`);
    },

    getVerificationsByUser(userId) {
        return apiFetch(`/admin/verifications/user/${userId}`);
    },

    reviewVerification(id, payload) {
        return apiFetch(`/admin/verifications/${id}/review`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    deleteVerification(id) {
        return apiFetch(`/admin/verifications/${id}`, {
            method: "DELETE",
        });
    },

    // Listings
    getAllListings() {
        return apiFetch("/admin/listings");
    },

    getListingById(id) {
        return apiFetch(`/admin/listings/${id}`);
    },

    closeListing(id) {
        return apiFetch(`/admin/listings/${id}/close`, {
            method: "PATCH",
        });
    },

    deleteListing(id) {
        return apiFetch(`/admin/listings/${id}`, {
            method: "DELETE",
        });
    },

    // Orders
    getAllOrders() {
        return apiFetch("/admin/orders");
    },

    getOrderById(id) {
        return apiFetch(`/admin/orders/${id}`);
    },

    getOrdersByShopper(shopperId) {
        return apiFetch(`/admin/orders/shopper/${shopperId}`);
    },

    getOrdersBySeller(sellerUserId) {
        return apiFetch(`/admin/orders/seller/${sellerUserId}`);
    },

    disputeOrder(id, payload) {
        return apiFetch(`/admin/orders/${id}/dispute`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    deleteOrder(id) {
        return apiFetch(`/admin/orders/${id}`, {
            method: "DELETE",
        });
    },

    // Reservations
    getAllReservations() {
        return apiFetch("/admin/reservations");
    },

    getReservationById(id) {
        return apiFetch(`/admin/reservations/${id}`);
    },

    getReservationsByNgo(ngoId) {
        return apiFetch(`/admin/reservations/ngo/${ngoId}`);
    },

    updateReservationStatus(id, status) {
        return apiFetch(`/admin/reservations/${id}/status?status=${encodeURIComponent(status)}`, {
            method: "PATCH",
        });
    },

    deleteReservation(id) {
        return apiFetch(`/admin/reservations/${id}`, {
            method: "DELETE",
        });
    },

    // Notifications
    createNotification(payload) {
        return apiFetch("/admin/notifications", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    getNotificationsByUser(userId, read = null) {
        return apiFetch(withOptionalRead(`/admin/notifications/user/${userId}`, read));
    },

    getMyNotifications(read = null) {
        return apiFetch(withOptionalRead("/admin/notifications/me", read));
    },

    getNotificationById(id) {
        return apiFetch(`/admin/notifications/${id}`);
    },

    markNotificationRead(id, read) {
        return apiFetch(`/admin/notifications/${id}/read?read=${read}`, {
            method: "PATCH",
        });
    },

    deleteNotification(id) {
        return apiFetch(`/admin/notifications/${id}`, {
            method: "DELETE",
        });
    },

    // Management
    createAdminNote(payload) {
        return apiFetch("/admin/management/notes", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    getAdminNotes(targetType, targetId) {
        return apiFetch(`/admin/management/notes/${targetType}/${targetId}`);
    },

    createModerationAction(payload) {
        return apiFetch("/admin/management/moderation-actions", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    getModerationActions(targetType, targetId) {
        return apiFetch(`/admin/management/moderation-actions/${targetType}/${targetId}`);
    },

    getActionLogs(targetType, targetId) {
        return apiFetch(`/admin/management/action-logs/${targetType}/${targetId}`);
    },

    getAuditLogs(entityType, entityId) {
        return apiFetch(`/admin/management/audit-logs/${entityType}/${entityId}`);
    },
};
