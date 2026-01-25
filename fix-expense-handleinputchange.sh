#!/usr/bin/env bash
set -euo pipefail

FILE="/var/www/Bekatam/frontend/src/components/admin/ContentFormModal.tsx"
ts="$(date +%F_%H%M%S)"

[ -f "$FILE" ] || { echo "ERROR: missing $FILE"; exit 1; }
cp -a "$FILE" "$FILE.bak.$ts"

# If handleInputChange is referenced but not defined, create it as an alias to handleChange.
# We insert right after the first "const handleChange =" occurrence.
if grep -q "handleInputChange" "$FILE"; then
  if ! grep -q "const handleInputChange" "$FILE"; then
    if grep -q "const handleChange" "$FILE"; then
      perl -0777 -pi -e '
        s/(const\s+handleChange\s*=\s*\([^\)]*\)\s*=>\s*\{[\s\S]*?\}\s*;)/$1\n\n  const handleInputChange = handleChange;\n/s
      ' "$FILE"
      echo "Inserted: const handleInputChange = handleChange;"
    else
      echo "ERROR: handleChange not found in ContentFormModal.tsx (cannot safely create alias)."
      echo "Restore from backup: $FILE.bak.$ts"
      exit 1
    fi
  else
    echo "handleInputChange already defined. No change needed."
  fi
else
  echo "No handleInputChange reference found. No change needed."
fi

echo "✅ Done. Backup: $FILE.bak.$ts"
