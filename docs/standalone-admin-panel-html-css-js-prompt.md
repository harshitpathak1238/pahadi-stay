# Standalone Admin Panel Prompt

This prompt is based on the current `app/admin`, `components/admin`, `app/api/admin`, Prisma schema, validation helpers, and Hostinger media API in this repository.

## Analysis Summary

The current admin is a Next.js/Prisma operations console for KainchiDarshan / Pahadi Stay. It manages bookings, listings, category pages, packages, blog posts, media, customers, partners, pickups, payouts, analytics, users, and settings.

Important findings:

- The strongest current UI direction is the newer dense gray admin shell: fixed `252px` sidebar, white `64px` top bar, light gray workspace `#f6f6f7`, charcoal primary actions `#303030`, subtle borders, tight `4px` to `8px` radius, compact tables.
- Some older admin components use green/brown rounded styling. The separate panel should not copy that inconsistency; use one polished admin design.
- Dashboard, orders, listings, blog, media, pickups, customers, partners, payouts, and analytics all have real API-backed behavior or clear intended behavior.
- Settings is currently visual-only and must become persistent.
- `/admin/users` currently incorrectly reuses the customers resource. The separate panel must build real staff/admin user management.
- Listing publishing has important category-specific preflight rules. A LIVE listing must be complete, not merely saved.
- Blog editing includes slug, SEO metadata, rich text/source mode, featured image, scheduled publishing, sanitization, and media upload.
- Media library needs drag/drop, progress, grid/list views, search, filters, detail drawer, replace, copy URL, bulk delete/download, and reference checks.

## Copy-Paste Prompt

