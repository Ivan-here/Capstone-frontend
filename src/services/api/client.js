import axios from 'axios';

// 1. Define Base URLs for your Microservices
const PROFILE_BASE_URL = 'http://localhost:8081/profile';
const VERIFICATION_BASE_URL = 'http://localhost:8083/api/verification';
const LISTING_BASE_URL = 'http://localhost:8084/api';
const BASE_URL = "http://localhost:9000";

// 2. Helper to attach JWT token to requests
const authInterceptor = (config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

// 3. Create the Clients
export const profileClient = axios.create({ baseURL: PROFILE_BASE_URL });
export const verificationClient = axios.create({ baseURL: VERIFICATION_BASE_URL });
export const listingClient = axios.create({ baseURL: LISTING_BASE_URL });

// 4. Attach Interceptors
profileClient.interceptors.request.use(authInterceptor);
verificationClient.interceptors.request.use(authInterceptor);
listingClient.interceptors.request.use(authInterceptor);