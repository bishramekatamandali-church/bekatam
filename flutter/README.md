# Bekatam — Flutter + Supabase client

Flutter client for the Bishram Ekata Mandali church app, replacing the React
frontend on top of the Supabase backend (Postgres + Auth + Edge Functions)
built out in earlier migration phases.

## Status (this commit)

Working, real (not scaffolded/placeholder) screens wired to the live
Supabase project and its deployed Edge Functions:

- Auth: sign in, register (creates both the `auth.users` row via Supabase
  Auth and the matching `profiles` row), sign out.
- Home screen with navigation.
- Sermons, Events, Blog, News — list screens reading from `public.sermon`,
  `public.eventitem`, `public.blogpost`, `public.newsitem`.
- Prayer Requests: list from `public.prayerrequest`, submit new request,
  and "Pray for this" wired to the real `toggle-prayer` Edge Function.
- `SocialInteractionBar` / `PrayerActionBar` widgets wired to the real
  `content-interactions` (toggle-like) and `toggle-prayer` Edge Functions,
  matching their actual deployed request/response shape exactly (verified
  against the live function source, not reconstructed from memory).
- `CommentSheet` widget (real comment thread — reads `public.comment`,
  posts via the real `create-comment` Edge Function) wired into the
  comment button on Sermons/Events/Blog/News list cards.
- Ministries: list from `public.ministry`, with a real "Request to Join"
  dialog that inserts into `public.ministryjoinrequest` (status defaults
  to `pending`, matching the enum default — an admin processes it later).
- Donate: reads the singleton `public.donatepagecontent` row and displays
  bank/eSewa/international donation details + QR images.
- Church History: published chapters from `public.historychapter` (draft
  status filtered out — draft is an admin-only editing state), with the
  like/comment bar wired the same as Sermons/Events/Blog/News.
