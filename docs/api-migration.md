# Node API → Flutter/Supabase Migration Map

Audited against `backend/src/index.ts` and the existing Flutter/Supabase implementation on 2026-08-20.

## Rule
The legacy API is the behavioral reference. It is not copied endpoint-for-endpoint. Each route is mapped to the safest target capability: direct PostgREST query, RPC/database function, Edge Function, Storage, Auth, or intentional exclusion.

| Legacy route group | Target | Current evidence | Status |
|---|---|---|---|
| `/auth` | Supabase Auth + Edge Function for identifier resolution | `flutter/lib/services/auth_provider.dart` | GAP: phone parity / registration parity |
| `/sermons` | PostgREST + content update mechanism | Flutter sermon model/screens exist | VERIFY CRUD/business rules |
| `/events` | PostgREST | Flutter event model/screens exist | VERIFY JSON arrays + CRUD |
| `/ministries` | PostgREST | Flutter ministry screens exist | VERIFY permissions/workflows |
| `/blogposts` | PostgREST | Flutter blog model/screens exist | VERIFY CRUD |
| `/newsitems` | PostgREST | Flutter news model/screens exist | VERIFY CRUD |
| `/aboutsections` | PostgREST | Flutter About/admin content coverage exists | VERIFY public/admin parity |
| `/keypersons` | PostgREST | Flutter admin content coverage exists | VERIFY |
| `/historymilestones` | PostgREST | Flutter history coverage exists | VERIFY |
| `/historychapters` | PostgREST | Flutter history coverage exists | VERIFY |
| `/branchchurches` | PostgREST | Flutter branch screen/model exists | VERIFY |
| `/comments` | Edge Function where guest/server validation is required | `social_service.dart` | VERIFY auth + guest rules |
| `/prayer-requests` | PostgREST + Edge Function for protected interaction paths | Flutter prayer implementation exists | VERIFY moderation/RLS |
| `/testimonials` | PostgREST + Edge Function for interaction paths | Flutter implementation exists | VERIFY moderation/RLS |
| `/interactions` | Edge Functions / Realtime as appropriate | `social_service.dart` | VERIFY like/share parity |
| `/ai-tools` | Edge Functions | legacy requires server secret | VERIFY current Flutter dependency |
| `/contact-messages` | PostgREST/Edge Function | Flutter contact/admin screens exist | VERIFY insert/admin access |
| `/donation-records` | PostgREST/RPC | Flutter finance/admin coverage exists | VERIFY privileged writes |
| `/donor-lists` | Edge Function/RPC | PDF/report services exist | VERIFY report parity |
| `/collection-records` | PostgREST/RPC | Flutter finance/admin coverage exists | VERIFY privileged writes |
| `/ministry-join-requests` | PostgREST + transaction/RPC | Flutter admin/ministry coverage exists | VERIFY history + membership transaction |
| `/ministry-members` | RPC/transactional database function | Flutter implementation exists | VERIFY atomicity |
| `/users` | Profiles + protected RPC/Edge Function | Flutter admin user screen exists | HIGH PRIORITY RLS/authorization |
| `/direct-media` | Supabase Storage + metadata table | Storage service + admin media screen exist | VERIFY bucket policies |
| `/advertisements` | PostgREST + Storage + optional Edge Function | Flutter admin advertisements exists | GAP: placements JSON editing |
| `/church-members` | PostgREST + protected admin policies | Flutter admin church-member screen exists | VERIFY RLS |
| `/meeting-logs` | PostgREST/RPC | Flutter admin meeting coverage exists | VERIFY transactional behavior |
| `/decision-logs` | PostgREST/RPC | Flutter admin finance/meeting coverage exists | VERIFY |
| `/expense-records` | PostgREST/RPC | Flutter admin expense screen exists | VERIFY constraints/approval behavior |
| `/donate-page` | PostgREST | Flutter donate/admin donate content exists | VERIFY media + public parity |
| `/financial-summary` | Protected RPC/Edge Function | Flutter finance/report service exists | HIGH PRIORITY: SECURITY DEFINER review |
| `/fellowship-schedules` | PostgREST + transactional functions | Flutter fellowship/admin coverage exists | VERIFY roster/schedule atomicity |
| `/activity-logs` | Protected PostgREST/RPC | Flutter admin log service/screen exists | VERIFY immutable/admin-only writes |
| `/content-updates` | Realtime/broadcast mechanism | Node publishes content updates | VERIFY Flutter subscription behavior |
| `/notifications` | PostgREST + Realtime | Flutter notification screen exists | VERIFY trigger/event parity |
| `/api/pdfs` | Edge Function | Flutter PDF service exists | VERIFY all report types |

## Important legacy behavior found
The Node server applies Helmet, compression, request-body limits, CORS, and GET cache-control headers globally. These are server concerns and should not be mechanically reproduced in Flutter. cite-not-required

The sermon API contains compatibility fallback logic for missing legacy columns and publishes content updates after mutations. This indicates that migration parity includes not only CRUD fields but also compatibility behavior and update propagation.

## Next API audit
For each route group, inspect every method and record:
1. request validation
2. authentication middleware
3. role checks
4. database operations
5. transaction boundaries
6. side effects
7. response shape
8. error/status behavior
9. Flutter target implementation
10. test case

No route is considered migrated merely because a similarly named Flutter screen exists.
