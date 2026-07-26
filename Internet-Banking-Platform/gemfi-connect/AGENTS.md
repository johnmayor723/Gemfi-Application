# AGENTS.md

## Project Context

Gemfi Connect is a standalone React + Vite client for Gemfi Microfinance Bank's internet banking platform. It is a plain frontend app — there is no Base44 dependency, backend, or CLI involved.

There is no API gateway. This client calls each backend microservice directly on its own base URL, configured via `VITE_*_SERVICE_URL` environment variables (see `README.md`).

## Key Files

- `src/api/services.js`: maps env vars to each backend service's base URL.
- `src/api/endpoints.js`: builds the full URL for every backend route this client calls.
- `src/api/client.js`: shared fetch wrapper (JWT bearer auth, automatic refresh-token retry on 401).
- `src/auth/AuthProvider.jsx`: real session state (tokens in `sessionStorage`, current user).
- `.env` / `.env.local`: local environment values; never commit secrets.

## Working Notes

- Run `npm run dev` for local development against whichever backend services you have running.
- Run `npm run build` and `npm run lint` before finishing code changes.
- When adding a call to a new backend endpoint, add it to `src/api/endpoints.js` first (full URL, built from `SERVICES`), then add a thin wrapper function in the relevant `src/api/*.api.js` file — don't call `fetch` directly from components.
- Match the existing per-page API module pattern (one `*.api.js` file per backend domain) rather than introducing a new data-fetching approach.
