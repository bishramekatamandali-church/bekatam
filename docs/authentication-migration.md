# Authentication Migration Audit

## Legacy system
The React application stores a bearer token and current-user data client-side and calls the Node `/auth` endpoints. The Node implementation supports login by email, username, or phone and uses the legacy password-hash model.

## Target system
Flutter must use Supabase Auth for sessions and identity. Privileged operations must never depend on client-supplied role/identity fields as a security boundary.

## Identified parity gaps
- Legacy login accepts email, username, and phone. Flutter currently covers email and username through a Supabase function path but does not yet demonstrate equivalent phone login behavior.
- Legacy registration auto-generates a username from the user's name/email/phone. Flutter currently asks for a username, which is behaviorally different.
- Legacy registration includes country-code handling and profile-image support; Flutter requires explicit parity verification for these behaviors.
- Legacy password hashes must not be copied into Supabase Auth without a supported migration strategy.

## Required acceptance tests
- Email login succeeds for valid users.
- Username login succeeds for valid users.
- Phone login succeeds for valid users.
- Invalid credentials fail without leaking account existence unnecessarily.
- Session restoration works after application restart.
- Logout invalidates the local authenticated state.
- Registration reproduces required validation and profile behavior.
- Password reset and verification behavior are explicitly tested.
- Role/privilege enforcement is server-side through RLS/functions, not Flutter UI alone.

## Security rule
Never place service-role keys, database passwords, legacy password hashes, or other privileged secrets in the Flutter application.
