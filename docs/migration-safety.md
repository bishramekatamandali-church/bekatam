# Migration Safety Contract

## Production system
The existing React + Node.js + MySQL application is the production reference system.

## Forbidden until explicit cutover approval
- destructive MySQL schema/data changes
- stopping or replacing production Node processes
- changing production React behavior
- changing VPS/Nginx/Apache/PM2 configuration
- changing production ports, DNS, SSL, or domain routing
- replacing the production web root
- overwriting production environment files
- destructive git operations affecting unrelated work

## Parallel target
The Flutter + Supabase application is developed and validated independently. Supabase is not treated as the production source of truth for the legacy application during migration.

## Completion gate
No production cutover is implied by implementation, tests, or commits. Cutover requires a separate approved plan and explicit authorization.
