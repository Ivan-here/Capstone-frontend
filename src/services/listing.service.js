import { listingClient } from './api/client';

export const listingService = {
    // GET /api/listings (Fetches all active products)
    getAllListings: async () => {
        try {
            const response = await listingClient.get('/listings');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch listings:", error);
            throw error;
        }
    },

    // 2. Get Single Listing (NEW)
    getListingById: async (id) => {
        try {
            const response = await listingClient.get(`/listings/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch listing ${id}:`, error);
            throw error;
        }
    },

    // 3. Create (Existing)
    createFarmListing: async (data) => {
        return await listingClient.post('/listings/farm', data);
    }
};