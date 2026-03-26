import { apiFetch } from "./http";

export const profileService = {
    getMe() {
        return apiFetch("/profiles/me");
    },

    upsertPersonal(request) {
        return apiFetch("/profiles/me/personal", {
            method: "PUT",
            body: JSON.stringify(request),
        });
    },

    upsertBusiness(request) {
        return apiFetch("/profiles/me/business", {
            method: "PUT",
            body: JSON.stringify(request),
        });
    },

    deleteBusiness() {
        return apiFetch("/profiles/me/business", { method: "DELETE" });
    },

    getProfileById(userId) {
        return apiFetch(`/profiles/${encodeURIComponent(userId)}`);
    },

    followUser(targetUserId) {
        return apiFetch(`/profiles/${encodeURIComponent(targetUserId)}/follow`, {
            method: "POST",
        });
    },

    unfollowUser(targetUserId) {
        return apiFetch(`/profiles/${encodeURIComponent(targetUserId)}/follow`, {
            method: "DELETE",
        });
    },
};
