# RLS and Authorization Audit

Last audited: 2026-08-20

## Current result

All inspected public application tables have RLS enabled. Most have explicit policies for public reads, authenticated ownership, or admin operations.

## Tables with RLS enabled but no policy

- `app_settings`
- `email_outbox`
- `emailotp`

This currently means direct client access is denied by RLS. That is preferable to accidentally exposing these internal tables, but the application architecture must use controlled server-side functions for legitimate access where required.

## High-risk authorization functions

The current database contains `SECURITY DEFINER` functions including:

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

The inspected definitions use `SET search_path TO 'public'`, which is an important protection against search-path hijacking. However, exposure and EXECUTE privileges still need explicit review. `SECURITY DEFINER` alone must never be treated as authorization.

## Confirmed policy patterns

### Public content
Public content tables such as sermons, events, ministries, blog/news, history, key persons and media have public SELECT policies and admin-only mutation policies.

### User-owned data
Profiles, notifications, ministry membership/request records, comments, prayers and testimonials use owner/admin predicates where appropriate.

### Financial/admin data
Church members, collections, donations, donor details, expenses, meetings, decisions, fellowship scheduling and user-action workflow tables are admin-controlled.

### Contact messages
Public INSERT is permitted while SELECT/UPDATE/DELETE are admin-controlled. This is intentional but requires abuse/rate-limit review at the application boundary.

## Required remediation / verification

1. Explicitly review EXECUTE grants for all exposed SECURITY DEFINER functions.
2. Ensure privileged functions validate `auth.uid()` and role/ownership internally.
3. Keep internal tables such as `email_outbox` and `emailotp` inaccessible directly from Flutter.
4. Verify all admin operations independently of Flutter UI checks.
5. Test anonymous, authenticated-normal-user, and admin behavior for every sensitive domain.
6. Review permissive policies for unintended OR-combination access.
7. Optimize repeated `auth.uid()` evaluation after correctness is established.
8. Record all intentional public-read/public-insert policies in the feature parity documentation.

## No production changes

This audit is read-only. No RLS policy, function, privilege, or production data was changed by this audit.
