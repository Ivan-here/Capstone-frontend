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

    isLoggedIn() {
        return !!localStorage.getItem(TOKEN_KEY);
    },
    getRoles() {
        const token = localStorage.getItem("accessToken");
        return getRolesFromToken(token);
    },

    hasRole(role) {
        return this.getRoles().includes(role);
    },
};