- Branch Churches: list from `public.branchchurch` with tap-to-call/email.
- Media: photo/video grid from `public.directmediaitem` (video playback
  itself isn't wired yet — tapping a video item shows its URL for now).
- Notices: reads `public.generatedscheduleitem` — there's no dedicated
  "notice" table in the schema; this ports the real NoticesPage.tsx's
  actual data source.
- My Profile: view/edit the signed-in user's own `profiles` row
  (full name, bio).
- Detail screens for Sermons, Events, Blog, News, Church History — list
  cards now navigate to a full detail view (video/audio links, event
  contact/registration info, etc.) with the like/comment bar carried over.
- Notifications: reads the real `public.notification` table (filtered by
  `target_user_id`), mark-one-read on tap, mark-all-read button, unread
  count badge on the home screen's bell icon.
- `PdfService` (`lib/services/pdf_service.dart`): wraps the `generate-pdf`
  and `donor-list-report` Edge Functions. **No UI screen calls it yet** —
  `generate-pdf` is admin-only server-side (same as the original app's PDF
  report controllers, which were only ever reachable from the admin
  dashboard), so real download buttons for it belong on the Admin
  dashboard screens, not here. The service is ready for that pass.

**Admin Dashboard is now fully built out** (see below) — all 33 backend
resources have a Flutter admin screen. Not yet ported outside the admin
area: the ~25 non-admin member-facing pieces already listed above are
done; remaining gaps are the deferred items in "Still open" (media
migration script execution, GEMINI_API_KEY secret, go_router wiring,
Phase 7 parity testing).

## This session's additions

- **Public Profile** (`lib/screens/profile/public_profile_screen.dart`,
  ports `PublicProfilePage.tsx`): view another user's basic info and their
  public/anonymous prayer requests. Reachable by tapping a commenter's name
  in `CommentSheet` or a prayer request author's name in
  `PrayerRequestsScreen`. Carries over a real quirk from the source app:
  the prayer-request filter matches `posted_by_admin_id`, not `user_id` —
  kept as-is for parity rather than "fixed".
- **Community feed**: confirmed (again) that `CommunityPage.tsx` in the
  real app is just an 11-line redirect to `/`. No Flutter screen needed —
  documented on the Home screen instead of silently missing.
- **Video playback in Media** (`media_gallery_screen.dart`): video items now
  play inline via `video_player` (play/pause, scrub bar) instead of just
  showing the raw URL.
- **Admin Dashboard** (`lib/screens/admin/`): new section, gated behind
  `profile.isAdmin` with a Home screen tile. First pass wires:
  - `admin_reports_screen.dart` — **the PDF download buttons**, the one
    thing explicitly missing before. Financial Summary (date range picker),
    BS Calendar (year input), Donor List Report (JSON/XML), and all 7
    single-record reports (meeting, decision, collection record, history
    chapter, church member, fellowship schedule, donation receipt) via a
    record picker pulling the 30 most recent rows from the source table.
    Downloads generate via `PdfService` then open the OS share sheet.
  - `admin_users_screen.dart` — the real multi-admin consensus workflow:
    request block/delete with a required reason, approve pending requests;
    body shapes verified against the live deployed `user-action-consensus`
    function source, not reconstructed from memory.
  - `admin_content_crud_screen.dart` — generic list+form CRUD, config-driven,
    reused for Sermons, Blog Posts, and News (near-identical schema:
    title/description/image_url/link_path/category/date/video_url/audio_url,
    plus speaker/scripture/full_content for Sermons only).
  - `admin_events_screen.dart` — Events gets its own screen for its larger
    field set (event_type, schedule_type, location, time, contact info,
    registration link, capacity, fee). Known simplification: `locations`,
    `conducted_by`, and `speakers` are jsonb array columns in the real
    schema for multi-location/multi-speaker events — this pass edits the
    single `location` text field only; the array editors are a follow-up.
  - `admin_church_members_screen.dart` — membership record CRUD (contact
    info, member-since date, active/inactive toggle).
  - `admin_finance_screen.dart` — tabbed Donations / Collections /
    Financial Summary. Donations and Collections are full CRUD against
    `donationrecord`/`collectionrecord` with their real purpose and
    payment-method enums. Financial Summary calls the deployed
    `financial-summary` Edge Function with an optional date range and
    renders its income/expense/net totals plus per-purpose/category
    breakdowns — response shape verified against live deployed source.
  - `admin_expenses_screen.dart` — `expenserecord` CRUD with real category/
    payment-method/status enums (paid/pending/overdue/cancelled shown with
    a status dot).
  - `admin_meetings_screen.dart` — tabbed Meetings / Decisions.
    `meetinglog` CRUD (type, attendees, agenda, minutes, action items,
    status) and `decisionlog` CRUD (made-by, status, follow-up actions),
    both with real enum values pulled from the Prisma schema (live SQL
    connector was down this session, so enum/column names came from
    `backend/prisma/schema.prisma` in the cloned repo instead — same
    ground truth, different source).
  - `admin_ministries_screen.dart` — tabbed Ministries / Join Requests.
    Ministries tab is plain `ministry` CRUD. Join Requests tab lists
    pending `ministryjoinrequest` rows with Approve/Reject; approving
    mirrors the real app by also calling `ministry-member-transaction`
    (op: create) to add the person to `ministrymember`, matching the real
    backend's audit-trailed roster write.
  - `admin_moderation_screen.dart` — tabbed Prayer Requests / Testimonials.
    Hide/Restore (via `is_deleted` + `moderation_reason` + moderator
    fields) and, for prayer requests, a status dropdown. Note: the live
    `public_visibility` enum only has one value (`public`) — there's no
    real 'anonymous' visibility toggle to moderate, so this works through
    hide/restore rather than a visibility switch.
  - `admin_ministries_screen.dart` — tabbed Ministries / Join Requests.
    Ministries tab is plain `ministry` CRUD. Join Requests tab lists
    pending `ministryjoinrequest` rows with Approve/Reject; approving
    mirrors the real app by also calling `ministry-member-transaction`
    (op: create) to add the person to `ministrymember`, matching the real
    backend's audit-trailed roster write.
  - `admin_moderation_screen.dart` — tabbed Prayer Requests / Testimonials.
    Hide/Restore (via `is_deleted` + `moderation_reason` + moderator
    fields) and, for prayer requests, a status dropdown. Note: the live
    `public_visibility` enum only has one value (`public`) — there's no
    real 'anonymous' visibility toggle to moderate, so this works through
    hide/restore rather than a visibility switch.
  - `admin_fellowship_screen.dart` — tabbed Rosters / Schedule. Both
    `fellowshiprosteritem` and `generatedscheduleitem` are plain CRUD —
    confirmed during the Phase 5 Edge Function audit that the real app's
    schedule generation is manual admin entry, not an automated
    recurrence engine, so no "generate" button was built.
  - `admin_contact_messages_screen.dart` — inbox view of `contactmessage`
    with Pending/Replied sections and a mark-replied action with a note.
  - `admin_advertisements_screen.dart` — `advertisement` CRUD with a
    "Generate with AI" button wired to the deployed `generate-ad-copy`
    function (needs `GEMINI_API_KEY` configured — see "Still open" above).
    Known simplification: the real `placements` jsonb column (which pages/
    slots an ad appears on) isn't editable yet.
  - `admin_site_content_screen.dart` — tabbed About Sections / Branch
    Churches / Key Persons / Direct Media, each plain CRUD against their
    respective table.
  - `admin_activity_log_screen.dart` — read-only feed of `adminactionlog`,
    newest first.
  - All 33 backend resources now have an admin screen — nothing left on
    the "Coming next" list.

## Setup

```
cd flutter
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://asnmqrwshsupnlawjjqq.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<anon key from Supabase project settings>
```

`SUPABASE_URL` already defaults to the project URL in
`lib/services/supabase_service.dart` if you omit that define; the anon key
has no default and must be passed at build/run time.

## Architecture notes

- State management: Riverpod (`flutter_riverpod`), per the plan's decision.
- `lib/services/supabase_service.dart` — single Supabase client instance.
- `lib/services/auth_provider.dart` — auth state stream + `profiles` row
  loader + sign in/up/out.
- `lib/services/social_service.dart` — typed wrappers around the
  `content-interactions`, `toggle-prayer`, and `create-comment` Edge
  Functions (all `verify_jwt: false`, matching the original Express routes'
  public/guest-friendly behavior).
- `lib/models/` — plain Dart classes parsing the real Postgres column names
  (snake_case, as returned by supabase-flutter) for `profiles`, `sermon`,
  `prayerrequest`.
- `lib/widgets/social_interaction_bar.dart` — reusable like/comment-count
  bar and the prayer-specific action bar.

Column/table names throughout are taken directly from the live schema
(`Supabase:list_tables`), not from the original Prisma schema — some
values still need a decode pass if you extend into enum-heavy tables
(e.g. `sermon.category`, `donationrecord.purpose`) since Postgres returns
those as their raw enum string values.
