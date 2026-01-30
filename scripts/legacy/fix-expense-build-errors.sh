#!/usr/bin/env bash
set -euo pipefail

FRONT="/var/www/Bekatam/frontend"
MODAL="$FRONT/src/components/admin/ContentFormModal.tsx"
PAGE="$FRONT/src/pages/admin/ManageExpensesPage.tsx"

ts="$(date +%F_%H%M%S)"
for f in "$MODAL" "$PAGE"; do
  [ -f "$f" ] || { echo "ERROR: missing $f"; exit 1; }
  cp -a "$f" "$f.bak.$ts"
done

echo "==> Fix 1: ContentFormModal.tsx uses correct list name from types.ts (expenseCategoriesList)"
# fix import name
perl -pi -e 's/\bexpenseCategoryList\b/expenseCategoriesList/g' "$MODAL"

echo "==> Fix 2: ManageExpensesPage.tsx imports API_BASE_URL from utils/apiConfig (correct location)"
# If it imports from ContentContext, replace it
perl -pi -e "s/from\\s+['\\\"]\\.\\.\\/\\.\\.\\/contexts\\/ContentContext['\\\"];?/from '..\\/..\\/utils\\/apiConfig';/g" "$PAGE"

# If it doesn't import API_BASE_URL at all (or still wrong), ensure correct import exists
if ! grep -q "API_BASE_URL" "$PAGE"; then
  # Add right after React import (safe)
  perl -0777 -pi -e "s/(import\\s+React[^\n]*\\n)/\$1import { API_BASE_URL } from '..\\/..\\/utils\\/apiConfig';\\n/" "$PAGE"
fi

echo "✅ Done. Backups created with .bak.$ts"
