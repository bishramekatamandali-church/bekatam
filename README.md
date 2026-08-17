# Bishram Ekata Mandali (Bekatam)

Official application repository for the Bishram Ekata Mandali church community.

## Current architecture

The **primary application is now Flutter + Supabase**:

```text
Flutter
  ├─ Web / Android / iOS
  └─ Riverpod
        │
        ▼
Supabase
  ├─ PostgreSQL
  ├─ Auth
  ├─ Storage
  └─ Edge Functions
```

The Flutter application lives in `/flutter` and uses the live Supabase project configured by `SUPABASE_URL` and `SUPABASE_ANON_KEY` at build/run time.

Supabase database migrations and Edge Functions are tracked under `/supabase`.

## Flutter development

```bash
cd flutter
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://asnmqrwshsupnlawjjqq.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<anon-key>
```

CI runs Flutter formatting checks, static analysis, and tests for changes under `/flutter`.

## Migrated functionality

The Flutter/Supabase application contains the public church experience and the administrative system, including authentication, profiles, sermons, events, blog/news, ministries, branches, media, church history, prayer/testimonial moderation, notifications, donations, finance, expenses, meetings, decisions, fellowship, advertisements, contact messages, user administration, activity logs, and PDF reports.

Supabase Edge Functions provide privileged or server-side operations such as PDF generation, financial summaries, donor reports, social interactions, notifications, ministry transactions, AI advertisement copy, username-based sign-in, and the combined administrative report.

## Legacy React/Node implementation

`/frontend` and `/backend` are the **legacy React + Node/Express + Prisma implementation** being replaced by Flutter + Supabase.

They are intentionally still present while the migration is being verified. **Do not delete or modify the legacy application as part of ordinary Flutter work.** Final removal will happen only after the migration is explicitly approved.

## Supabase

The `/supabase/migrations` directory is the source of truth for database changes, and `/supabase/functions` contains the Edge Function source deployed to the Supabase project.

Never commit secrets, service-role keys, database passwords, SMTP credentials, or other private credentials. Use Supabase secrets/environment configuration and local untracked `.env` files instead.
