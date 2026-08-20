# Bekatam Flutter + Supabase Migration Status

Last audited: 2026-08-20

## Safety
- Legacy React + Node.js + MySQL production system remains untouched by this migration.
- No VPS, DNS, reverse-proxy, PM2, production environment, or MySQL destructive changes are authorized by this document.

## Phase status
| Phase | Status | Evidence / next action |
|---|---|---|
| Repository audit | IN PROGRESS | React, Node, Prisma/MySQL, Flutter, and Supabase areas identified. Complete endpoint/table inventory next. |
| Production safety audit | PASS | Migration work is isolated from production deployment configuration. |
| Feature parity audit | IN PROGRESS | Existing public/admin Flutter coverage is broad, but verification is incomplete. |
| Database architecture | IN PROGRESS | Supabase schema exists; compare it exhaustively with Prisma/MySQL before declaring parity. |
| Supabase security | IN PROGRESS | RLS is broadly enabled; security/performance findings require remediation and verification. |
| Flutter foundation | IMPLEMENTED | Existing Flutter/Supabase application is the migration target. |
| Feature migration | IN PROGRESS | Implemented screens must be validated against legacy behavior. |
| Integration testing | NOT STARTED | Requires completed parity matrix and test fixtures. |
| Security review | IN PROGRESS | Advisor findings identified; remediation pending. |
| Production readiness | NOT STARTED | No cutover is authorized. |

## Known blockers
1. Authentication parity is incomplete: legacy login supports email/username/phone; Flutter currently does not preserve the complete legacy identifier behavior.
2. Registration behavior differs from legacy flow and needs parity review.
3. Supabase migration history does not yet fully reproduce the currently deployed schema.
4. Several deployed Edge Function dependencies are not fully represented in the repository.
5. Security advisor findings require remediation and regression testing.

## Rule
Implementation is not completion. A feature is complete only after behavior, authorization, data access, error states, and relevant tests have passed parity validation.
