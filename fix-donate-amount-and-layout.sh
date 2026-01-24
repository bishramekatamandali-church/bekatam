#!/usr/bin/env bash
set -euo pipefail

FRONT="/var/www/Bekatam/frontend"
SRC="$FRONT/src"
DONATE="$SRC/pages/DonatePage.tsx"

if [ ! -f "$DONATE" ]; then
  echo "ERROR: $DONATE not found"
  exit 1
fi

cp -a "$DONATE" "$DONATE.bak.$(date +%F_%H%M%S)"

# -------------------------------------------------------------------
# 1) Make Donate desktop single-column:
#    Replace common 2-column grid patterns with 1-column.
# -------------------------------------------------------------------
perl -0777 -pi -e '
  # Pattern A: lg:grid-cols-2 / lg:grid-cols-[...]
  $s =~ s/className="([^"]*?)\bgrid\b([^"]*?)\blg:grid-cols-2\b([^"]*?)"/className="$1flex flex-col gap-8$2$3"/g;
  $s =~ s/className="([^"]*?)\bgrid\b([^"]*?)\blg:grid-cols-\[[^"]+\]\b([^"]*?)"/className="$1flex flex-col gap-8$2$3"/g;

  # Pattern B: any "grid ... lg:grid-cols-..." (generic)
  $s =~ s/className="([^"]*?)\bgrid\b([^"]*?)\blg:grid-cols-[0-9]+\b([^"]*?)"/className="$1flex flex-col gap-8$2$3"/g;

  # Keep container sane on desktop
  $s =~ s/\bmax-w-6xl\b/max-w-3xl/g;
' -i "$DONATE"

# -------------------------------------------------------------------
# 2) Ensure recordData.amount is a NUMBER before POST
#    This catches typical patterns: amount: amount, amount: form.amount, etc.
# -------------------------------------------------------------------
perl -0777 -pi -e '
  # If recordData object contains "amount:" we wrap the value into Number(...)
  $s =~ s/(amount\s*:\s*)([^,\n}]+)/$1Number($2)/g;
' -i "$DONATE"

# -------------------------------------------------------------------
# 3) Make all UI tolerant: replace ".amount.toFixed(" with safe Number(...)
#    across the entire frontend src (donate modal, admin tables, etc.)
# -------------------------------------------------------------------
find "$SRC" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 perl -pi -e '
  s/(\b[\w$.()]+\b)\.amount\.toFixed\(/Number($1.amount ?? 0).toFixed(/g;
'

echo "✅ Patched DonatePage layout + amount number casting + safe toFixed usage."
echo "Backup: $DONATE.bak.YYYY-MM-DD_HHMMSS"
