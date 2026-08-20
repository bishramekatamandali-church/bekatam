# Authentication and Function Security Audit

Last audited: 2026-08-20

## Findings

### Supabase Auth / profiles boundary
- Supabase Auth is the target identity/session provider.
- `profiles.id` is the application-side identity reference and must remain tied to `auth.users.id`.
- Role and account status must be evaluated server-side; Flutter UI checks are not an authorization boundary.

### SECURITY DEFINER functions
The target project currently has privileged `SECURITY DEFINER` functions including:
- `is_admin()`
- `financial_summary()`
- `approve_user_action()`
- `request_user_action()`
- `request_unblock()`
- `apply_user_action()`
- `notify_admins()`
- `queue_email()`
- `handle_new_user()`
- `trg_notify_admins_ministry_join()`

The audited privileged functions use `SET search_path TO 'public'`, which is a positive hardening measure.

### Current EXECUTE privileges
- `anon`: no execute on the privileged administrative/action functions audited.
- `authenticated`: execute is currently granted on `is_admin()`, `financial_summary()`, `approve_user_action()`, `request_user_action()`, and `request_unblock()`.
- `apply_user_action()`, `notify_admins()`, `queue_email()`, and related trigger/internal functions are not directly executable by `authenticated`.

This is materially safer than exposing all privileged helpers to the client, but the externally executable SECURITY DEFINER functions still require authorization and abuse-case testing.

## Required acceptance tests
1. Anonymous users cannot execute privileged administrative functions.
2. Normal authenticated users cannot invoke an admin-only action successfully.
3. Admin users can perform only the intended administrative actions.
4. `financial_summary()` cannot expose financial information to non-admins.
5. `request_unblock()` can only create a request for the caller's own blocked account.
6. `request_user_action()` cannot be used by a non-admin or to perform unsupported action types.
7. `approve_user_action()` enforces admin status and prevents self-approval.
8. No SECURITY DEFINER function can be abused through search-path manipulation or caller-controlled object resolution.
9. Auth/session restoration, logout, password reset, verification, and blocked/deleted account behavior are tested in Flutter.
10. No service-role key, database password, legacy password hash, or other privileged secret is present in Flutter source/build artifacts.

## Decision
Do not revoke `authenticated` execution from `is_admin()` blindly: it is used by RLS policies and changing its privilege without first redesigning anonymous/public policies could break public reads. Remediation must be performed as a coordinated policy/function change with regression tests.

## Migration status
Authentication/security audit: IN PROGRESS.
No production legacy system was modified.
