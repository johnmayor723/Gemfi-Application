# Gemfi Connect

The customer-facing internet banking web client for Gemfi Microfinance Bank. It talks directly to the backend microservices (Auth, Account, Customer Profile, Transaction, Beneficiary, Notification, Statement, KYC) — there is no API gateway, so each service is called on its own base URL.

## Prerequisites

1. Clone the repository.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Make sure the backend services you want to exercise are running locally (see each service's own README under the platform root).

## Configure environment

Create `.env` (or `.env.local`) in the project root with a base URL for each backend service:

```bash
VITE_AUTH_SERVICE_URL=http://localhost:4002
VITE_ACCOUNT_SERVICE_URL=http://localhost:4001
VITE_CUSTOMER_PROFILE_SERVICE_URL=http://localhost:4003
VITE_TRANSACTION_SERVICE_URL=http://localhost:4004
VITE_BENEFICIARY_SERVICE_URL=http://localhost:4005
VITE_NOTIFICATION_SERVICE_URL=http://localhost:4006
VITE_STATEMENT_SERVICE_URL=http://localhost:4007
VITE_KYC_SERVICE_URL=http://localhost:4000/api/v1
```

Adjust the ports/hosts to match wherever those services are actually running.

## Run locally

```bash
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```
