import { apiFetch, BASE_URL, getToken } from "./http";

function getMultipartError(error, fallbackMessage) {
    if (error instanceof TypeError && String(error.message || "").toLowerCase().includes("fetch")) {
        return new Error("The listing upload could not reach the server. Try fewer or smaller images, then submit again.");
    }

    return error || new Error(fallbackMessage);
}

export const listingService = {
        // listing.service.js

        // listing.service.js
        async getAllListings(role = "SHOPPER", userId = null) { // Changed ownerId to userId
            try {
                let url = `/api/listings?role=${role}`;
                if (userId) {
                    url += `&userId=${userId}`; // Match the @RequestParam in Java
                }
                return await apiFetch(url);
            } catch (error) { throw error; }
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
        } catch (error) { throw getMultipartError(error, "Failed to create farm listing"); }
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
        } catch (error) { throw getMultipartError(error, "Failed to create surplus listing"); }
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
        } catch (error) { throw getMultipartError(error, "Failed to update listing"); }
    }
};
