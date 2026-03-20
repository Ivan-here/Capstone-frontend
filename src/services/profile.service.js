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
    getProfileById: async (userId) => {
        const response = await fetch(`http://localhost:9000/profiles/${userId}`);
        if (!response.ok) throw new Error('Could not find seller profile');
        return await response.json();
    }
};
