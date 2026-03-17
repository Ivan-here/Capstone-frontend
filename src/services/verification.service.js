import {apiFetch, BASE_URL, getToken} from "./http";

export const verificationService = {
    async submitVerification(formData) {
        const token = getToken();
        const response = await fetch(`${BASE_URL}/api/verification/submit`, {
            method: "POST",
            body: formData,
            // Let the browser set the Content-Type to multipart/form-data automatically
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to submit verification documents.");
        }
        return await response.json();
    },
    // Fetches the specific verification record for the logged-in user
    async getUserVerification(userId) {
        try {
            return await apiFetch(`/api/verification/user/${userId}`);
        } catch (error) {
            console.error("No verification record found for this user", error);
            return null;
        }
    }
};