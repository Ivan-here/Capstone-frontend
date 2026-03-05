import { apiFetch, BASE_URL, getToken } from "./http";

export const listingService = {
    async getAllListings() {
        try { return await apiFetch("/api/listings"); }
        catch (error) { throw error; }
    },

    async getListingById(id) {
        try { return await apiFetch(`/api/listings/${id}`); }
        catch (error) { throw error; }
    },

    async createFarmListing(formData) {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/api/listings/farm`, {
                method: "POST",
                body: formData,
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });

            // THE FIX: Intercept the 413 Too Large error
            if (response.status === 413) {
                throw new Error("One or more images are too large. Please keep files under 10MB.");
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to create farm listing");
            }
            return await response.json();
        } catch (error) { throw error; }
    },

    async createSurplusListing(formData) {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/api/listings/surplus`, {
                method: "POST",
                body: formData,
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });

            // THE FIX: Intercept the 413 Too Large error
            if (response.status === 413) {
                throw new Error("One or more images are too large. Please keep files under 10MB.");
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to create surplus listing");
            }
            return await response.json();
        } catch (error) { throw error; }
    },

    async closeListing(id) {
        try { return await apiFetch(`/api/listings/${id}/close`, { method: "PATCH" }); }
        catch (error) { throw error; }
    },

    async updateStock(id, dto) {
        try { return await apiFetch(`/api/listings/${id}/quantity`, { method: "PATCH", body: JSON.stringify(dto) }); }
        catch (error) { throw error; }
    },

    async updateListing(id, formData) {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/api/listings/${id}`, {
                method: "PUT",
                body: formData,
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });

            if (response.status === 413) {
                throw new Error("One or more images are too large. Please keep files under 10MB.");
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to update listing");
            }
            return await response.json();
        } catch (error) { throw error; }
    }
};