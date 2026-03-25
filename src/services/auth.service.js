import { apiFetch } from "./http";
import { getRolesFromToken } from "@/services/jwt.js";

const TOKEN_KEY = "accessToken";

function saveToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("userRole");
    localStorage.removeItem("isVerified");
    localStorage.removeItem("userId");
}

export const authService = {
    async login({ login, password }) {
        try {
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ login, password }),
            });

            // Save token immediately so we can read it
            saveToken(data.accessToken);

            // --- 🚨 THE NUCLEAR ROLE EXTRACTION 🚨 ---
            let extractedRole = "SHOPPER"; // Default fallback
            const payload = this.getUserPayload();

            if (payload && payload.roles) {
                // Convert the entire roles array into a raw uppercase string
                const roleString = JSON.stringify(payload.roles).toUpperCase();

                // Aggressively hunt for the role anywhere in that string
                if (roleString.includes("NGO")) {
                    extractedRole = "NGO";
                } else if (roleString.includes("FARM")) {
                    extractedRole = "FARM";
                } else if (roleString.includes("RESTAURANT")) {
                    extractedRole = "RESTAURANT";
                }
            }

            // Lock it in!
            localStorage.setItem("userRole", extractedRole);
            // -----------------------------------------

            // Extract and save User ID
            const userId = data.userId || payload?.userId || payload?.sub || null;
            if (userId) localStorage.setItem("userId", userId);

            // Fetch Profile Verification
            if (userId) {
                try {
                    const profileData = await apiFetch(`/profiles/me`);
                    const isVerified = profileData?.businessProfile?.verified === true;
                    localStorage.setItem("isVerified", String(isVerified));
                } catch (profileErr) {
                    console.error("Could not fetch profile verification status:", profileErr);
                    localStorage.setItem("isVerified", "false");
                }
            } else {
                localStorage.setItem("isVerified", "false");
            }

            return data;

        } catch (err) {
            if (err.status === 401) {
                throw new Error("Invalid email or password.");
            }
            throw new Error("Something went wrong. Please try again.");
        }
    },

    async register(form) {
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

    getUserPayload() {
        const token = this.getToken();
        if (!token) return null;
        try {
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
        const token = this.getToken();
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