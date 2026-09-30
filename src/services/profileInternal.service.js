import { apiFetch } from "./http";

export const profileInternalService = {
    verifyUser(userId) {
        return apiFetch(`/admin/profiles/${encodeURIComponent(userId)}/verify`, { method: "POST" });
    },
};