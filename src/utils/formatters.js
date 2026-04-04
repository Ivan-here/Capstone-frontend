export function formatPublicOrderId(orderId) {
    const raw = String(orderId || "").trim();
    if (!raw) return "ORD-UNKNOWN";

    if (raw.startsWith("res-")) {
        const suffix = raw.slice(4).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-6);
        return `RES-${suffix || "UNKNOWN"}`;
    }

    const compact = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return `ORD-${compact.slice(-6) || "UNKNOWN"}`;
}
