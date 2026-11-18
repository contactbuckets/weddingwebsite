# Appwrite backend setup

ShaadiSutra uses its own Appwrite project. Do not point this app at the Bucket India project.

## Existing Appwrite resources

- Project: `Weddingwebsite`
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
- Never trust a client-provided order amount or payment status. Payment order creation and Razorpay signature/webhook verification must run in an Appwrite Function using server-side secrets.
- RSVP creation for public guests should be mediated by a rate-limited Appwrite Function; do not grant anonymous table write access.

## Current integration scope

The browser SDK module provides Appwrite email/password auth, owner-scoped wedding draft creation/update and image upload. Payment, public publishing, guest RSVP endpoint, email delivery and admin tooling still need server-side functions and end-to-end testing before launch.
