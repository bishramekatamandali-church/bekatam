#!/usr/bin/env bash
set -euo pipefail

FILE="/var/www/Bekatam/frontend/src/pages/DonatePage.tsx"
cp -a "$FILE" "$FILE.bak.$(date +%F_%H%M%S)"

# 1) Force the main donate layout to single column
perl -pi -e 's/max-w-6xl mx-auto grid gap-6 lg:grid-cols-\[1\.1fr_0\.9fr\] items-start/max-w-3xl mx-auto flex flex-col gap-6 items-stretch/g' "$FILE"

# 2) Reduce header height about ~35% (reduce paddings)
perl -pi -e 's/py-16 sm:py-24 lg:py-28/py-10 sm:py-16 lg:py-18/g' "$FILE"

echo "✅ Donate page patched: single column + shorter header."
