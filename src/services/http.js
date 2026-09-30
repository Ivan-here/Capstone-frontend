import { validToken } from "./security";
const configuredUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:9000" : "");
if (!configuredUrl || (import.meta.env.PROD && new URL(configuredUrl).protocol !== "https:")) {
    throw new Error("Configure an HTTPS API URL for production.");
}
export const BASE_URL = configuredUrl.replace(/\/+$/, "");
// Discard tokens persisted by older builds; require a fresh login after this upgrade.
localStorage.removeItem("accessToken");
localStorage.removeItem("token");

export function getToken() {
    const token = sessionStorage.getItem("accessToken");
    if (!validToken(token)) { sessionStorage.removeItem("accessToken"); return null; }
    return token;
}

export async function apiFetch(path, options = {}) {
    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) throw new Error("Invalid API path");
    const headers = {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
    };

    const token = getToken();
    if (token && !path.startsWith("/auth")) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "omit",
        redirect: "error",
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (res.status === 401) sessionStorage.removeItem("accessToken");
    if (!res.ok) {
        let message = "Something went wrong.";

        if (data) {
            if (data.message) message = data.message;
            else if (data.error) message = data.error;
            else if (Array.isArray(data.errors)) message = data.errors.join(" ");
            else if (typeof data === "string") message = data;
        }

        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}