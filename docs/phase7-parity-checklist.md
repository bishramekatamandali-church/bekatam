# Phase 7 — Parity Testing Checklist

Run this after the media migration is done. For each row: open the React
page and the Flutter screen side by side (same test account), do the
listed action in both, and check they end up in the same state. Tick off
as you go — this file is meant to be checked into git with your checkmarks
so progress persists across sessions.

Legend: `[ ]` not tested · `[x]` passes · `[!]` mismatch found (note it)

## Public / member-facing

- [ ] **Sign up** — React `RegisterPage` vs Flutter `RegisterScreen`: new profile row created, correct default role.
- [ ] **Sign in / sign out** — `LoginPage` vs `LoginScreen`.
- [ ] **Forgot password** — React `ResetPasswordPage` (custom OTP) vs Flutter `ForgotPasswordScreen` (Supabase built-in email link). These use genuinely different mechanisms now — verify the Flutter email actually arrives and its link works, since this isn't a like-for-like port.
- [ ] **Home** — `HomePage` vs `HomeScreen`: same nav destinations reachable.
- [ ] **About Us** — `AboutPage` vs `AboutScreen`: same section content/order, same leaders listed.
- [ ] **Contact Us** — `ContactPage` vs `ContactScreen`: submit a message, confirm it shows up in Admin → Contact Messages from both.
- [ ] **Sermons** — list, detail, like, comment, share.
- [ ] **Events** — list, detail, like, comment; **Event Calendar** (new Flutter-only grid view — no direct React equivalent, so just sanity-check it against the list data, not a 1:1 comparison).
- [ ] **Blog** — list, detail, like, comment.
- [ ] **News** — list, detail, like, comment.
- [ ] **Church History** — chapters list/detail, like, comment.
- [ ] **Ministries** — list vs list; **ministry detail** (`SingleMinistryPage` vs `MinistryDetailScreen`): join request submit, status badge (pending/approved/rejected), resubmit-after-rejection.
- [ ] **Prayer Requests** — submit, pray-for toggle, comment.
- [ ] **Testimonials** — submit, like, comment.
- [ ] **Donate** — bank/eSewa details match, QR images load (re-check this one *after* the media migration script runs).
- [ ] **Branch Churches** — list content matches.
- [ ] **Media Gallery** — images/video play.
- [ ] **Notices** — fellowship schedule/announcements match.
- [ ] **My Profile** — edit fields, avatar upload.
- [ ] **Public Profile** — view another user's profile, same fields visible.
- [ ] **Notifications** — same events trigger notifications in both; mark read/mark-all.

## Admin dashboard

- [ ] **Reports** — generate each of the 9 PDF report types + donor list export; compare output content (not pixel layout) against the React admin.
- [ ] **Manage Users** — block/delete request → consensus approval flow, same as React's multi-admin approval.
- [ ] **Sermons / Blog / News** (shared CRUD screen) — create/edit/delete each type.
- [ ] **Events** — create/edit/delete. Known gap: `locations`/`conducted_by`/`speakers` jsonb arrays aren't editable in Flutter (single location field only) — confirm this is acceptable or flag for a follow-up.
- [ ] **Church Members** — CRUD.
- [ ] **Finance** — Donations, Collections, Summary numbers match between admins for the same date range.
- [ ] **Meetings & Decisions** — CRUD.
- [ ] **Expenses** — CRUD.
- [ ] **Ministries & Join Requests** — approve/reject a request, confirm `ministrymember` + history rows written same as React.
- [ ] **Content Moderation** — hide/restore a prayer request and a testimonial.
- [ ] **Fellowship Rosters & Schedule** — CRUD both tabs; open the new **program detail screen** via the info icon and confirm responsibilities show correctly.
- [ ] **Contact Messages** — mark replied, matches the public submission from the Contact Us test above.
- [ ] **Advertisements** — CRUD. Known gap: `placements` jsonb not editable in Flutter. Known deferred: AI ad-copy button needs `GEMINI_API_KEY` set (you said skip Gemini for now — leave this unchecked/skipped).
- [ ] **Site Content** (About / Branches / Key Persons / Direct Media tabs) — edit each, then re-check the **public About page** reflects the edit.

## Known, already-documented non-parity items (don't fail the test on these — they're intentional)

- Community feed has no separate Flutter screen — real React `CommunityPage` is just a redirect to Home.
- `content-interactions` guest lookup ANDs guestEmail+guestPhone where the original ORs them.
- BS (Bikram Sambat) calendar poster PDF is a simplified day-grid, not the original's 12-page image-composited version.
- `public_visibility` enum only has one live value (`public`); moderation uses hide/restore, not a visibility toggle.
- go_router is declared in `pubspec.yaml` but not wired — app uses plain `Navigator`. Functionally fine, just not what the original plan named.

## Sign-off

Once every box above is `[x]` (or explicitly accepted as a known gap),
Phase 7 is done and the React codebase can be removed per the plan.
