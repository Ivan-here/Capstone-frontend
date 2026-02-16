export function decodeJwt(token) {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    try {
        // base64url -> base64
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
        const json = atob(padded);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function getRolesFromToken(token) {
    const payload = decodeJwt(token);
    if (!payload) return [];

    // supports different backend claim styles
    const roles =
        payload.roles ||
        payload.authorities ||
        payload.role ||
        payload.scopes ||
        payload.scope ||
        [];

    if (Array.isArray(roles)) return roles.map(String);
    if (typeof roles === "string") return roles.split(/[,\s]+/).filter(Boolean);
    return [];
}