```text
You are a senior full-stack engineer and product designer. Build a complete standalone admin panel for KainchiDarshan / Pahadi Stay, a Kumaon/Uttarakhand travel marketplace.

I am creating this admin panel separately using HTML, CSS, and vanilla JavaScript. Some code may already exist in the target folder, so inspect the existing code first, preserve useful work, and add missing functionality cleanly. Do not blindly rewrite working files.

DELIVERY CONSTRAINTS

- Use semantic HTML5, modern CSS, and vanilla JavaScript modules.
- No React, Next.js, Node.js runtime, npm build step, bundler, or server process.
- If backend code is needed, use PHP 8+ JSON API endpoints.
- Use MySQL/MariaDB through PDO prepared statements.
- Keep secrets only in a non-public PHP config file, never in JavaScript.
- The result must run on shared Hostinger hosting after uploading files and configuring the database.
- This must not be a static mockup. Every create, read, update, delete, filter, upload, status change, assignment, settings save, and destructive confirmation must work end to end.

PRODUCT CONTEXT

KainchiDarshan / Pahadi Stay lets guests book stays, rides, bike/scooty rentals, activities, and packages. Partners provide listings and vehicles. Admin staff manage operations, bookings, pickups, content, media, customers, partners, payouts, analytics, users, and settings.

Use INR for money display. Store money as DECIMAL in SQL, not floats. Store timestamps in UTC and display dates/times in India-friendly format.

AUTH, ROLES, AND SECURITY

Implement secure session-based PHP authentication:

- `password_hash` and `password_verify`.
- Secure HttpOnly SameSite cookies.
- CSRF token required for every mutation: POST, PATCH/PUT, DELETE.
- Login throttling by email/IP.
- Server-side authorization on every `/api/admin/*` endpoint.
- Prepared SQL statements everywhere.
- Safe JSON errors that never expose SQL, server paths, stack traces, tokens, passwords, or provider secrets.
- Audit log for login, create, edit, delete, publish, cancel, refund, payout, assignment, role, and settings actions.

Roles:

- OWNER: full access, including users, roles, security, and settings.
- ADMIN: full operational access; optionally require admin allowlist membership.
- STAFF: operational access, but no security-critical settings, owner changes, role escalation, or payout finalization unless explicitly allowed.
- PARTNER: not allowed into this admin console.
- CUSTOMER: not allowed into this admin console.

Build a real Users/Staff page. Do not copy the existing bug where `/admin/users` shows customers.

GLOBAL UI DESIGN

Make the admin feel like a dense operations console, not a marketing page.

Visual system:

- Font: Inter or system UI.
- Workspace background: `#f6f6f7`.
- Surfaces: white.
- Main text: `#303030`.
- Muted text: `#616161`, `#777`, `#8a8a8a`.
- Borders: `#e1e1e3`, `#ededed`, `#c9c9cc`.
- Primary actions: `#303030` with white text.
- Success: `#16704a` text and `#e8f5ee` background.
- Warning: `#b45309` text and `#fff4e5` background.
- Error/destructive: `#b42318` or `#9f3d3d` text and `#fff5f5` or `#fff3ef` background.
- Corners: 4px to 8px.
- Avoid purple gradients, glassmorphism, hero sections, decorative blobs, oversized cards, and inconsistent green/brown rounded styling.

Desktop layout:

- Fixed left sidebar, about 252px wide.
- Sidebar includes logo/mark, "Admin Panel" or "Operations", and nav items.
- Main content starts after sidebar.
- Top bar height about 64px, white background, bottom border.
- Top bar includes mobile menu button, brand/kicker "Pahadi Stay" or "KainchiDarshan", current page title, notification icon, account menu, and sign out.
- Content max width 1200px to 1440px with 16px to 28px spacing.
- Tables are compact and scannable.

Mobile layout:

- Sidebar becomes slide-over drawer with backdrop and close button.
- Tables either scroll horizontally or become stacked rows.
- Forms become one column.
- No text or controls overlap.
- Keep touch targets comfortable.

Icons:

- Use Lucide icons via reliable CDN or bundled local SVG sprite.
- Every icon-only button needs `aria-label`, `title`, and visible focus.
- Dashboard: layout-dashboard.
- Orders: clipboard-list or receipt-text.
- Listings: clipboard-list.
- Stays: home.
- Rides: car.
- Rentals: bike.
- Activities: map.
- Packages: package.
- Blog: book-open.
- Media: file-image.
- Customers: users.
- Users/Staff: user-cog or shield-user.
- Partners: user-round.
- Pickups/Vehicles: truck.
- Payouts: wallet-cards.
- Analytics: bar-chart-3.
- Settings: settings.
- Common: search, refresh-cw, plus, pencil, trash-2, save, x, upload, copy, check, alert-circle, alert-triangle, check-circle-2, more-horizontal.

GLOBAL UX REQUIREMENTS

Every page should include:

- Breadcrumb or back affordance when appropriate.
- Page title.
- Short purpose line.
- Refresh button if data is API loaded.
- Search/filter controls where useful.
- Loading skeletons.
- Empty states.
- Error state with retry.
- Disabled/busy states.
- Toast or inline success/error feedback.
- Confirm dialog for destructive actions.
- Unsaved changes warning for long editors/forms.
- Keyboard accessible drawer, dialogs, forms, tables, and buttons.
- URL-persisted filters where practical.

NAVIGATION AND ROUTES

Build these pages and make every navigation item functional:

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

If implementing as a single-page admin, still support route-like views through hash/history routing and preserve filters in the URL.

DATA MODEL

Create or map to MySQL tables equivalent to:

- users: id, name, email unique nullable, phone unique nullable, password_hash, role, is_active, created_at, updated_at, last_login_at
- password_reset_tokens: id, user_id, token_hash unique, expires_at, used_at, created_at
- partners: id, user_id unique, business_name, category, verification_status, verification_reason, payout_details_encrypted/tokenized, created_at, updated_at
- listings: id, slug unique, partner_id, category, title, description, location, address, base_price, sell_price, bike_quantity, scooty_quantity, images_json, amenities_json, details_json, seo_title, seo_description, cancellation_policy, featured, status, created_at, updated_at
- availability: id, listing_id, date, is_available, price_override, unique(listing_id, date)
- packages: id, title, description, price, image_url, details_json, status, created_at, updated_at
- package_listings: package_id, listing_id
- trips/orders: id, user_id nullable, reference unique, status, expires_at, confirmed_at, reminder_sent_at, created_at
- bookings: id, trip_id nullable, user_id nullable, listing_id, category, start_date, end_date, check_in, check_out, guests, quantity, rental_type, status, price_at_booking, total_price, commission_amount, guest_name, guest_email, guest_phone, metadata_json, created_at
- payments: id, trip_id, provider_order_id, provider_payment_id, status, amount, refunded_amount, created_at
- vehicles: id, partner_id, type, registration_number, driver_name, driver_phone, is_active, created_at, updated_at
- pickup_requests: id, booking_id unique, pickup_location_text, pickup_lat, pickup_lng, dropoff_location_text, requested_time, assigned_vehicle_id nullable, status, created_at, updated_at
- reviews: id, listing_id, user_id, rating, comment, created_at
- blog_posts: id, slug unique, title, meta_title, meta_description, excerpt, body, author_name, author_id, category, primary_keyword, tags_json, featured_image, image_urls_json, image_alt_text, status, scheduled_at, published_at, created_at, updated_at
- media_assets: id, filename, storage_path, public_url unique, mime_type, size, width, height, alt_text, thumbnail_url, created_at, updated_at
- settings: key unique, type, value_json, updated_by, updated_at
- audit_logs: id, actor_user_id, action, entity, entity_id, metadata_json, ip_address, created_at
- payouts or payout_batches: id, partner_id, period_start, period_end, gross, commission, payable, status, reference, paid_at, paid_by, created_at

Use foreign keys, indexes for status/category/date/search fields, unique constraints, transactions for multi-table mutations, and server-side pagination.

API CONTRACT

Use JSON endpoints under `/api/admin/`.

Response shape:

- Success: `{ "data": ..., "meta": ... }`
- Validation failure: HTTP 422 with `{ "error": "...", "fieldErrors": { ... } }`
- Unauthorized: HTTP 401
- Forbidden: HTTP 403
- Not found: HTTP 404
- Conflict/dependency issue: HTTP 409
- Unexpected error: HTTP 500 with safe public message and server-side logging

Use GET for reads, POST for creates/actions, PATCH/PUT for edits, DELETE for deletes. Reject unexpected methods with 405.

Required endpoint groups:

- `/api/admin/session`, `/api/admin/login`, `/api/admin/logout`, `/api/admin/csrf`
- `/api/admin/overview`
- `/api/admin/orders`, `/api/admin/orders/{id}`, `/api/admin/orders/{id}/status`, `/api/admin/orders/{id}/refund`
- `/api/admin/listings`, `/api/admin/listings/{id}`, `/api/admin/listings/bulk-status`
- `/api/admin/packages`, `/api/admin/packages/{id}`
- `/api/admin/blogs`, `/api/admin/blogs/{id}`, `/api/admin/blogs/publish-scheduled`
- `/api/admin/media`
- `/api/admin/customers`, `/api/admin/customers/{id}`
- `/api/admin/users`, `/api/admin/users/{id}`, `/api/admin/users/{id}/reset-password`, `/api/admin/users/{id}/sessions`
- `/api/admin/partners`, `/api/admin/partners/{id}`, `/api/admin/partners/{id}/verify`
- `/api/admin/pickup-requests`, `/api/admin/pickup-requests/{id}`
- `/api/admin/vehicles`, `/api/admin/vehicles/{id}`
- `/api/admin/payouts`, `/api/admin/payouts/{id}/mark-paid`
- `/api/admin/analytics`
- `/api/admin/settings`
- `/api/admin/health`

DASHBOARD

Build a live operations dashboard.

KPI cards:

- Today's bookings.
- Revenue for selected/current 30-day period.
- Unassigned pickups.
- Pending partner applications.
- Failed payments as an alert metric.

Show:

- Action-needed panel linking to pickups, failed payments, and partner reviews.
- Bookings by category: STAY, RIDE, RENTAL, ACTIVITY.
- Revenue by day for last 30 days.
- Eight most recent orders with reference, guest, item count, amount, payment status, booking status, and created timestamp.
- Loading, error, timeout, degraded-data, and empty states.

Do not fail the whole dashboard if one aggregate query fails. Show partial data and a warning.

ORDERS / BOOKINGS

Create a searchable, filterable orders table.

Search:

- Order/trip reference.
- Guest name.
- Guest email.
- Guest phone.

Filters:

- Order status: PENDING, CONFIRMED, COMPLETED, CANCELLED.
- Payment status: CREATED, AUTHORIZED, CAPTURED, FAILED, REFUNDED.
- Category: STAY, RIDE, RENTAL, ACTIVITY.
- Date range.
- Amount range.

Sorting and pagination:

- Newest.
- Oldest.
- Amount high/low.
- Server-side pagination.

Columns:

- Order reference.
- Guest.
- Main listing/category.
- Booking/item count.
- Amount.
- Payment status badge.
- Order status badge.
- Created date.
- Actions.

Order detail view/drawer:

- All bookings/items in the trip.
- Listing title/category/location.
- Dates/check-in/check-out.
- Guests, quantity, rental type.
- Price at booking, total price, commission amount.
- Guest name, email, phone.
- Payment history with provider IDs masked.
- Pickup request and assigned vehicle.
- Activity/audit timeline.
- Call and WhatsApp links.
- Internal notes if implemented.

Actions:

- Confirm order.
- Mark completed.
- Cancel order or cancel individual booking item.
- Initiate/refuse refund if permission allows.
- Add internal note.

Validate state transitions on the server. Actions must be idempotent. Cancellation/refund requires confirmation and audit logging. Never expose Razorpay or other provider secrets.

LISTINGS

Build a full listing manager.

Categories:

- STAY
- RIDE
- RENTAL
- ACTIVITY
- All listings

Filters:

- Search title, location, partner.
- Status: DRAFT, LIVE, PAUSED, PENDING_REVIEW.
- Category tabs.
- Sort: newest, alphabetical, highest price.
- Pagination.

Table columns:

- Row checkbox.
- Image thumbnail or image placeholder icon.
- Title and location.
- Category.
- Partner.
- Base price -> selling price.
- Margin amount and margin percentage.
- Booking count.
- Featured state.
- Status badge or quick LIVE/PAUSED toggle.
- More/edit/delete actions.

Bulk actions:

- Select all visible rows.
- Bulk publish.
- Bulk pause.
- Bulk set draft/pending review if useful.

Listing create/edit fields:

- slug
- title
- description
- category
- location
- full address
- base price
- selling price
- partner selection
- images/media picker
- amenities as repeatable tags
- structured category details
- SEO title
- SEO description
- cancellation policy: FLEXIBLE, MODERATE, STRICT
- featured toggle
- status
- bike quantity and scooty quantity for rental compatibility

Validation:

- Required fields.
- Nonnegative prices.
- Selling price must be greater than or equal to base price.
- Unique slug.
- Authorized partner reference.
- Safe text lengths.
- Cannot delete a listing with active bookings; offer pause instead.
- Unsaved-change warning.
- Preview.
- Save/cancel.
- Success/error feedback.

LIVE publishing preflight requirements:

All categories:

- title
- description
- base price greater than 0
- selling price greater than 0

STAY:

- propertyType
- roomArrangement
- fullAddress
- mapPin
- maxGuests greater than 0
- bedrooms greater than 0
- beds greater than 0
- bathrooms greater than 0
- checkIn time
- checkOut time
- cancellationPolicy
- at least 5 photos

RIDE:

- vehicleType
- passengerCapacity greater than 0
- route or custom pickup
- at least 2 photos

RENTAL:

- vehicleType
- makeModel
- year
- registrationNumber/license plate
- transmission
- dailyPrice greater than 0
- quantity greater than 0
- at least 3 photos

ACTIVITY:

- groupMin
- groupMax
- included
- safetyInformation
- at least 5 photos

CATEGORY PAGES

Build `/admin/stays`, `/admin/rides`, `/admin/rentals`, and `/admin/activities` as category-specific listing views. Reuse listing CRUD but make category explicit.

Stay fields:

- property type
- room arrangement
- full address
- map pin/Google Maps URL/coordinates
- max guests
- bedrooms
- beds
- bathrooms
- check-in time
- check-out time
- cancellation policy
- amenities
- audience tags
- house rules
- neighborhood
- minimum 5 photos to publish

Ride fields:

- vehicle type
- passenger capacity
- route or custom pickup
- estimated duration
- driver notes
- waiting/toll/fuel notes
- minimum 2 photos to publish

Rental fields:

- vehicle type
- make/model
- year
- registration/license plate
- transmission
- daily price
- quantity available
- bike quantity
- scooty quantity
- mileage/odometer
- fuel type
- capacity
- pickup/delivery options
- notable features
- FAQ
- minimum 3 photos to publish

Activity fields:

- minimum group size
- maximum group size
- what is included
- safety information
- guide/operator bio
- duration
- meeting point
- minimum 5 photos to publish

PACKAGES

Build package CRUD.

Fields:

- title
- description/rich text
- price
- duration in details
- selected listing IDs
- status: DRAFT, LIVE, PAUSED
- optional image/featured image

Features:

- Searchable listing selector.
- Checkbox selection of included listings.
- Selected-item summary.
- Validation that LIVE packages have at least one bundled listing, price greater than 0, and duration.
- Clear handling when a bundled listing is paused/deleted.
- Confirm before deletion.
- Table showing title, description excerpt, price, item count, status, created date, and actions.

BLOG

Build a full blog/content manager.

List features:

- Search title, slug, and author.
- Filter DRAFT, SCHEDULED, PUBLISHED, ARCHIVED.
- Sort newest/oldest.
- Featured image thumbnail.
- Author.
- Status badge.
- Publish/scheduled date.
- Edit/delete actions.

Editor fields:

- title
- automatic slug suggestion with manual slug editing
- excerpt/summary
- rich text body
- category
- primary keyword
- tags
- author selected from OWNER/ADMIN/STAFF users
- featured image
- image alt text
- SEO title
- meta description
- status: DRAFT, SCHEDULED, PUBLISHED, ARCHIVED
- scheduled publish date/time when status is SCHEDULED

Rich text toolbar:

- Bold icon.
- Italic icon.
- H2.
- Bulleted list.
- Numbered list.
- Quote.
- Link.
- Insert image.
- Insert table if practical.
- Embed video if practical.
- HTML/source mode.
- Preview mode.

Rules:

- Sanitize HTML server-side with an allowlist.
- Remove scripts, unsafe links, event attributes, dangerous embeds, and unsafe markup.
- Reject non-uploaded local/base64 images; require media upload.
- Reject scheduled dates in the past.
- Published posts get `published_at`.
- Scheduled posts publish only when their time arrives through cron or scheduled endpoint.
- Duplicate slug returns 409.
- Unsaved changes indicator and discard confirmation.
- Revalidate/refresh public content if applicable.

MEDIA LIBRARY

Build a reusable media library.

Supported files:

- Images: JPEG, PNG, WebP up to 10 MB.
- Videos: MP4, MOV up to 100 MB.

Features:

- Drag-and-drop upload.
- Upload button.
- Multi-file upload.
- Visible progress per file.
- Upload errors per file.
- Search.
- Type filter: all/images/videos.
- Sort: newest, oldest, name, largest.
- Grid view.
- List view.
- Pagination.
- Select all current page.
- Bulk download.
- Bulk delete.
- Detail drawer.

Grid cards show:

- Thumbnail/video preview.
- Filename.
- Size.
- Upload date.
- Usage count.
- Checkbox.

List columns:

- Checkbox.
- File.
- MIME type.
- Size.
- Dimensions.
- Uploaded date.
- Usage count.

Detail drawer:

- Large preview.
- Filename edit.
- Alt text edit for images.
- MIME/size/dimensions.
- Usage references.
- Copy URL.
- Replace file.
- Save changes.
- Delete file.

Server validation:

- Validate MIME with `finfo`, not only extension/client metadata.
- Generate safe random filenames.
- Verify actual file signature.
- Store metadata.
- Store files in a non-executable upload location.
- Prevent PHP execution in uploads.
- Before delete, check usage in listings, blog posts, and packages.
- If used, return 409 with all references. Allow explicit force delete only after confirmation.

CUSTOMERS

Build customer operations.

Table:

- Search name, email, phone.
- Columns: name, email, phone, booking count, total spend, last booking, account creation date.
- Pagination.

Detail view:

- Profile.
- Trips/orders.
- Bookings.
- Payment-safe history.
- Reviews if available.
- Mask/minimize personal data where not needed.

Do not expose password hashes, reset tokens, or payment credentials. Export only if permission-protected and privacy-compliant.

USERS / STAFF

Build admin user management separately from customers.

Table:

- Name.
- Email.
- Role.
- Active/disabled state.
- Created date.
- Last login.
- Actions.

Actions:

- Invite/create admin/staff user.
- Change role.
- Disable/enable.
- Start password reset.
- Revoke sessions if tracked.
- View audit history.

Rules:

- Only OWNER can create/change OWNER users.
- OWNER cannot accidentally remove the last active OWNER.
- STAFF cannot manage users or security settings.
- Confirm before disabling access.
- Audit every permission/security action.

PARTNERS

Build partner operations.

Table:

- Search business name and contact.
- Filter PENDING, VERIFIED, REJECTED.
- Columns: business name, contact, category, verification status, live listing count, total listing count, active vehicle count.
- Pagination.

Detail view:

- Contact profile.
- Business profile.
- Verification information.
- Listings.
- Vehicles.
- Payout configuration status.
- Recent activity.

Actions:

- Approve/verify partner.
- Reject with reason.
- Request changes.
- Edit basic partner info.

Do not show raw payout secrets. Store payout details encrypted or tokenized.

PICKUPS AND VEHICLES

Pickup table:

- Booking reference.
- Listing.
- Pickup location.
- Drop-off location.
- Requested time.
- Guest-safe context.
- Status.
- Assigned vehicle.
- Actions.

Filters:

- UNASSIGNED
- ASSIGNED
- EN_ROUTE
- COMPLETED
- CANCELLED
- Date range
- Vehicle/partner if useful

Behavior:

- Flag pickups due within 3 hours.
- Load active vehicles.
- Assign vehicle from selector.
- Assignment must be atomic.
- Validate vehicle is active.
- Prevent conflicting assignment if business rules disallow it.
- Record audit event.
- Notify guest/operator if notification integration is configured.
- Support status progression: UNASSIGNED -> ASSIGNED -> EN_ROUTE -> COMPLETED, with CANCELLED as terminal override.

Vehicle management:

- Create/edit vehicle.
- Partner selection.
- Type.
- Registration number.
- Driver name.
- Driver phone.
- Active/inactive state.
- Safe remove/deactivate.

Never publish private driver data to the public website.

PAYOUTS

Build finance view based on completed bookings.

Filters:

- Date range.
- Partner.
- Payout status.

For each partner calculate:

- Gross booking value.
- Commission.
- Payable amount.
- Completed booking count.
- Payout state: PENDING, PROCESSING, PAID, NO_ACTIVITY.

Features:

- Totals row.
- Detail breakdown per partner/listing/booking.
- DECIMAL-safe arithmetic.
- Permission-protected mark paid workflow.
- Mark paid requires payout reference and confirmation.
- Store paid timestamp and actor.
- Audit mark-paid actions.

Do not invent real money movement unless an actual payout provider is configured. If no provider exists, mark accounting state only.

ANALYTICS

Build analytics for a selectable period, default last 30 days.

Show live server-computed:

- Daily revenue and commission margin timeline.
- Bookings and revenue by category.
- Booking/trip status funnel.
- Top listings by booking count and revenue.
- Totals for bookings, gross revenue, commission, cancellations, and payment failures.

Charts:

- Use lightweight vanilla JS charts, Canvas, SVG, or bundled/CDN chart library.
- Include accessible tabular equivalents.
- INR formatting.
- Empty states.
- Date labels.
- Do not show misleading zero-filled data when the query failed.
- CSV export if practical and permission-protected.

SETTINGS

Settings must be persistent, not decorative.

Include:

- Business name.
- Default commission percentage.
- Timezone.
- Currency display.
- Booking rules.
- Cancellation rules.
- Upload limits.
- Notification toggles.
- Admin allowlist/security settings.
- Optional provider configuration status indicators, but never edit secrets from the browser.

Rules:

- Validate percentage from 0 to 100.
- Show current saved values.
- Save through API.
- Track who changed each setting.
- STAFF cannot modify security-critical values.
- Never edit `.env`, `config.php`, or secrets from the admin UI.

HOSTINGER/PHP DEPLOYMENT REQUIREMENTS

Provide:

- `config.example.php` and instructions to create private `config.php`.
- `database.sql` with schema, indexes, and seed/setup flow.
- `.htaccess` to protect config, SQL, logs, private uploads, and deny PHP execution inside uploads.
- Upload directory strategy.
- README with exact Hostinger setup:
  - create database/user
  - import SQL
  - configure PHP
  - set permissions
  - force HTTPS
  - test login
  - configure cron for scheduled blog publishing if used
- No hard-coded database passwords, API keys, Razorpay secrets, email secrets, media secret, or credentials.

ACCEPTANCE TEST PLAN

Before finishing, verify:

- Unauthenticated admin requests fail with 401/403.
- CUSTOMER/PARTNER cannot access admin.
- STAFF cannot change restricted settings.
- CSRF blocks missing/invalid mutation tokens.
- SQL injection attempts do not break queries.
- Listing required fields and price validation work.
- Selling price cannot be below base price.
- Duplicate listing/blog slugs return 409.
- LIVE listing preflight blocks incomplete listings per category.
- Orders can transition only through valid server-side status rules.
- Cancel/refund actions are authorized and idempotent.
- Listing delete is blocked when active bookings exist.
- Media upload validates MIME/signature/size.
- Media delete detects references and requires force confirmation.
- Scheduled blog dates cannot be in the past.
- Scheduled posts publish through cron.
- Payout totals use DECIMAL-safe arithmetic.
- Users page is separate from customers.
- Last active OWNER cannot be disabled/deleted.
- Mobile layout has no accidental horizontal overflow except intentionally scrollable tables.
- Drawer, dialogs, forms, icon buttons, and tables are keyboard accessible.
- Browser console has no errors.
- Network tab has no failed requests in normal flows.

IMPLEMENTATION STYLE

Keep the code maintainable:

- Shared API helper in JavaScript.
- Shared toast/confirm/dialog utilities.
- Shared table/filter/pagination utilities.
- Shared form validation helpers.
- Shared PHP auth/response/database/CSRF/audit helpers.
- Do not duplicate security logic page by page.
- Keep page modules small and explicit.

Final deliverable should include the complete working admin folder, SQL schema, PHP APIs, CSS, JavaScript modules, README deployment instructions, and a short note listing intentionally disabled third-party integrations.
```
