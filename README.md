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

1. **Authentication** — Supabase Auth or another secure identity provider.
2. **Database** — persist users, template catalogue, wedding projects, event details, guest lists, RSVPs and orders.
3. **Media storage** — secure image/audio uploads with validation, resizing and CDN delivery.
4. **Payments** — Razorpay order creation and server-side signature verification. Never trust a browser-only payment-success state.
5. **Publishing** — create public, unique wedding URLs and serve the right published project.
6. **Guest tools** — RSVP submissions, event-specific guest access, map links and share metadata.
7. **Operations** — admin template management, order support, email notifications, backups, privacy policy and terms.

The current personalization data, saved designs and demo orders use browser localStorage. They are not synced across devices and are not a substitute for a production database. The demo checkout intentionally does not charge a card or create a real paid order.

## Design direction

An original Indian celebration aesthetic: warm ivory, sindoor, antique gold, editorial serif typography, subtle festive details and mobile-first layouts. The reference website is used for product-flow inspiration; ShaadiSutra has its own brand and interface.
