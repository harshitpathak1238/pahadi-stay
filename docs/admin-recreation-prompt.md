# Standalone Admin Section Recreation Prompt

Copy everything inside the block below into the coding model or developer you want to use.

```text
You are a senior full-stack engineer and product designer. Build a complete, production-ready admin console for a travel marketplace called KainchiDarshan. The console manages stays, rides, rentals, activities, packages, bookings, partners, customers, vehicles, pickup requests, payouts, blog content, media assets, analytics, and operational settings.

IMPORTANT DELIVERY CONSTRAINT

The deployment target is shared Hostinger hosting. Do not use Next.js, React, Node.js, npm, a build step, or server processes. Use:

- Semantic HTML5
- Modern CSS in separate files, with responsive mobile-first layouts
- Vanilla JavaScript modules in separate files
- PHP 8+ JSON API endpoints for server-side persistence and authentication
- MySQL/MariaDB through PDO and prepared statements
- An SQL schema and seed file
- Hostinger-compatible `.htaccess` routing if needed

The result must work after uploading the project to public_html and configuring database credentials in one non-public PHP config file. Never put secrets in JavaScript. Never store card numbers, CVVs, or payment secrets in the browser or database.

Do not produce a static mockup. Every listed read, create, edit, delete, filter, assignment, status change, upload, and setting action must work end to end. If a third-party service is unavailable, provide a clear configuration setting and a graceful disabled/degraded state, while the rest of the admin remains usable.

PRODUCT CONTEXT

KainchiDarshan is a Kumaon/Uttarakhand travel marketplace. Guests can discover and book homes, hotels, homestays, transport, bike/scooty rentals, activities, and travel packages. Partners provide listings and vehicles. Staff operate bookings, pickups, content, and payouts. Currency is INR and dates/times should display in an India-friendly format.

ROLES AND SECURITY

Implement session-based PHP authentication with secure, HttpOnly, SameSite cookies, CSRF tokens for every mutation, password hashing with password_hash, login throttling, server-side authorization, and prepared SQL statements. Protect every `/api/admin/*` endpoint on the server; hiding a menu item is not authorization.

Roles:

- OWNER: full access, including staff and settings
- ADMIN: full operational access, subject to the configured admin allowlist
- STAFF: operational access, but no sensitive system/security changes unless explicitly allowed
- PARTNER: not an admin role; do not allow partner accounts into this console
- CUSTOMER: no admin access

Create a Users page where OWNER/ADMIN can manage admin users, roles, active status, and invite/reset access. Keep an audit log for login, create, edit, delete, publish, refund, payout, assignment, and permission actions. Log actor, action, entity, entity ID, timestamp, IP, and safe metadata. Never log passwords, tokens, or payment secrets.

GLOBAL ADMIN UI

Use a quiet, dense, operational interface rather than a marketing page. Use a warm off-white/very light gray workspace, white surfaces, charcoal primary actions, restrained green success accents, amber warnings, and red destructive/error accents. Avoid purple gradients, excessive rounded cards, glassmorphism, and decorative hero sections.

Desktop layout:

- Fixed left navigation approximately 252px wide with a small K mark and “Operations” label
- Main content offset beside the navigation
- White top bar with “KainchiDarshan” and “Admin”, current page title, notification affordance, account menu, and sign out
- Main content constrained to approximately 1200-1440px with consistent 16-28px spacing
- Borders should be subtle, corners about 4-8px, and tables should be easy to scan

Mobile layout:

- Navigation becomes a slide-over drawer opened by an icon button
- Add a backdrop and close action
- Tables scroll horizontally or switch to stacked rows
- Forms become one column
- Never allow text, table actions, or controls to overlap

Use accessible labels, visible focus states, keyboard support, semantic headings, aria-live feedback, confirm dialogs for destructive actions, empty states, loading skeletons, error states, retry actions, disabled/busy states, and success toasts. Use familiar icons from an icon library only if bundled locally or loaded from a reliable CDN. Every icon-only button needs a tooltip/title and aria-label.

NAVIGATION AND ROUTES

Build these pages and make each navigation item functional:

1. Dashboard: `/admin/`
2. Orders: `/admin/orders`
3. Listings: `/admin/listings`
4. Stays: `/admin/stays`
5. Rides: `/admin/rides`
6. Rentals: `/admin/rentals`
7. Activities: `/admin/activities`
8. Packages: `/admin/packages`
9. Blog: `/admin/blog`
10. Media Library: `/admin/media`
11. Customers: `/admin/customers`
12. Users: `/admin/users`
13. Partners: `/admin/partners`
14. Pickups & Vehicles: `/admin/pickups`
15. Payouts: `/admin/payouts`
16. Analytics: `/admin/analytics`
17. Settings: `/admin/settings`

Every page needs a breadcrumb/back affordance where appropriate, a descriptive title, a short purpose statement, refresh behavior, and URL-persisted filters where practical.

1. DASHBOARD

Create a live operations overview, not hard-coded numbers.

KPI cards:

- Today’s bookings
- Revenue for the selected/current 30-day period
- Unassigned pickups
- Pending partner applications
- Failed payments (visible as an alert metric)

Show a warning/action-needed panel linking to the exact work: pickups to assign, failed payments to review, and partner applications awaiting review. Show bookings by category with counts, a revenue trend or daily revenue chart, and the eight most recent orders with reference, guest, item count, amount, payment state, booking state, and timestamp. Include loading, timeout, degraded-data, and empty states. Do not fail the entire dashboard because one aggregate query is unavailable.

2. ORDERS / BOOKINGS

Provide a searchable, filterable operations table for trips/orders. Search reference, guest name, guest email, and phone. Filter by PENDING, CONFIRMED, COMPLETED, CANCELLED; payment state CREATED, AUTHORIZED, CAPTURED, FAILED, REFUNDED; category; date range; and amount range. Support newest/oldest sorting and pagination.

Columns should include order reference, guest, listing/category, booking count, amount, payment status, order status, created date, and actions. Clicking an order opens a detail drawer/page showing all bookings, dates, guests, quantity, rental type, listing, price-at-booking, total, commission, payment history, pickup request, and audit history. Add safe actions to confirm, complete, cancel, and initiate/refuse refund according to permissions. Require confirmation for cancellation/refund and make state transitions server-validated and idempotent. Never expose provider secrets.

3. LISTINGS AND CATEGORY MANAGEMENT

The listings table must support category tabs/filters: STAY, RIDE, RENTAL, ACTIVITY, and all listings. Include search by title, location, and partner; status filters DRAFT, LIVE, PAUSED, PENDING_REVIEW; sort by newest, alphabetical, or price; pagination; row selection; bulk set status; and a LIVE/PAUSED quick toggle.

Listing columns: image thumbnail, title, category, location, partner, base price, selling price, bookings, status, featured state, and actions.

Create/edit listing form fields:

- slug, title, description
- category
- location and full address
- base price and selling price in INR
- partner selection
- image URLs or media picker
- amenities as repeatable tags
- structured details JSON/editor appropriate to the category
- SEO title and SEO description
- cancellation policy: FLEXIBLE, MODERATE, STRICT
- featured toggle
- status
- rental-only bike quantity and scooty quantity

Validate required fields, nonnegative prices, selling price not below base price, slug uniqueness, safe text lengths, and authorized partner references. Provide preview, unsaved-change warning, save/cancel, success/error feedback, and delete with dependency checks. A listing cannot be deleted silently if bookings reference it.

Category pages should reuse the listing system but make the category explicit. Stays focus on accommodation details and amenities; rides on transport/pickup details; rentals on vehicle quantities and rental type; activities on duration, meeting point, and capacity. Keep the shared data contract consistent.

4. PACKAGES

Create/edit/delete travel packages that bundle existing listings. Fields: title, description, price, selected listing IDs, active/published state, and optional image. Provide a searchable listing selector, selected-item summary, validation that at least one valid listing is selected, price validation, confirmation before deletion, and clear handling when a bundled listing becomes unavailable. Show package title, description, price, item count, created date, and actions.

5. BLOG AND CONTENT

Build a real content manager with list and editor views. List features: search title/slug/author, filter DRAFT/SCHEDULED/PUBLISHED/ARCHIVED, sort newest/oldest, featured image thumbnail, author, publish date, and edit/delete actions.

Editor fields:

- title with automatic slug suggestion and manual slug editing
- excerpt/summary
- rich text body editor with headings, bold, italic, bulleted list, numbered list, quote, links, image insertion, and source/HTML mode
- category, primary keyword, tags
- author selected from OWNER/ADMIN/STAFF users
- featured image and alt text
- SEO title and meta description
- status DRAFT, SCHEDULED, PUBLISHED, ARCHIVED
- scheduled publish date/time when status is SCHEDULED

Sanitize HTML server-side with an allowlist. Remove scripts, styles, unsafe links, event attributes, and dangerous embeds. Reject scheduled dates in the past. Published posts get a published timestamp; scheduled posts only publish when their time arrives. Add preview mode, unsaved changes indicator, discard confirmation, image upload from the editor, and duplicate-slug handling. Revalidate or refresh public content after publish/update.

6. MEDIA LIBRARY

Create a reusable media management page with grid and list views. Support image JPEG/PNG/WebP and video MP4/MOV uploads, drag-and-drop, multi-file upload, visible progress, upload errors, search, image/video type filtering, newest/oldest/name/size sorting, pagination, select-all per page, bulk download, and bulk delete.

For each asset show filename, thumbnail or video preview, MIME type, size, dimensions, upload date, alt text, and usage count. A detail drawer must allow preview, filename edit, alt text edit for images, URL copy, file replacement, usage references, save, and delete. Before deletion, check references in listings, blog posts, and packages. If used, explain every reference and require an explicit force-delete confirmation. Validate MIME type, extension, actual file signature, size limits (images 10 MB, videos 100 MB), generated safe filenames, storage permissions, and image dimensions. Store files outside executable PHP paths where possible and never trust client MIME metadata.

7. CUSTOMERS

Provide a searchable paginated customer table. Search name, email, and phone. Show name, email, phone, booking count, total spend, last booking, and account creation date. Open a customer detail view with profile, trips, bookings, payment-safe history, and reviews. Mask or minimize personal data where the operator does not need it. Do not expose password hashes or payment credentials. Add an export action only if it is permission-protected and privacy-compliant.

8. USERS / STAFF

Manage admin users separately from customers. Show name, email, role, active/disabled state, creation date, last login, and actions. Support invite/create, role changes, disable/enable, password reset initiation, and revoke sessions. Only OWNER can change OWNER access or modify security-critical settings. Include an audit trail and confirmation for disabling/removing access.

9. PARTNERS

Provide a searchable partner table showing business name, contact, category, verification status, live listing count, total listing count, and active vehicle count. Filter PENDING, VERIFIED, REJECTED. Partner detail view shows contact profile, listings, vehicles, verification information, payout configuration status, and activity. Support approve, reject with reason, and request changes. Do not show raw payout secrets. Keep payout details encrypted or tokenized if stored.

10. PICKUPS AND VEHICLES

Show pickup requests with booking reference, listing, pickup location, drop-off location, requested time, guest-safe context, status, and assigned vehicle. Prioritize or flag requests due within three hours. Filter UNASSIGNED, ASSIGNED, EN_ROUTE, COMPLETED, CANCELLED and by date/status. Load active vehicles and let authorized staff assign a vehicle. Assignment must be atomic, validate that the vehicle is active, prevent conflicting assignment if the business rule disallows it, and record an audit event. Support status progression and clear error handling.

Vehicle management should support partner, type, registration number, driver name, driver phone, active/inactive state, edit, and safe removal/deactivation. Never publish private driver data to the public site.

11. PAYOUTS

Build a finance view based on completed bookings. For each partner calculate gross booking value, commission, payable amount, completed booking count, and payout state such as PENDING, PROCESSING, PAID, or NO_ACTIVITY. Show a date range and partner filter, totals, and a detail breakdown that lets finance verify the calculation. Add a permission-protected “mark paid” workflow with payout reference, paid timestamp, actor, and audit record. Do not invent payment completion or send money unless a real provider integration is configured.

12. ANALYTICS

Provide a selectable period, defaulting to the last 30 days, and live server-computed charts/tables for:

- daily revenue and commission margin timeline
- bookings and revenue by category
- booking/trip status funnel
- top-performing listings by booking count and revenue
- totals for bookings, gross revenue, commission, cancellation count, and payment failures

Charts must have accessible tabular equivalents, INR formatting, empty states, date labels, and no misleading zero-filled data when the query failed. Include CSV export if practical and permission-protect it.

13. SETTINGS

Make settings genuinely persistent, not decorative inputs. Include business name, default commission percentage, timezone, currency display, booking/cancellation rules, upload limits, notification toggles, and admin allowlist/security settings appropriate to the user’s role. Validate numeric percentages from 0 to 100, show current saved values, track who changed each setting, and prevent STAFF from modifying security-critical values. Never edit `.env` values from the browser.

DATA MODEL

Create relational MySQL tables equivalent to these entities and relationships:

- users: id, name, email, phone, password_hash, role, is_active, created_at, updated_at, last_login_at
- partners: id, user_id, business_name, category, verification_status, verification_reason, payout_details_encrypted, created_at, updated_at
- listings: id, slug unique, partner_id, category, title, description, location, address, base_price, sell_price, bike_quantity, scooty_quantity, images/media references, amenities, details JSON, SEO fields, cancellation_policy, featured, status, created_at, updated_at
- availability: id, listing_id, date, is_available, price_override, unique listing/date
- packages: id, title, description, price, image, status, created_at, updated_at
- package_listings: package_id, listing_id
- trips/orders: id, user_id nullable for guest checkout, unique reference, status, expires_at, confirmed_at, created_at
- bookings: id, trip_id nullable, user_id nullable, listing_id, category, start_date, end_date, check_in, check_out, guests, quantity, rental_type, status, price_at_booking, total_price, commission_amount, guest_name, guest_email, guest_phone, metadata JSON, created_at
- payments: id, trip_id, provider order ID, provider payment ID, status, amount, refunded_amount, created_at; encrypt or minimize provider data
- vehicles: id, partner_id, type, registration_number, driver_name, driver_phone, is_active, created_at
- pickup_requests: id, booking_id unique, pickup/drop-off text and optional coordinates, requested_time, assigned_vehicle_id nullable, status, created_at, updated_at
- reviews: id, listing_id, user_id, rating, comment, created_at
- blog_posts: all editor/SEO/status/scheduling fields, image references, author relation, created/updated timestamps
- media_assets: id, filename, safe storage path, public URL, MIME, size, width, height, alt text, thumbnail path, timestamps
- settings: key unique, typed value, updated_by, updated_at
- audit_logs: actor, action, entity, entity_id, metadata, IP, created_at

Use foreign keys, indexes for status/category/date/search fields, unique constraints, transactions for multi-table mutations, and server-side pagination. Store monetary values as DECIMAL, never floating-point calculations. Store timestamps in UTC and display in the configured timezone.

API CONTRACT

Implement JSON endpoints grouped under `/api/admin/`. Use consistent responses:

- success: `{ "data": ..., "meta": ... }`
- validation failure: HTTP 422 with `{ "error": "...", "fieldErrors": { ... } }`
- unauthorized: HTTP 401
- forbidden: HTTP 403
- not found: HTTP 404
- conflict/dependency issue: HTTP 409
- unexpected error: HTTP 500 with a safe public message and server-side logging

Include GET/POST/PATCH/DELETE endpoints for resources where the UI needs them, with server-side filtering, sorting, pagination, validation, and authorization. Use POST or PATCH only for mutations, reject unexpected methods, and make destructive actions explicit. Add a health/status endpoint that reports safe dependency states without exposing credentials.

HOSTINGER DEPLOYMENT

Provide:

- `config.example.php` and instructions to create a non-public `config.php`
- `database.sql` with schema, indexes, and a minimal seed OWNER/admin account setup flow
- `.htaccess` rules that prevent access to config, SQL, logs, and private uploads
- a secure uploads directory strategy with non-executable files
- a README with exact Hostinger steps: create database/user, import SQL, configure PHP, set permissions, configure HTTPS, test login, and set a cron job for scheduled blog publishing if cron is needed
- no hard-coded credentials, API keys, database passwords, or environment secrets

TESTING AND ACCEPTANCE

Add a small but real test plan and automated tests where possible. At minimum verify:

- unauthenticated admin requests return 401/403
- STAFF cannot change restricted settings
- CSRF rejects missing/invalid tokens
- prepared statements prevent injection paths
- listing price and required-field validation
- unique slugs and duplicate handling
- booking status transition rules
- refund/cancel actions are authorized and idempotent
- media MIME/signature/size validation and dependency protection
- scheduled blog dates cannot be in the past
- payout totals use DECIMAL-safe arithmetic
- mobile layout has no horizontal overflow except intentionally scrollable tables
- keyboard navigation and visible focus work for drawer, dialogs, forms, and tables

Before finishing, run PHP syntax checks, database migration/import checks, API tests, and browser tests at desktop and mobile widths. Fix all console errors, broken links, failed requests, missing states, and layout overlap. Deliver the complete folder tree and concise deployment instructions. Keep the implementation maintainable: shared API helpers, shared validation, shared table/filter components in vanilla JS, and no copied page-specific security logic.
```

## Notes about the current project

This specification reflects the live route-driven admin surface in this repository. The older `AdminWorkspace` component uses mock data and is intentionally excluded as a source of truth. The current project also has a visual settings form that is not yet backed by a persistence API; the prompt upgrades that area into a real settings workflow so the recreated Hostinger version is genuinely deployable.