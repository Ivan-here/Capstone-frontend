import { apiFetch, BASE_URL, getToken } from "./http";

export const settingsService = {
    getOverview() {
        return apiFetch("/profiles/me/settings");
    },

    getBusinessVerification() {
        return apiFetch("/profiles/me/settings/verification");
    },

    async resubmitVerification({ type, document }) {
        const token = getToken();
        const formData = new FormData();
        formData.append("document", document);
        if (type) formData.append("type", type);

        const response = await fetch(`${BASE_URL}/profiles/me/settings/verification/resubmit`, {
            method: "POST",
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const contentType = response.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const data = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

        if (!response.ok) {
            const message = data?.message || data?.error || data || "Failed to resubmit verification document.";
            throw new Error(message);
        }

        return data;
    },

    deletePersonalProfile() {
        return apiFetch("/profiles/me/settings/profile", { method: "DELETE" });
    },

    deleteBusinessProfile() {
        return apiFetch("/profiles/me/settings/business-profile", { method: "DELETE" });
    },

    deleteAccount() {
        return apiFetch("/profiles/me/settings/account", { method: "DELETE" });
    },
};
