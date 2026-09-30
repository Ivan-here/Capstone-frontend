import test from "node:test";
import { Buffer } from "node:buffer";
import assert from "node:assert/strict";
import { safeInternalPath, stripeOnboardingUrl, validToken } from "../src/services/security.js";
import { securityHeaders } from "../security-headers.js";

test("notification links cannot redirect to external sites or execute scripts", () => {
  for (const path of ["//evil.example", "/\\evil.example", "javascript:alert(1)", "https://evil.example", "/\nevil.example"]) {
    assert.equal(safeInternalPath(path), "/");
  }
  assert.equal(safeInternalPath("/orders/123?tab=pickup"), "/orders/123?tab=pickup");
});
test("payment redirects require the exact Stripe HTTPS host", () => {
  assert.equal(stripeOnboardingUrl("https://connect.stripe.com/setup/s/abc"), "https://connect.stripe.com/setup/s/abc");
  for (const url of ["http://connect.stripe.com", "https://connect.stripe.com.evil.example", "javascript:alert(1)", "https://evil@connect.stripe.com"]) {
    assert.throws(() => stripeOnboardingUrl(url));
  }
});
test("expired or malformed tokens are not treated as logged in", () => {
  const token = exp => `header.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.signature`;
  assert.equal(validToken(token(2), 1000), true);
  assert.equal(validToken(token(1), 1000), false);
  assert.equal(validToken(null), false);
  assert.equal(validToken("not-a-token"), false);
  assert.equal(validToken(token("9999999999")), false);
});
test("production headers restrict scripts, framing, and API destinations", () => {
  const headers = securityHeaders("https://api.locallyl.com");
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /connect-src 'self' https:\/\/api.locallyl.com/);
  assert.doesNotMatch(headers, /script-src[^;]*unsafe/);
  assert.throws(() => securityHeaders("http://api.locallyl.com"));
  assert.throws(() => securityHeaders("https://user:password@api.locallyl.com"));
});
