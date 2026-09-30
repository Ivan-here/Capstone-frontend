export function securityHeaders(apiUrl) {
  const api = new URL(apiUrl);
  if (api.protocol !== "https:" || api.username || api.password) {
    throw new Error("Production VITE_API_BASE_URL must be an HTTPS URL without credentials.");
  }
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://js.stripe.com https://*.js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${api.origin} https://api.stripe.com https://r.stripe.com https://m.stripe.network https://q.stripe.com`,
    "frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com",
    "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'self'", "upgrade-insecure-requests",
  ].join("; ");
  return `/*\n  Content-Security-Policy: ${csp}\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Strict-Transport-Security: max-age=31536000\n`;
}
