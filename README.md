# Frontend Project Structure (Vite + React JSX)

Overview of the folder and file structure, with explanations of what goes where and why:

# Root files
package.json – dependencies and scripts.
vite.config.js – Vite configuration.
index.html – single HTML entry point.
.env – environment variables.
.gitignore – excludes node_modules, dist, .env, etc.

# public/
Static files copied directly to the build output.
Favicons,
Static images,
Raw files, copied 1:1, no processing, accessed by URL.
downloadable files (.pdf, .zip, .mp3),
WHATEVER IS USED BY A COMPONENT - ADD TO ASSETS,
Files here are not processed by Vite.

# src/app/ — Application Wiring

This folder connects the entire app together.
main.jsx – Application entry point (ReactDOM render, providers)
App.jsx – Root component (usually renders the router)
layouts/
AppLayout.jsx – Shared layout (navbar, sidebar, footer)
router/
index.jsx – All route definitions
ProtectedRoute.jsx – Route guard for authenticated pages

# src/pages/ — Pages (Routes)
Each folder represents a full page / route.
profile.constants.js – Labels, field names, enums.
profile.validation.js – Validation logic for profile forms.

# src/components/ — Reusable Components
Shared UI components used across multiple pages.
ui/ – Pure UI elements (Button, Input).
layout/ – Structural components (Navbar, Sidebar).
common/ – Generic helpers (Loader, ErrorState, EmptyState).

# src/services/ — API Layer
All communication with the backend lives here.
api/client.js – Axios/fetch wrapper (base URL, headers, auth).
api/endpoints.js – Centralized API paths.
profile.service.js – Profile-related API calls.

# src/hooks/ — Custom React Hooks
Reusable logic extracted into hooks.
useAuth.js – Authentication state and helpers

# src/context/ — React Context
Global app state using React Context.
AuthContext.jsx – User, roles, authentication state

# src/utils/ — Utility Functions
Pure helper functions (no React).
validators.js – Reusable validation helpers.
formatters.js – Date, currency, string formatting.

# src/styles/ — Global Styles
Global CSS
Resets, variables, fonts

# src/assets/ — Static Assets
Images and SVGs imported into components
