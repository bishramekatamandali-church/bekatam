# API Migration Matrix

Last audited: 2026-08-20

This document maps the legacy Node API surface to the target Flutter/Supabase architecture. The legacy API remains the behavioral reference; it is not modified by this migration.

| Legacy route group | Target strategy | Status |
|---|---|---|
| auth | Supabase Auth + identifier Edge Functions where required | GAP: phone/registration parity |
| sermons | Direct Supabase queries + RLS | AUDIT |
| events | Direct Supabase queries + RLS | AUDIT |
| ministries | Direct Supabase queries + RLS; membership transactions via protected function | AUDIT |
| blogposts | Direct Supabase queries + RLS | AUDIT |
| newsitems | Direct Supabase queries + RLS | AUDIT |
| aboutsections | Direct Supabase queries + RLS | AUDIT |
| keypersons | Direct Supabase queries + RLS | AUDIT |
| historymilestones | Direct Supabase queries + RLS | AUDIT |
| historychapters | Direct Supabase queries + RLS | AUDIT |
| branchchurches | Direct Supabase queries + RLS | AUDIT |
| comments | Direct queries for reads; protected function for validated writes where required | AUDIT |
| prayer-requests | Direct queries for permitted reads; protected operations for ownership-sensitive writes | AUDIT |
| testimonials | Direct Supabase queries + RLS | AUDIT |
| interactions | Edge Function for privileged/atomic interaction logic | IMPLEMENTED / VERIFY |
| ai-tools | Edge Function | IMPLEMENTED / VERIFY |
| contact-messages | Direct insert with strict RLS or Edge Function if notification/secrets required | AUDIT |
| donation-records | Protected database/Edge Function operations | AUDIT |
| donor-lists | Protected database/Edge Function/report operations | IMPLEMENTED / VERIFY |
| collection-records | Protected database/Edge Function operations | AUDIT |
| ministry-join-requests | RLS + protected transaction function | IMPLEMENTED / VERIFY |
| ministry-members | Protected transaction function + RLS | IMPLEMENTED / VERIFY |
| users | Profiles/admin operations via RLS and protected functions | AUDIT |
| direct-media | Supabase Storage + metadata table + RLS | AUDIT |
| advertisements | Direct Supabase queries + admin RLS | AUDIT |
| church-members | Protected admin RLS | AUDIT |
| meeting-logs | Protected admin RLS | AUDIT |
| decision-logs | Protected admin RLS | AUDIT |
| expense-records | Protected admin RLS | AUDIT |
| donate-page | Direct Supabase queries + admin RLS | AUDIT |
| financial-summary | Protected RPC/function; never trust client role fields | SECURITY REVIEW |
| fellowship-schedules | Direct/protected database operations | AUDIT |
| activity-logs | Server-side/admin-controlled logging | SECURITY REVIEW |
| content-updates | Server-side/admin-controlled updates | AUDIT |
| notifications | Direct user-owned reads/updates + server-side creation | AUDIT |
| pdfs | Edge Function / server-side PDF generation | REPRODUCIBILITY GAP |

## Rules

1. Do not create a Flutter HTTP wrapper merely to reproduce a legacy endpoint when direct Supabase access is safe.
2. Any operation requiring secrets, privileged database access, atomic multi-table mutation, or trusted server-side validation must remain server-side through an RPC or Edge Function.
3. RLS is the authorization boundary for direct client database access.
4. Every row-level rule must be validated independently of Flutter UI checks.
5. Legacy behavior must be inspected before replacing an endpoint with a different target strategy.
