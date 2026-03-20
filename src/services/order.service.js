const API_BASE_URL = 'http://localhost:9000/api';

export const orderService = {
    // For Citizens/Shoppers
    getOrdersByShopper: async (shopperId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders?shopperId=${shopperId}`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            return await response.json();
        } catch (error) {
            console.error("Error fetching shopper orders:", error);
            return [];
        }
    },

    // For Farmers/Restaurants
    getOrdersByRestaurant: async (restaurantId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/restaurant/${restaurantId}`);
            if (!response.ok) throw new Error('Failed to fetch business orders');
            return await response.json();
        } catch (error) {
            console.error("Error fetching business orders:", error);
            return [];
        }
    },

    // For NGOs
    getReservationsByNgo: async (ngoId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reservations?ngoId=${ngoId}`);
            if (!response.ok) throw new Error('Failed to fetch reservations');
            return await response.json();
        } catch (error) {
            console.error("Error fetching NGO reservations:", error);
            return [];
        }
    }
};