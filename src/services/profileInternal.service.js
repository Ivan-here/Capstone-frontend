import { apiFetch } from "./http";

export const profileInternalService = {
    verifyUser(userId) {
        return apiFetch(`/internal/profiles/${userId}/verify`, { method: "POST" });
    },
};