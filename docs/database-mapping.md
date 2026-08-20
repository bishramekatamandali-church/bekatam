# Database Migration Mapping

## Source of truth during migration
The production MySQL/Prisma schema remains the legacy behavioral reference. Supabase is the target system and must not be used to destructively synchronize the production database.

## Core mappings verified so far

| Legacy domain | Legacy Prisma/MySQL model | Supabase target | Target access |
|---|---|---|---|
| Identity | User | `profiles` + `auth.users` | Auth + protected profile access |
| Sermons | Sermon | `sermon` | PostgREST |
| Events | EventItem | `eventitem` | PostgREST |
| Ministries | Ministry | `ministry` | PostgREST + transaction functions |
| Ministry membership | MinistryMember / history | `ministrymember`, `ministrymemberhistory` | Protected transaction/RPC |
| Blog | BlogPost | `blogpost` | PostgREST |
| News | NewsItem | `newsitem` | PostgREST |
| History | HistoryChapter / HistoryMilestone | `historychapter`, `historymilestone` | PostgREST |
| Branches | BranchChurch | `branchchurch` | PostgREST |
| Comments | Comment | `comment` | Protected/Edge Function |
| Likes | ContentLike | `contentlike` | Edge Function / controlled writes |
| Prayer | PrayerRequest / Prayer | `prayerrequest`, `prayer` | PostgREST + Edge Function |
| Testimonials | Testimonial | `testimonial` | PostgREST + interaction functions |
| Notifications | Notification | `notification` | PostgREST + Realtime |
| Church members | ChurchMember | `churchmember` | Protected admin access |
| Donations | DonationRecord / DonorDetail | `donationrecord`, `donordetail` | Protected writes/RPC |
| Collections | CollectionRecord | `collectionrecord` | Protected writes/RPC |
| Expenses | ExpenseRecord | `expenserecord` | Protected writes/RPC |
| Meetings | MeetingLog / decisions | `meetinglog`, `meetingdecisionpoint` | Protected CRUD/RPC |
| Fellowship | roster/schedule/responsibility models | `fellowshiprosteritem`, `generatedscheduleitem`, `responsibility` | Transactional functions |
| Media | DirectMediaItem | `directmediaitem` + Storage | Storage + metadata |
| Ads | Advertisement | `advertisement` | PostgREST + Storage |
| Content | About/KeyPerson/HomeSlide | `aboutsection`, `keyperson`, `homeslide` | PostgREST + Storage |
| Contact | ContactMessage | `contactmessage` | Public insert + protected admin read/update |
| Audit | Activity/UserAction | `activitylog`, `useractionrequest`, `useractionapproval` | Protected admin workflows |
| OTP/email | EmailOTP / email outbox | `emailotp`, `email_outbox` | Server-side only |
| Settings | AppSettings | `app_settings` | Server-side only |

## Reproducibility blocker
The repository currently contains only two committed Supabase migrations while the deployed Supabase project contains a substantially larger application schema. Therefore the target database is not yet reproducible from Git alone.

Required next step: capture the intended deployed schema, reconcile it against Prisma/MySQL and existing migrations, remove accidental/duplicate definitions, and produce a clean version-controlled migration history. This must be done without destructive changes to production MySQL.

## Schema review rules
For every table compare:
- primary key strategy
- foreign keys and delete behavior
- nullable/default semantics
- enum/status values
- timestamp semantics
- uniqueness constraints
- indexes
- soft-delete behavior
- JSON/array fields
- transaction boundaries
- RLS policies

Do not declare a mapping complete from table-name similarity alone.
