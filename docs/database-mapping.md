# Database Mapping Audit

Last audited: 2026-08-20

## Sources
- Legacy source of truth: `backend/prisma/schema.prisma` (Prisma datasource is MySQL).
- Target reference: connected Supabase PostgreSQL `public` schema.

## Findings

1. The target PostgreSQL schema already contains the major application domains represented by the legacy Prisma model: content, events, ministries, social interactions, prayer/testimonials, profiles, church members, finance, meetings, fellowship scheduling, media, notifications, and administrative workflows.
2. Target identifiers are predominantly PostgreSQL `uuid`, while legacy Prisma models use string IDs. This is a migration transformation decision, not a reason to copy MySQL syntax directly.
3. Legacy MySQL `Decimal` finance fields are represented in PostgreSQL as numeric, preserving exact monetary semantics.
4. Legacy text/JSON fields are represented with PostgreSQL `text`/`jsonb` where appropriate.
5. Legacy timestamps are represented as PostgreSQL `timestamp with time zone` in the target schema.
6. PostgreSQL enum types are used for multiple legacy status/category fields.
7. The target contains security-oriented tables/views/functions not present as direct one-to-one legacy tables, including `profiles`, `public_profile`, `email_outbox`, and `app_settings`. These must be treated as target architecture additions, not automatically as missing legacy data.

## Confirmed domain mappings

| Legacy domain | Target table(s) | Assessment |
|---|---|---|
| About | aboutsection | PRESENT |
| Admin action logging | adminactionlog | PRESENT |
| Advertisements | advertisement | PRESENT |
| Blog | blogpost | PRESENT |
| Branch churches | branchchurch | PRESENT |
| Church members | churchmember | PRESENT |
| Collections | collectionrecord + donordetail | PRESENT |
| Comments | comment | PRESENT |
| Content likes | contentlike | PRESENT |
| Contact messages | contactmessage | PRESENT |
| OTP | emailotp | PRESENT; security review required |
| Decisions | decisionlog / meetingdecisionpoint | PRESENT; exact legacy usage requires behavioral audit |
| Direct media | directmediaitem | PRESENT |
| Donations | donationrecord / donordetail | PRESENT |
| Events | eventitem | PRESENT |
| Expenses | expenserecord | PRESENT |
| Fellowship | fellowshiprosteritem / generatedscheduleitem / responsibility | PRESENT |
| History | historychapter / historymilestone | PRESENT |
| Home slides | homeslide | PRESENT |
| Key persons | keyperson | PRESENT |
| Meetings | meetinglog / meetingdecisionpoint | PRESENT |
| Ministries | ministry / ministryjoinrequest / ministrymember / history tables | PRESENT |
| News | newsitem | PRESENT |
| Notifications | notification | PRESENT |
| Prayer | prayerrequest / prayer | PRESENT |
| Profiles/users | profiles + Supabase Auth | TARGET ARCHITECTURE; auth migration still required |
| Sermons | sermon | PRESENT |
| Testimonials | testimonial | PRESENT |
| Admin action workflow | useractionrequest / useractionapproval | PRESENT |

## Important parity caveats

- Presence of a target table does not prove field-level or behavior-level parity.
- Foreign-key behavior, uniqueness, defaults, enum values, soft deletion, and transaction semantics still require detailed comparison.
- Auth identity is intentionally split between Supabase Auth and `profiles`; this must be validated against the legacy `user` model before user migration.
- `public_profile` is a view/derived target surface, not a direct replacement for the legacy user table.
- Existing Supabase schema must eventually be captured in version-controlled migrations; the current repository migration history is incomplete relative to the deployed schema.

## Migration rule

Do not alter or delete legacy MySQL tables as part of this audit. Data migration will use a controlled export/transform/import process only after schema and authentication acceptance criteria are established.
