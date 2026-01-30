#!/usr/bin/env bash
set -euo pipefail

FRONT="/var/www/Bekatam/frontend"
CTX="$FRONT/src/contexts/ContentContext.tsx"
MODAL="$FRONT/src/components/admin/ContentFormModal.tsx"
PAGE="$FRONT/src/pages/admin/ManageExpensesPage.tsx"

ts="$(date +%F_%H%M%S)"
for f in "$CTX" "$MODAL" "$PAGE"; do
  [ -f "$f" ] || { echo "ERROR: missing $f"; exit 1; }
  cp -a "$f" "$f.bak.$ts"
done

echo "==> 1) ContentContext: fetch expense records from backend + save/update/delete via API"

# 1a) Add expenseRecords into fetchContentBatch config (so refresh loads from DB)
perl -0777 -pi -e '
  if ($ARGV =~ /ContentContext\.tsx$/) {
    # Insert expenseRecords config near other configs if not present
    if ($_ !~ /expenseRecords:\s*\{\s*endpoint:\s*[\"\047]\/api\/expense-records[\"\047]/s) {
      s/(collectionRecords:\s*\{\s*endpoint:\s*[\"\047]\/api\/collection-records[\"\047][\s\S]*?\},\s*\n)/$1  expenseRecords: { endpoint: "\/api\/expense-records", setter: setExpenseRecords },\n/s
        or s/(donationRecords:\s*\{\s*endpoint:\s*[\"\047]\/api\/donation-records[\"\047][\s\S]*?\},\s*\n)/$1  expenseRecords: { endpoint: "\/api\/expense-records", setter: setExpenseRecords },\n/s;
    }
  }
' "$CTX"

# 1b) In addContent(): make expenseRecord use POST /api/expense-records (DB)
perl -0777 -pi -e '
  if ($ARGV =~ /ContentContext\.tsx$/) {
    s/case\s+[\"\047]expenseRecord[\"\047]\s*:\s*\{[\s\S]*?\n\s*break;\n\s*\}/case "expenseRecord": {\n        try {\n          const resp = await fetch(`${API_BASE_URL}\/expense-records`, {\n            method: \"POST\",\n            headers: { \"Content-Type\": \"application\/json\", ...getAuthHeaders() },\n            body: JSON.stringify(data),\n          });\n          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);\n          const created = await resp.json();\n          setExpenseRecords(prev => [created, ...prev]);\n          return created;\n        } catch (err) {\n          console.error(\"Error adding expense record:\", err);\n          return null;\n        }\n      }/s;
  }
' "$CTX"

# 1c) In updateContent(): add endpoint mapping for expenseRecord
perl -0777 -pi -e '
  if ($ARGV =~ /ContentContext\.tsx$/) {
    # Find endpoint map inside updateContent and add expenseRecord if missing
    s/(const\s+endpointMap\s*:\s*Record<ContentType,\s*string>\s*=\s*\{\s*[\s\S]*?)(\n\s*\};)/$1\n      expenseRecord: \"expense-records\",$2/s
      if ($_ !~ /expenseRecord:\s*[\"\047]expense-records[\"\047]/s);
  }
' "$CTX"

# 1d) In deleteContent(): add endpoint mapping for expenseRecord
perl -0777 -pi -e '
  if ($ARGV =~ /ContentContext\.tsx$/) {
    s/(const\s+endpointMap\s*:\s*Record<ContentType,\s*string>\s*=\s*\{\s*[\s\S]*?)(\n\s*\};)/$1\n      expenseRecord: \"expense-records\",$2/s
      if ($_ =~ /const\s+deleteContent\s*=\s*useCallback/s && $_ !~ /expenseRecord:\s*[\"\047]expense-records[\"\047]/s);
  }
' "$CTX"

echo "==> 2) ContentFormModal: enforce dropdowns for Expense category & status (and keep UI clean)"

# Insert an explicit expenseRecord form right before the switch default:
perl -0777 -pi -e '
  if ($ARGV =~ /ContentFormModal\.tsx$/) {
    if ($_ !~ /case\s+[\"\047]expenseRecord[\"\047]\s*:/s) {
      s/\n\s*default:\s*/\n\n      case \"expenseRecord\":\n        return (\n          <div className=\"space-y-5 bg-white\">\n            <FormSection title=\"Expense Details\" className=\"bg-white\">\n              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n                {renderInput(\"title\", \"Title\", \"text\", true)}\n                {renderInput(\"date\", \"Date\", \"date\", true)}\n\n                <div>\n                  <label className=\"block text-sm font-medium text-slate-700\">Category <span className=\"text-red-500\">*</span></label>\n                  <select\n                    name=\"category\"\n                    value={(formData as any).category || expenseCategoriesList[0]}\n                    onChange={handleChange}\n                    className=\"mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500\"\n                    required\n                  >\n                    {expenseCategoriesList.map((c) => (\n                      <option key={c} value={c}>{c}<\/option>\n                    ))}\n                  <\/select>\n                <\/div>\n\n                <div>\n                  <label className=\"block text-sm font-medium text-slate-700\">Status <span className=\"text-red-500\">*</span></label>\n                  <select\n                    name=\"status\"\n                    value={(formData as any).status || expenseStatusList[0]}\n                    onChange={handleChange}\n                    className=\"mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500\"\n                    required\n                  >\n                    {expenseStatusList.map((s) => (\n                      <option key={s} value={s}>{s}<\/option>\n                    ))}\n                  <\/select>\n                <\/div>\n\n                {renderInput(\"amount\", \"Amount (NPR)\", \"number\", true)}\n                {renderInput(\"vendor\", \"Vendor (Optional)\", \"text\", false)}\n              <\/div>\n\n              {renderTextArea(\"description\", \"Description (Optional)\")}\n            <\/FormSection>\n          <\/div>\n        );\n\n      default:\n/s;
    }
  }
' "$MODAL"

echo "==> 3) ManageExpensesPage: force white background (UI only)"
perl -pi -e 's/bg-gray-50|bg-slate-50/bg-white/g' "$PAGE"

echo "✅ Done."
echo "Backups:"
echo " - $CTX.bak.$ts"
echo " - $MODAL.bak.$ts"
echo " - $PAGE.bak.$ts"
