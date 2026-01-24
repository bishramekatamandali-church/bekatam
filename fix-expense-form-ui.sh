#!/usr/bin/env bash
set -euo pipefail

FILE="/var/www/Bekatam/frontend/src/components/admin/ContentFormModal.tsx"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found"
  exit 1
fi

cp -a "$FILE" "$FILE.bak.$(date +%F_%H%M%S)"

echo "==> 1) Ensure expenseCategoryList is imported from ../../types"
perl -0777 -pi -e '
  # If already present, do nothing
  if ($ARGV && do { local $/; open my $fh, "<", $ARGV; my $t=<$fh>; close $fh; $t =~ /expenseCategoryList/ }) { next; }

  # Insert expenseCategoryList near expenseStatusList in the import list
  s/(expenseStatusList,\s*\n\}\s*from\s*['\''"]\.\.\/\.\.\/types['\''"];\s*)/expenseStatusList,\n  expenseCategoryList,\n} from \x27..\/..\/types\x27;\n/s
' "$FILE"

echo "==> 2) Add missing optional fields to initialFormData for expenseRecord (UI only)"
perl -0777 -pi -e '
  s/expenseRecord:\s*\{\s*
        expenseDate:\s*new Date\(\)\.toISOString\(\)\.split\(\x27T\x27\)\[0\],\s*
        category:\s*\x27\x27,\s*
        description:\s*\x27\x27,\s*
        amount:\s*\x27\x27,\s*
        status:\s*expenseStatusList\[0\],\s*
      \}/expenseRecord: {\n        expenseDate: new Date().toISOString().split(\x27T\x27)[0],\n        category: \x27\x27,\n        description: \x27\x27,\n        amount: \x27\x27,\n        status: expenseStatusList[0],\n        paymentMethod: \x27\x27,\n        payeeVendorName: \x27\x27,\n        receiptImageUrl: \x27\x27,\n        notes: \x27\x27,\n      }/s
' "$FILE"

echo "==> 3) Add a dedicated expenseRecord UI block (selects + white backgrounds)"
perl -0777 -pi -e '
  # If we already added the case earlier, skip.
  if (do { local $/; open my $fh, "<", $ARGV; my $t=<$fh>; close $fh; $t =~ /case\s+\x27expenseRecord\x27/ }) { next; }

  s/\n(\s*)default:\s*\n/\n$1case \x27expenseRecord\x27:\n$1  return (\n$1    <div className=\"space-y-5\">\n$1      <div className=\"rounded-2xl border border-slate-200 bg-white p-5\">\n$1        <div className=\"mb-4\">\n$1          <h3 className=\"text-lg font-semibold text-slate-900\">Expense Record</h3>\n$1          <p className=\"text-sm text-slate-500\">Log expenses with proper category, status, and optional receipt.</p>\n$1        </div>\n\n$1        <div className=\"grid gap-4 md:grid-cols-2\">\n$1          {renderDateFieldWithBSPicker(\x27expenseDate\x27, \x27Expense Date\x27)}\n$1          <div>\n$1            <label className=\"block text-sm font-medium text-slate-700\">Category</label>\n$1            <select\n$1              value={(formData as any).category || \x27\x27}\n$1              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}\n$1              className=\"mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-teal-500 focus:ring-teal-500\"\n$1            >\n$1              <option value=\"\">Select a category</option>\n$1              {expenseCategoryList.map((c) => (\n$1                <option key={c} value={c}>{c}</option>\n$1              ))}\n$1            </select>\n$1          </div>\n$1        </div>\n\n$1        <div className=\"grid gap-4 md:grid-cols-2\">\n$1          <div>\n$1            <label className=\"block text-sm font-medium text-slate-700\">Amount (NPR)</label>\n$1            <input\n$1              type=\"number\"\n$1              min=\"0\"\n$1              step=\"any\"\n$1              value={(formData as any).amount || \x27\x27}\n$1              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}\n$1              className=\"mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-teal-500 focus:ring-teal-500\"\n$1              placeholder=\"0\"\n$1            />\n$1          </div>\n$1          <div>\n$1            <label className=\"block text-sm font-medium text-slate-700\">Status</label>\n$1            <select\n$1              value={(formData as any).status || expenseStatusList[0]}\n$1              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}\n$1              className=\"mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-teal-500 focus:ring-teal-500\"\n$1            >\n$1              {expenseStatusList.map((s) => (\n$1                <option key={s} value={s}>{s}</option>\n$1              ))}\n$1            </select>\n$1          </div>\n$1        </div>\n\n$1        <div>\n$1          <label className=\"block text-sm font-medium text-slate-700\">Description</label>\n$1          <textarea\n$1            value={(formData as any).description || \x27\x27}\n$1            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}\n$1            className=\"mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-teal-500 focus:ring-teal-500\"\n$1            rows={3}\n$1            placeholder=\"What was this expense for?\"\n$1          />\n$1        </div>\n\n$1        <div className=\"grid gap-4 md:grid-cols-2\">\n$1          <div>\n$1            <label className=\"block text-sm font-medium text-slate-700\">Payee / Vendor (optional)</label>\n$1            <input\n$1              type=\"text\"\n$1              value={(formData as any).payeeVendorName || \x27\x27}\n$1              onChange={(e) => setFormData(prev => ({ ...prev, payeeVendorName: e.target.value }))}\n$1              className=\"mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-teal-500 focus:ring-teal-500\"\n$1              placeholder=\"Vendor name\"\n$1            />\n$1          </div>\n$1          <div>\n$1            <label className=\"block text-sm font-medium text-slate-700\">Payment Method (optional)</label>\n$1            <select\n$1              value={(formData as any).paymentMethod || \x27\x27}\n$1              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}\n$1              className=\"mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-teal-500 focus:ring-teal-500\"\n$1            >\n$1              <option value=\"\">Select method</option>\n$1              {paymentMethodOptions.map((m) => (\n$1                <option key={m} value={m}>{m}</option>\n$1              ))}\n$1            </select>\n$1          </div>\n$1        </div>\n\n$1        <div className=\"rounded-2xl border border-slate-200 bg-white p-4\">\n$1          <div className=\"mb-2\">\n$1            <div className=\"text-sm font-semibold text-slate-900\">Receipt Image (optional)</div>\n$1            <div className=\"text-xs text-slate-500\">Upload a photo of the receipt for future reference.</div>\n$1          </div>\n$1          <AdvancedMediaUploader\n$1            label=\"Receipt\"\n$1            currentUrl={(formData as any).receiptImageUrl || \x27\x27}\n$1            onUploadComplete={(url) => setFormData(prev => ({ ...prev, receiptImageUrl: url }))}\n$1            onSimulateUpload={(file) => handleCloudinaryUpload(file, \x27receiptImageUrl\x27)}\n$1          />\n$1        </div>\n\n$1        <div>\n$1          <label className=\"block text-sm font-medium text-slate-700\">Notes (optional)</label>\n$1          <textarea\n$1            value={(formData as any).notes || \x27\x27}\n$1            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}\n$1            className=\"mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-teal-500 focus:ring-teal-500\"\n$1            rows={2}\n$1            placeholder=\"Any additional notes\"\n$1          />\n$1        </div>\n$1      </div>\n$1    </div>\n$1  );\n\n$1default:\n/s
' "$FILE"

echo "✅ Done. Expense form UI improved (category/status selects + white backgrounds)."
echo "Backup created: $FILE.bak.YYYY-MM-DD_HHMMSS"
