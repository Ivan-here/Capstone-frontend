// src/services/reviewService.js
import { apiFetch } from "./http";

const API_BASE_PATH = '/api/reviews';

export const reviewService = {
    // 1. Leave a new review (Now securely uses apiFetch with your token)
    createReview: async (reviewData) => {
        try {
            return await apiFetch(API_BASE_PATH, {
                method: 'POST',
                body: JSON.stringify(reviewData)
            });
        } catch (error) {
            console.error("Error creating review:", error);
            throw error;
        }
    },

    // 2. Get all reviews for a specific Product or Business
    getTargetReviews: async (targetType, targetId) => {
        try {
            return await apiFetch(`${API_BASE_PATH}/${targetType}/${targetId}`);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            return [];
        }
    },

    // 3. Get just the average star rating
    getAverageRating: async (targetType, targetId) => {
        try {
            return await apiFetch(`${API_BASE_PATH}/${targetType}/${targetId}/average`);
        } catch (error) {
            console.error("Error fetching average rating:", error);
            return { averageRating: 0, totalReviews: 0 };
        }
    },

    // 4. Get all reviews WRITTEN BY a specific user
    getReviewsByReviewer: async (reviewerId) => {
        try {
            return await apiFetch(`${API_BASE_PATH}/reviewer/${reviewerId}`);
        } catch (error) {
            console.error("Error fetching user review history:", error);
            return [];
        }
    }
};