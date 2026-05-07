# Capstone Frontend

React/Vite frontend for the Locally capstone platform. The app supports browsing food listings, role-based hubs for farmers, restaurants, and NGOs, checkout and order tracking, community posts, profiles, notifications, settings, and admin moderation screens.

## Tech Stack

- React 19
- Vite 7
- React Router 7
- Stripe React SDK
- Axios/fetch service layer
- ESLint

## Prerequisites

- Node.js 20 or newer is recommended
- npm
- Backend API gateway running locally on `http://localhost:9000`, or a deployed API gateway URL

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run linting:

```bash
npm run lint
```

## Main Routes

- `/browse` - public marketplace browsing
- `/product/:id` - listing details
- `/cart` and `/checkout` - cart and payment flow
- `/login`, `/register`, `/register/verify/:role` - authentication and role verification
- `/profile`, `/profile/:userId`, `/profile/edit`, `/profile/business/edit` - profile views and editors
- `/settings` - account, profile, and verification settings
- `/farmer-hub`, `/add-product`, `/edit-product/:id` - farmer listing management
- `/restaurant-hub`, `/add-surplus`, `/edit-surplus/:id` - restaurant surplus management
- `/ngo-hub` - NGO reservations and donations
- `/my-orders`, `/orders/:orderId`, `/orders/:orderId/pickup-plan` - order history and pickup planning
- `/community`, `/community/create`, `/community/posts/:postId` - community feed and posts
- `/connections` - followers/following connections
- `/admin/*` - protected admin dashboard, users, listings, orders, reservations, profiles, verifications, community posts, and notifications

## Project Structure

```text
src/
  app/          App entry, layout, router, and route guards
  components/   Shared UI, common states, and role-based navigation
  context/      React context providers, including auth state
  hooks/        Reusable React hooks
  lib/          Third-party integration helpers, including Stripe
  pages/        Route-level screens and page-specific components/styles
  services/     Backend API wrappers
  styles/       Global CSS
  utils/        Formatting, validation, schedules, images, and notifications
```

## API Integration

The shared API helper is `src/services/http.js`. It builds requests against `VITE_API_BASE_URL`, attaches `Authorization: Bearer <token>` for authenticated requests, parses JSON/text responses, and normalizes API errors.

The frontend talks to the backend through the API gateway routes:

- `/auth/**`
- `/profiles/**`
- `/internal/profiles/**`
- `/api/listings/**`
- `/api/orders/**`
- `/api/reservations/**`
- `/api/verification/**`
- `/notifications/**`
- `/admin/**`
- `/support/**`
- `/api/community/**`
- `/api/reviews/**`
- `/api/payments/**`
- `/api/sellers/**`
- `/api/stripe/**`
- `/api/follows/**`
