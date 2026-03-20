// src/services/reviewService.js
import { apiFetch, BASE_URL, getToken } from "./http";


// Note: Adjust the base URL if your API gateway is on a different port/URL in your frontend config
const API_BASE_URL = 'http://localhost:9000/api/reviews';

export const reviewService = {
    // 1. Leave a new review
    createReview: async (reviewData) => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add your JWT Authorization header here if needed for tracking the user
                },
                body: JSON.stringify(reviewData)
            });
            if (!response.ok) throw new Error('Failed to submit review');
            return await response.json();
        } catch (error) {
            console.error("Error creating review:", error);
            throw error;
        }
    },

    // 2. Get all reviews for a specific Product or Business
    // targetType must be "LISTING", "SELLER", or "BUYER"
    getTargetReviews: async (targetType, targetId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${targetType}/${targetId}`);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            return await response.json();
        } catch (error) {
            console.error("Error fetching reviews:", error);
            return [];
        }
    },

    // 3. Get just the average star rating (For the Browse grid & Stats cards)
    getAverageRating: async (targetType, targetId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${targetType}/${targetId}/average`);
            if (!response.ok) throw new Error('Failed to fetch average');
            return await response.json();
        } catch (error) {
            console.error("Error fetching average rating:", error);
            return { averageRating: 0, totalReviews: 0 };
        }
    },
    // 4. Get all reviews WRITTEN BY a specific user
    getReviewsByReviewer: async (reviewerId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reviewer/${reviewerId}`);
            if (!response.ok) throw new Error('Failed to fetch user review history');
            return await response.json();
        } catch (error) {
            console.error("Error fetching user review history:", error);
            return [];
        }
    }
};