const BASE_URL = "http://localhost:9000";

function getToken() {
    return localStorage.getItem("accessToken");
}

export async function apiFetch(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    const token = getToken();
    if (token && !path.startsWith("/auth")) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

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
