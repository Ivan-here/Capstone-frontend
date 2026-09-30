export function safeInternalPath(value, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || [...value].some(c => c.charCodeAt(0) <= 32)) return fallback;
  try {
    const base = "https://www.locallyl.com";
    const url = new URL(value, base);
    return url.origin === base ? url.pathname + url.search + url.hash : fallback;
  } catch { return fallback; }
}

export function stripeOnboardingUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "connect.stripe.com" || url.username || url.password) {
    throw new Error("Invalid payment onboarding link.");
  }
  return url.href;
}

export function validToken(token, now = Date.now()) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > now;
  } catch { return false; }
}
