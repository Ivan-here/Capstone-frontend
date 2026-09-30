# Frontend security

The frontend is not an authorization boundary. The backend verifies tokens, current roles, account status, ownership, payment state, and verification permissions.

This update adds:

- Production HTTPS API configuration and generated Cloudflare `_headers` with CSP, anti-framing, MIME-sniffing protection, HSTS, referrer policy, and restricted browser permissions. CSP allows the configured API origin and Stripe's required script/frame/connect origins.
- Session-scoped bearer tokens, expiry checks, removal of legacy persistent tokens, and token clearing after a 401 response. Tokens remain JavaScript-accessible; session storage is not an HttpOnly cookie.
- Restricted in-app notification links and exact-host Stripe onboarding redirects.
- Authenticated backend image uploads, with 10 MB file limits. No unsigned Cloudinary upload preset is bundled. Disable the old preset in Cloudinary after deployment.
- Removal of simulated reservation/payment/pickup successes. The UI now relies on the server's actual checkout response.
- Password validation matching the backend's 12-character / 72-byte registration policy.
- Compatible dependency security updates, regression tests, deployment audit checks, and weekly Dependabot updates.

Build with the actual production API URL:

```bash
npm ci
npm test
npm audit
VITE_API_BASE_URL=https://YOUR-API-HOST npm run build
```

On PowerShell, set `$env:VITE_API_BASE_URL='https://YOUR-API-HOST'` before running the build. Cloudflare Workers serves the generated `dist/_headers` rules with static assets; another hosting provider must apply equivalent HTTP response headers. Check the deployed site and Stripe checkout in a staging browser before rollout.

Deploy the backend changes first or as a coordinated release. Users must sign in again after upgrading from local-storage tokens. API origins and CORS must agree. No production deployment or live browser/payment test was performed during the local review.

The existing repository-wide ESLint issues should be resolved separately; the security helpers have focused regression tests. No code review can guarantee zero vulnerabilities. See the backend `SECURITY.md` for mandatory credential rotation, private-document migration, network/database restrictions, and payment/stock recovery procedures.
