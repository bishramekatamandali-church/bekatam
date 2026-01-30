#!/usr/bin/env bash
set -euo pipefail

PAGE="/var/www/Bekatam/frontend/src/pages/admin/ManageExpensesPage.tsx"
ts="$(date +%F_%H%M%S)"
cp -a "$PAGE" "$PAGE.bak.$ts"

# 1) Replace onSave -> onSubmit
perl -pi -e 's/\bonSave=\{handleSave\s+as\s+any\}/onSubmit={handleSave as any}/g' "$PAGE"

# 2) Remove mode prop (ContentFormModalProps doesn't have "mode")
perl -pi -e 's/\s*mode=\{editing\s*\?\s*'\''edit'\''\s*:\s*'\''add'\''\}\s*//g' "$PAGE"

echo "✅ Patched ContentFormModal props in ManageExpensesPage.tsx"
echo "Backup: $PAGE.bak.$ts"
