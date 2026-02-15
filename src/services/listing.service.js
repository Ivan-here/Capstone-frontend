import { apiFetch } from "./http";

export const listingService = {
    // GET /api/listings
    async getAllListings() {
        try {
            return await apiFetch("/api/listings");
        } catch (error) {
            console.error("Failed to fetch listings:", error);
            throw error;
        }
    },

    // GET /api/listings/{id}
    async getListingById(id) {
        try {
            return await apiFetch(`/api/listings/${id}`);
        } catch (error) {
            console.error(`Failed to fetch listing ${id}:`, error);
            throw error;
        }
    },

    // POST /api/listings/farm
    async createFarmListing(data) {
        try {
            return await apiFetch("/api/listings/farm", {
                method: "POST",
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error("Failed to create farm listing:", error);
            throw error;
        }
    },
};