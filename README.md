# ShaadiSutra — Indian Wedding Website Marketplace

A React + Vite marketplace for beautifully designed, customizable Indian wedding invitation websites.

## What is implemented

- Responsive storefront and wedding-focused landing page
- Template catalogue with religion/tradition filters, style filters, search and price sorting
- Template detail preview modal and saved favourites
- Guided personalization flow for couple names, wedding date, welcome line, venue, city, event schedule, story and hashtag
- Live invitation preview using the selected design and entered details
- Customer dashboard with saved templates and local draft details
- FAQ, how-it-works, contact and newsletter UI
- Demo checkout that saves a local demo order and clearly does **not** take payment
- Local browser persistence for draft details and saved designs

## Run locally

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

## Production integrations still required

This repository currently contains a frontend MVP. Before accepting real customers or payments, connect:

1. **Authentication** — Appwrite email/password authentication is now wired into the sign-in modal.
2. **Database** — the dedicated Appwrite database and core tables are provisioned; wedding draft save is wired to owner-scoped rows.
3. **Media storage** — the Appwrite wedding-media bucket is provisioned with per-file security, authenticated uploads, image validation and metadata stripping.
4. **Payments** — Cashfree checkout is wired through an Appwrite Function. It creates server-priced orders, verifies payment status server-side, and supports signed Cashfree webhooks. Cashfree credentials, the public site URL and webhook URL still need to be configured before a sandbox payment can run.
5. **Publishing** — create public, unique wedding URLs and serve the right published project.
6. **Guest tools** — RSVP submissions, event-specific guest access, map links and share metadata.
7. **Operations** — admin template management, order support, email notifications, backups, privacy policy and terms.

Wedding editor autosave and saved favourites still use browser localStorage. Use the dashboard's **Save to your account** action to persist a wedding draft in Appwrite. The dedicated Appwrite setup and remaining launch requirements are documented in [APPWRITE_SETUP.md](./APPWRITE_SETUP.md). The demo checkout intentionally does not charge a card or create a real paid order.

## Design direction

An original Indian celebration aesthetic: warm ivory, sindoor, antique gold, editorial serif typography, subtle festive details and mobile-first layouts. The reference website is used for product-flow inspiration; ShaadiSutra has its own brand and interface.
