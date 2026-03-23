import { apiFetch, BASE_URL, getToken } from "./http";

export const verificationService = {

    // -----------------------------
    // USER METHODS
    // -----------------------------

    async submitVerification(formData) {
        const token = getToken();

        const response = await fetch(`${BASE_URL}/api/verification/submit`, {
            method: "POST",
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to submit verification documents.");
        }

        return await response.json();
    },

    // Same as submit but semantically clearer for UI
    async resubmitVerification(formData) {
        return this.submitVerification(formData);
    },

    async getUserVerification(userId) {
        try {
            return await apiFetch(`/api/verification/user/${userId}`);
        } catch (error) {
            console.warn("No verification record found for this user");
            return null;
        }
    },

    async getVerificationQueue() {
        return await apiFetch(`/api/verification/admin/queue`);
    },

    async reviewVerification(id, status, adminNotes = "") {
        return await apiFetch(`/api/verification/admin/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
                status,
                adminNotes
            })
        });
    },

    async getAllVerifications() {
        return await apiFetch(`/api/verification/admin`);
    },

    async getVerificationById(id) {
        return await apiFetch(`/api/verification/admin/${id}`);
    },

    async deleteVerification(id) {
        return await apiFetch(`/api/verification/admin/${id}`, {
            method: "DELETE"
        });
    },

    isPending(verification) {
        return verification?.status === "PENDING";
    },

    isApproved(verification) {
        return verification?.status === "APPROVED";
    },

    isRejected(verification) {
        return verification?.status === "REJECTED";
    }
};