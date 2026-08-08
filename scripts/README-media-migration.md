# Media migration: Cloudinary → Supabase Storage

## What this does
Confirmed against live production data on 2026-08-08: there is no base64
media anywhere in the database (the original architecture concern turned
out not to apply to the actual data). Every media reference is an external
Cloudinary URL. This script re-hosts those **26 real files** into this
project's own Storage buckets and repoints the columns, so the app stops
depending on a third-party Cloudinary account.

Exact scope (all confirmed via SQL against the live DB):

| Column | Rows | Target bucket |
|---|---|---|
| `donatepagecontent.bank_qr_image_url` | 1 | `donation-qr` |
| `donatepagecontent.esewa_qr_image_url` | 1 | `donation-qr` |
| `profiles.profile_image_url` | 3 | `profile-images` |
| `sermon.image_url` | 1 | `content-media` |
| `testimonial.user_profile_image_url` | 2 | `profile-images` |
| `prayerrequest.media_urls[]` (jsonb) | 12 | `content-media` |
| `testimonial.media_urls[]` (jsonb) | 6 | `content-media` |

The script is idempotent — anything already pointing at your Supabase
Storage domain is skipped, so re-running it is safe.

## Why it can't be run from the migration sandbox
It needs network access to `res.cloudinary.com` and `*.supabase.co`,
neither of which are reachable from the environment these migration
sessions run in, plus your **service role key**, which is never pasted
into chat. It has to run from a machine with normal internet access.

## How to run it

```bash
cd scripts
npm install
SUPABASE_URL="https://asnmqrwshsupnlawjjqq.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<from Supabase Dashboard → Project Settings → API → service_role>" \
node migrate-media-to-storage.mjs
```

Do a dry run first if you want to see what it would do without writing
anything:

```bash
DRY_RUN=1 SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node migrate-media-to-storage.mjs
```

Expected output ends with a summary line like:

```
Done. uploaded=26 skipped(already migrated)=0 failed=0
```

If `failed` is non-zero, the log above it names which URL failed and why
(most likely cause: the original Cloudinary asset was deleted or is
access-restricted) — those rows are left pointing at their original URL
so nothing breaks, and you can retry just those manually.

## After running
Spot-check a few rows in `profiles`, `sermon`, `prayerrequest`, and
`testimonial` to confirm the URLs now point at
`asnmqrwshsupnlawjjqq.supabase.co/storage/v1/...`, and open the
corresponding screens in the Flutter app to confirm images/media still
load.
