# Appwrite backend setup

ShaadiSutra uses its own Appwrite project. Do not point this app at the Bucket India project.

## Existing Appwrite resources

- Project: `Weddingwebsite`
- Appwrite Site: `shaadisutra-web` (Vite, Node 22, static SPA fallback)
- Generated site URL: `https://shaadisutra-web.appwrite.network`
- Project ID: `6afdb35c0036c36ebf2e`
- Region: Singapore (`sgp`)
- Database: `shaadisutra`
- Tables: `wedding_projects`, `wedding_events`, `template_catalog`, `orders`, `rsvps`
- Storage bucket: `wedding-media`

## Local configuration

Copy `.env.example` to `.env.local` and set the project ID. The Appwrite endpoint and project ID are public client configuration; never put an Appwrite API key or server secret in a `VITE_*` variable or browser code.

## Security model

- User-owned tables have row security enabled and no broad table-level permissions. Create rows with explicit owner permissions and enforce ownership on every update/delete.
- The template catalogue is readable publicly; only trusted console/server operations should write catalogue entries.
- The media bucket allows authenticated uploads, public file viewing, and file-level security. Images are limited to 10 MB and JPG/JPEG/PNG/WebP/AVIF. Metadata stripping, encryption, antivirus and image transformations are enabled.
- Never trust a client-provided order amount or payment status. Cashfree order creation, payment verification and webhook signature verification run in the `cashfree-payments` Appwrite Function. Cashfree client ID and secret are server-only Function variables; never put them in React, Vite variables or GitHub.
- RSVP creation for public guests should be mediated by a rate-limited Appwrite Function; do not grant anonymous table write access.

## Current integration scope

The browser SDK provides Appwrite email/password authentication, owner-scoped wedding draft storage, template catalogue reads and wedding image uploads. The Appwrite Site `shaadisutra-web` hosts the Vite static SPA with an `index.html` fallback. The Appwrite Function `cashfree-payments` handles server-priced Cashfree order creation, Cashfree status verification, signed webhook updates, payment-gated publishing, public invitation reads, guest RSVP submission and owner-authenticated RSVP listing. The eight active template catalogue rows are stored in Appwrite. Email delivery, guest event-specific access and admin tooling are not yet implemented. Run the complete sandbox flow with a test account and Cashfree sandbox credentials before production.

## Cashfree payment setup

Appwrite Function: `cashfree-payments` (Node.js 22), deployed in sandbox mode.

The checkout supports these routes:
- `POST /create-order` — requires `x-appwrite-user-jwt`; server-controlled template price; creates the Cashfree order and pending Appwrite order row.
- `POST /verify` — requires `x-appwrite-user-jwt`; fetches the payment status from Cashfree and marks an order paid only after a successful, matching payment.
- `POST /webhook` — validates Cashfree's `x-webhook-signature` against the timestamp plus raw request body before updating the order.
- `GET /health` — harmless function health check.

In Appwrite Console → Functions → `cashfree-payments` → Variables, configure:
- `CASHFREE_CLIENT_ID` — your Cashfree sandbox App ID (mark as secret)
- `CASHFREE_CLIENT_SECRET` — your Cashfree sandbox secret key (mark as secret)
- `CASHFREE_ENV` — currently set to `sandbox`; change to `production` only after go-live approval and production credentials are ready
- `SHAADISUTRA_SITE_URL` — exact public base URL of the deployed ShaadiSutra frontend (no trailing slash)
- `CASHFREE_NOTIFY_URL` — generated HTTPS Appwrite Function domain plus `/webhook` (find the generated domain under the function's Domains tab)

Do not share Cashfree secrets in chat or commit them to GitHub. Add them directly in Appwrite Function Variables. Configure the Cashfree dashboard webhook to send payment events to the HTTPS `CASHFREE_NOTIFY_URL`. Keep the Appwrite Function execute access as Any because Cashfree must reach the webhook; user-specific routes enforce Appwrite JWT authentication in the function.

The frontend loads Cashfree's hosted checkout JavaScript SDK in sandbox mode. The Appwrite Site is deployed and the payment Function is live, but Cashfree credentials are not configured yet, so checkout cannot create a real sandbox session. No live payment has been attempted. Test successful, failed, cancelled, pending, webhook replay and duplicate notification scenarios in Cashfree sandbox, then configure production credentials and Cashfree's production webhook.
