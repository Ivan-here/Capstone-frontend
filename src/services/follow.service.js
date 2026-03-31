const API_BASE_URL = 'http://localhost:9000/api/follows';

// Helper to get headers with the current user's ID
const getHeaders = () => {
    const userId = localStorage.getItem('userId');
    return {
        'Content-Type': 'application/json',
        'userId': userId
    };
};

export const followService = {
    getStats: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/${userId}/stats`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    },

    getFollowers: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/${userId}/followers`, { headers: getHeaders() });
        if (!response.ok) return [];
        return response.json();
    },

    getFollowing: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/${userId}/following`, { headers: getHeaders() });
        if (!response.ok) return [];
        return response.json();
    },

    followUser: async (targetId) => {
        const response = await fetch(`${API_BASE_URL}/${targetId}`, { method: 'POST', headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to follow');
    },

    unfollowUser: async (targetId) => {
        const response = await fetch(`${API_BASE_URL}/${targetId}`, { method: 'DELETE', headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to unfollow');
    },

    removeFollower: async (followerId) => {
        const response = await fetch(`${API_BASE_URL}/remove/${followerId}`, { method: 'DELETE', headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to remove follower');
    },

    blockUser: async (targetId) => {
        const response = await fetch(`${API_BASE_URL}/${targetId}/block`, { method: 'POST', headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to block');
    }
};