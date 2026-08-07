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

**Not yet ported** (still React-only): Community/social feed, Public
profile pages (viewing *other* users' profiles), Admin dashboard and all
its sub-sections (including the actual PDF download buttons — see above),
video playback in Media. These are the next pieces to port.

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
