import { apiFetch } from "./http";
import {getRolesFromToken} from "@/services/jwt.js";

const TOKEN_KEY = "accessToken"; // match http.js getToken()

function saveToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export const authService = {
    async login({ login, password }) {
        try {
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ login, password }),
            });

            saveToken(data.accessToken);
            return data;

        } catch (err) {
            if (err.status === 401) {
                throw new Error("Invalid email or password.");
            }

            throw new Error("Something went wrong. Please try again.");
        }
    },

    async register(form) {
        // Match your RegisterRequest fields in backend:
        // email, password, username, firstName, lastName, displayName(optional)
        const data = await apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                email: form.email,
                password: form.password,
                username: form.username,
                firstName: form.firstName,
                lastName: form.lastName,
                displayName: form.displayName?.trim() || `${form.firstName} ${form.lastName}`.trim(),
            }),
        });

        saveToken(data.accessToken);
        return data;
    },

    logout() {
        clearToken();
    },

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },
    // Add this right under getToken()
    getUserPayload() {
        const token = this.getToken();
        if (!token) return null;
        try {
            // Decode the payload (middle part of the JWT)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error("Failed to decode token", error);
            return null;
        }
    },

    isLoggedIn() {
        return !!localStorage.getItem(TOKEN_KEY);
    },
    getRoles() {
        const token = localStorage.getItem("accessToken");
        return getRolesFromToken(token);
    },

    getUserId() {
        const payload = this.getUserPayload();
        return payload?.userId || payload?.sub || null;
    },

    hasRole(role) {
        const normalized = String(role).toUpperCase().replace(/^ROLE_/, "").trim();
        return this.getRoles()
            .map(r => String(r).toUpperCase().replace(/^ROLE_/, "").trim())
            .includes(normalized);
    },
};