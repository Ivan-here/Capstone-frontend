import { apiFetch } from "./http";

const TOKEN_KEY = "accessToken";
const USER_KEY = "currentUser";

export const authService = {
    async login({ identifier, password }) {
        const payload = { login: identifier, password };
        const data = await apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
        return data;
    },

    async register(form) {
        // match your RegisterRequest record: email, password, username, firstName, lastName, displayName?
        const data = await apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify(form),
        });

        if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
        return data;
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    getCurrentUser() {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },
};
