import { apiFetch } from "./http";

export const orderService = {

    async getOrdersByShopper(shopperId) {
        if (!shopperId) return [];
        try {
            return await apiFetch(`/api/orders?shopperId=${encodeURIComponent(shopperId)}`);
        } catch (error) {
            console.error("Error fetching shopper orders:", error);
            return [];
        }
    },

    async createOrder(payload) {
        return await apiFetch("/api/orders", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async createPaymentIntent(orderId, shopperId) {
        if (!orderId) throw new Error("orderId is required");
        if (!shopperId) throw new Error("shopperId is required");

        return await apiFetch(
            `/api/orders/${encodeURIComponent(orderId)}/payment-intent?shopperId=${encodeURIComponent(shopperId)}`,
            {
                method: "POST",
            }
        );
    },

    async confirmPayment(orderId, shopperId, paymentIntentId) {
        if (!orderId) throw new Error("orderId is required");
        if (!shopperId) throw new Error("shopperId is required");
        if (!paymentIntentId) throw new Error("paymentIntentId is required");

        return await apiFetch(
            `/api/orders/${encodeURIComponent(orderId)}/confirm-payment?shopperId=${encodeURIComponent(shopperId)}`,
            {
                method: "POST",
                body: JSON.stringify({ paymentIntentId }),
            }
        );
    },

    async getPickupCode(orderId, shopperId) {
        if (!orderId) throw new Error("orderId is required");
        if (!shopperId) throw new Error("shopperId is required");

        return await apiFetch(
            `/api/orders/${encodeURIComponent(orderId)}/pickup-code?shopperId=${encodeURIComponent(shopperId)}`
        );
    },

    async cancelOrder(orderId, actorUserId, reason = "") {
        if (!orderId) throw new Error("orderId is required");
        if (!actorUserId) throw new Error("actorUserId is required");

        return await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
            method: "POST",
            body: JSON.stringify({
                actorUserId,
                reason,
            }),
        });
    },

    async getOrderById(orderId) {
        if (!orderId) throw new Error("orderId is required");
        return await apiFetch(`/api/orders/${encodeURIComponent(orderId)}`);
    },

    async getOrdersBySeller(sellerUserId) {
        if (!sellerUserId) return [];
        try {
            return await apiFetch(`/api/orders/seller/${encodeURIComponent(sellerUserId)}`);
        } catch (error) {
            console.error("Error fetching seller orders:", error);
            return [];
        }
    },

    async getOrderHistory(userId) {
        if (!userId) return { bought: [], sold: [] };
        try {
            return await apiFetch(`/api/orders/history?userId=${encodeURIComponent(userId)}`);
        } catch (error) {
            console.error("Error fetching combined order history:", error);

            // Fallback for older backend deployments that do not have /orders/history yet.
            const [bought, sold] = await Promise.all([
                this.getOrdersByShopper(userId),
                this.getOrdersBySeller(userId),
            ]);
            return { bought, sold };
        }
    },

    async markReadyForPickup(orderId, sellerUserId) {
        if (!orderId) throw new Error("orderId is required");
        if (!sellerUserId) throw new Error("sellerUserId is required");

        return await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/ready-for-pickup`, {
            method: "POST",
            body: JSON.stringify({ sellerUserId }),
        });
    },

    async verifyPickupCode(orderId, sellerUserId, code) {
        if (!orderId) throw new Error("orderId is required");
        if (!sellerUserId) throw new Error("sellerUserId is required");
        if (!code) throw new Error("pickup code is required");

        return await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/verify-pickup-code`, {
            method: "POST",
            body: JSON.stringify({
                sellerUserId,
                code,
            }),
        });
    },

    async getReservationsByNgo(ngoId) {
        if (!ngoId) return [];
        try {
            return await apiFetch(`/api/reservations?ngoId=${encodeURIComponent(ngoId)}`);
        } catch (error) {
            console.error("Error fetching NGO reservations:", error);
            return [];
        }
    },
};
