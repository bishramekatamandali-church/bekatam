# Authentication Parity Implementation

Last updated: 2026-08-20

## Legacy behavior compared

The legacy Node authentication implementation supports:
- login by email, username, or phone
- username generation from email/name during registration
- country-code + phone persistence
- profile image URL during registration
- password confirmation at the UI level
- rejection of deleted accounts
- bcrypt-backed legacy password hashes

## Implemented in migration branch

### Login
- Flutter login now presents email, username, or phone as the identifier.
- Email uses Supabase Auth directly.
- Username and phone are resolved server-side by the `sign-in-identifier` Edge Function.
- The function does not return the resolved email to the client.
- Deleted profiles are rejected before a session is accepted.

### Registration
- Username is no longer required from the user. When omitted, Flutter derives a sanitized username from the email local-part and appends a numeric suffix when needed, matching the legacy strategy.
- Country code and phone are normalized and persisted separately/combined consistently with the target `profiles` model.
- Password confirmation is restored to the Flutter UI.
- Profile image selection is restored.
- Profile images are uploaded only when an authenticated session is available. When email confirmation prevents an immediate session, the implementation deliberately defers the image rather than creating an anonymous storage-write path.

### Password migration

Legacy bcrypt hashes must not be copied into Supabase Auth by direct database writes. Existing-user password migration remains a controlled migration task. Until that strategy is approved and tested, existing accounts should be migrated through a supported Supabase Auth flow rather than weakening password security.

## Verification requirements

- Email login
- Username login
- Phone login with stored international number
- Phone login with formatting whitespace/punctuation
- Invalid credentials
- Deleted account rejection
- Username collision suffixing
- Registration without username
- Registration with country code and phone
- Registration password mismatch
- Registration profile image with immediate session
- Registration with email confirmation
- Password reset
- Session restoration
- Logout
- Admin login logging

## Safety

Changes are isolated to `migration/auth-parity`. The legacy React/Node/MySQL production system and VPS deployment are untouched.
