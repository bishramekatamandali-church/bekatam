# Bekatam Feature Parity Matrix

Audited 2026-08-20. `IMPLEMENTED` means code coverage exists. It does **not** mean behavioral parity has passed. `TESTING` requires side-by-side validation against the React application.

## Public / member-facing

| Feature | React reference | Flutter target | Backend target | Status |
|---|---|---|---|---|
| Sign up | RegisterPage/RegisterForm | RegisterScreen | Supabase Auth + profiles | BLOCKED: behavior differs |
| Sign in/out | Login + AuthContext | LoginScreen/AuthProvider | Supabase Auth + identifier function | BLOCKED: phone parity |
| Forgot password | ResetPasswordPage | ForgotPasswordScreen | Supabase Auth | TESTING: mechanism differs |
| Home | HomePage | HomeScreen | PostgREST content | IMPLEMENTED / TESTING |
| About | AboutPage | AboutScreen | PostgREST | IMPLEMENTED / TESTING |
| Contact | ContactPage | ContactScreen | PostgREST/Edge Function | IMPLEMENTED / TESTING |
| Sermons | Sermons + detail | Sermon screens | PostgREST + interactions | IMPLEMENTED / TESTING |
| Events + calendar | Events + detail/calendar | Event screens/calendar | PostgREST | IMPLEMENTED / TESTING |
| Blog | Blog + detail | Blog screens | PostgREST + interactions | IMPLEMENTED / TESTING |
| News | News + detail | News screens | PostgREST + interactions | IMPLEMENTED / TESTING |
| Church history | History pages | History screens | PostgREST + interactions | IMPLEMENTED / TESTING |
| Ministries | Ministries + detail | Ministry screens | PostgREST + transactional membership | IMPLEMENTED / TESTING |
| Prayer requests | Prayer requests | Prayer screens | PostgREST + Edge Functions | IMPLEMENTED / TESTING |
| Testimonials | Testimonials | Flutter prayer/testimonial UI | PostgREST + interactions | IMPLEMENTED / TESTING |
| Donate | DonatePage | DonateScreen | PostgREST + Storage | IMPLEMENTED / TESTING |
| Branch churches | BranchesPage | BranchesScreen | PostgREST | IMPLEMENTED / TESTING |
| Media | MediaPage | MediaScreen | Storage + metadata | IMPLEMENTED / TESTING |
| Notices | Notices | NoticesScreen | PostgREST | IMPLEMENTED / TESTING |
| Profile | ProfilePage | ProfileScreen | Auth + profiles + Storage | IMPLEMENTED / TESTING |
| Public profile | PublicProfilePage | Public profile UI | Protected public-profile view | TESTING / security review |
| Notifications | NotificationContext/UI | NotificationsScreen | PostgREST + Realtime | IMPLEMENTED / TESTING |

## Admin

| Feature | Flutter evidence | Target backend | Status |
|---|---|---|---|
| Dashboard | `admin_dashboard_screen.dart` | Aggregated PostgREST/RPC | IMPLEMENTED / TESTING |
| Users | `admin_users_screen.dart` | Profiles + protected transaction/RPC | HIGH RISK / TESTING |
| Sermons | shared/content CRUD | PostgREST | IMPLEMENTED / TESTING |
| Blog | shared/content CRUD | PostgREST | IMPLEMENTED / TESTING |
| News | shared/content CRUD | PostgREST | IMPLEMENTED / TESTING |
| Events | `admin_events_screen.dart` | PostgREST | GAP: JSON array editing |
| Church members | `admin_church_members_screen.dart` | Protected PostgREST | IMPLEMENTED / TESTING |
| Finance | `admin_finance_screen.dart` | PostgREST/RPC | HIGH RISK / TESTING |
| Expenses | `admin_expenses_screen.dart` | PostgREST/RPC | IMPLEMENTED / TESTING |
| Meetings/decisions | admin meeting/finance coverage | PostgREST/RPC | IMPLEMENTED / TESTING |
| Ministries/join requests | admin ministry screens | Transaction/RPC | IMPLEMENTED / TESTING |
| Moderation | prayer/testimonial/admin screens | Protected mutation path | IMPLEMENTED / TESTING |
| Fellowship | `admin_fellowship_screen.dart` | PostgREST/transactional functions | IMPLEMENTED / TESTING |
| Contact messages | `admin_contact_messages_screen.dart` | Protected PostgREST | IMPLEMENTED / TESTING |
| Advertisements | `admin_advertisements_screen.dart` | PostgREST + Storage | GAP: placements JSON editing |
| Site content | admin content screens | PostgREST + Storage | IMPLEMENTED / TESTING |
| Activity logs | `admin_activity_log_screen.dart` | Protected/immutable logs | IMPLEMENTED / SECURITY TEST |
| PDF reports | PDF/Jumbo services | Edge Functions | TESTING |

## Known intentional differences requiring acceptance
- Flutter adds an event calendar view; validate data against the React event list rather than require identical UI.
- React community route redirects to Home; no separate Flutter community screen is required unless business behavior changes.
- Flutter forgot-password uses Supabase's supported mechanism rather than reproducing the old custom OTP implementation byte-for-byte.

## Completion rule
No row becomes `PASS` until the corresponding React workflow, Flutter workflow, data mutation, authorization, error behavior, and relevant side effects have been tested.
