# Legacy Password Migration Strategy

## Current state

The legacy Node backend stores bcrypt password hashes in the MySQL `user.password` / `passwordHash` fields. The target Supabase project currently has 17 `profiles` rows and 17 corresponding `auth.users` rows, so there are no currently observed target profiles without an Auth identity.

## Safe migration strategy

Do not copy legacy password hashes into `profiles` and do not ask users to weaken passwords.

Supabase Auth supports importing compatible bcrypt password hashes through the Auth admin user-creation path. The migration must therefore be performed as a controlled, one-off server-side operation using a service-role credential outside the Flutter client.

### Required mapping

For each legacy user:

1. Export the user identity and bcrypt hash through the approved production data-export process.
2. Match the legacy user to the target `profiles.id` / Auth identity mapping.
3. Create or update the corresponding Supabase Auth identity with the existing bcrypt hash when the hash format is supported.
4. Preserve the legacy email/phone verification state according to the actual legacy account state.
5. Preserve `profiles.role`, `account_status`, username, phone, country code, and profile metadata separately from Auth credentials.
6. Never write the password hash to Flutter, repository source, logs, or ordinary profile tables.
7. Perform the operation against a migration/staging environment first and validate login before any production Auth migration.

## Important constraint

The current connected Supabase project must not be treated as proof that all legacy production users have been migrated. The current count only describes the target project at audit time.

## Acceptance tests

- Every migrated user has exactly one intended Auth identity.
- Valid legacy passwords authenticate successfully through Supabase Auth.
- Invalid passwords are rejected.
- Deleted legacy accounts cannot authenticate.
- Username and phone login resolve to the same Auth identity as email login.
- No password hash is exposed to the Flutter client.
- No service-role credential is exposed to the Flutter client.
- Migration is idempotent and produces an auditable report.

## Rollback

The password migration must be reversible by disabling the new login path or restoring the pre-migration Auth state. It must not modify the legacy MySQL credentials or application during preparation.
