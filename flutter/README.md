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

**Not yet ported** (still React-only): Church History, Ministries, Donate
page, Branches, Media, Notices, Community/social feed, Profile pages,
Admin dashboard and all its sub-sections, notifications UI, PDF report
downloads, detail screens for any of the list screens above (tapping a
card doesn't navigate anywhere yet — only the like/comment/pray actions
on the card itself are wired). These are the next pieces to port.

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
