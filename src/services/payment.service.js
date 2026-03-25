import { apiFetch } from "./http";

export const paymentService = {
    async getStripeConfig() {
        return await apiFetch("/api/payments/config");
    },

    async createConnectedAccount(userId) {
        if (!userId) throw new Error("userId is required");
        return await apiFetch("/api/sellers/connect-account", {
            method: "POST",
            body: JSON.stringify({ userId }),
        });
    },

    async createOnboardingLink(userId) {
        if (!userId) throw new Error("userId is required");
        return await apiFetch(`/api/sellers/${encodeURIComponent(userId)}/onboarding-link`, {
            method: "POST",
        });
    },

    async getSellerPaymentProfile(userId) {
        if (!userId) throw new Error("userId is required");
        return await apiFetch(`/api/sellers/${encodeURIComponent(userId)}`);
    },

    async refreshSellerStatus(userId) {
        if (!userId) throw new Error("userId is required");
        return await apiFetch(`/api/sellers/${encodeURIComponent(userId)}/status`);
    },

    async createOrderPaymentIntent(orderId, shopperId) {
        if (!orderId) throw new Error("orderId is required");
        if (!shopperId) throw new Error("shopperId is required");

        return await apiFetch(
            `/api/orders/${encodeURIComponent(orderId)}/payment-intent?shopperId=${encodeURIComponent(shopperId)}`,
            { method: "POST" }
        );
    },
};