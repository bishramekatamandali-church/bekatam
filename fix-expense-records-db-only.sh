#!/usr/bin/env bash
set -euo pipefail

CTX="/var/www/Bekatam/frontend/src/contexts/ContentContext.tsx"

ts="$(date +%F_%H%M%S)"
[ -f "$CTX" ] || { echo "ERROR: missing $CTX"; exit 1; }
cp -a "$CTX" "$CTX.bak.$ts"

echo "==> 1) Stop hydrating expenseRecords from localStorage (so refresh won't wipe/override DB)"

# Replace expenseRecords init from localStorage -> empty array
perl -pi -e 's/const \[expenseRecords, setExpenseRecords\] = useState<ExpenseRecord\[]>\(\(\) => getStoredData<ExpenseRecord>\x28\x27bem_expenseRecords\x27, \[\]\x29\);/const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);/g' "$CTX"

# Remove "saveStoredData('bem_expenseRecords', expenseRecords);" line if present
perl -pi -e "s/^\\s*saveStoredData\\('bem_expenseRecords', expenseRecords\\);\\s*\\n//mg" "$CTX"

echo "==> 2) Ensure expenseRecords is included in the live contentRef (used by polling/refresh logic)"
# Add expenseRecords into contentRef object if missing
perl -0777 -pi -e '
  if ($_ !~ /expenseRecords:\s*expenseRecords/) {
    s/(collectionRecords:\s*collectionRecords,\s*\n)/$1      expenseRecords: expenseRecords,\n/s;
  }
' "$CTX"

echo "==> 3) Fetch expense-records from backend on load (so it syncs across devices)"
# Add config entry in contentFetchConfigs if missing.
# Use storageKey: "" so it will NOT be saved to localStorage.
perl -0777 -pi -e '
  if ($_ !~ /key:\s*\x27expense-records\x27/) {
    s/(\{\s*key:\s*\x27donation-records\x27[\s\S]*?\},\s*\n)/$1      { key: \x27expense-records\x27, setter: setExpenseRecords, storageKey: \x27\x27, getCurrent: () => contentRef.current.expenseRecords },\n/s;
  }
' "$CTX"

echo "==> 4) Make expenseRecord create/update/delete use DB API (/api/expense-records) only"

# Patch addContent expenseRecord case
perl -0777 -pi -e '
  s/case\s+\x27expenseRecord\x27:\s*\{\s*const\s+formData\s*=\s*data\s+as\s+ExpenseRecordFormData;\s*const\s+newItem\s*=\s*\{\s*id:\s*uuidv4\(\),[\s\S]*?setExpenseRecords\([^\)]*\);\s*saveStoredData\(\x27bem_expenseRecords\x27,\s*\[newItem,\s*\.\.\.expenseRecords\]\);\s*success\s*=\s*true;\s*break;\s*\}/case \x27expenseRecord\x27: {\n        try {\n          const resp = await fetch(`${API_BASE_URL}\/expense-records`, {\n            method: \"POST\",\n            headers: { \"Content-Type\": \"application\/json\", ...getAuthHeaders() },\n            credentials: \"include\",\n            body: JSON.stringify(data),\n          });\n          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);\n          const created = await resp.json();\n          setExpenseRecords(prev => [created, ...prev]);\n          success = true;\n        } catch (err) {\n          console.error(\"Error creating expense record:\", err);\n          success = false;\n        }\n        break;\n      }/s
' "$CTX"

# Patch updateContent expenseRecord case (it was local-only)
perl -0777 -pi -e '
  s/case\s+\x27expenseRecord\x27:\s*\{\s*success\s*=\s*updateAndLog<ExpenseRecord>\(setExpenseRecords\);\s*break;\s*\}/case \x27expenseRecord\x27: {\n        try {\n          const resp = await fetch(`${API_BASE_URL}\/expense-records\/${id}`, {\n            method: \"PUT\",\n            headers: { \"Content-Type\": \"application\/json\", ...getAuthHeaders() },\n            credentials: \"include\",\n            body: JSON.stringify(data),\n          });\n          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);\n          const updated = await resp.json();\n          setExpenseRecords(prev => prev.map(x => x.id === id ? updated : x));\n          success = true;\n        } catch (err) {\n          console.error(\"Error updating expense record:\", err);\n          success = false;\n        }\n        break;\n      }/s
' "$CTX"

# Patch deleteContent expenseRecord case (it was local-only)
perl -0777 -pi -e '
  s/case\s+\x27expenseRecord\x27:\s*\{\s*success\s*=\s*deleteAndLog<ExpenseRecord>\(setExpenseRecords\);\s*break;\s*\}/case \x27expenseRecord\x27: {\n        try {\n          const resp = await fetch(`${API_BASE_URL}\/expense-records\/${id}`, {\n            method: \"DELETE\",\n            headers: { ...getAuthHeaders() },\n            credentials: \"include\",\n          });\n          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);\n          setExpenseRecords(prev => prev.filter(x => x.id !== id));\n          success = true;\n        } catch (err) {\n          console.error(\"Error deleting expense record:\", err);\n          success = false;\n        }\n        break;\n      }/s
' "$CTX"

echo "✅ Done."
echo "Backup: $CTX.bak.$ts"
echo "Next: deploy script."
