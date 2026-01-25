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

python3 - <<'PY'
import re
from pathlib import Path

front = Path("/var/www/Bekatam/frontend")
ctx = front / "src/contexts/ContentContext.tsx"
modal = front / "src/components/admin/ContentFormModal.tsx"
page = front / "src/pages/admin/ManageExpensesPage.tsx"

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def write(p: Path, s: str):
    p.write_text(s, encoding="utf-8")

# -----------------------------
# 1) ContentContext: ensure ExpenseRecords come from backend (not wiped)
# -----------------------------
s = read(ctx)

# (A) Make sure expenseRecords are fetched in the same batch fetch config
# We try to insert after donationRecords or collectionRecords config.
if "/api/expense-records" not in s:
    # Find a likely "contentConfigs" object area by anchoring around donationRecords/collectionRecords.
    # Insert a line in the same style: expenseRecords: { endpoint: "/api/expense-records", setter: setExpenseRecords },
    inserted = False

    # Strategy 1: after collectionRecords block
    pat1 = re.compile(r"(collectionRecords\s*:\s*\{\s*endpoint\s*:\s*['\"]\/api\/collection-records['\"][\s\S]*?\}\s*,\s*\n)", re.M)
    m1 = pat1.search(s)
    if m1:
        ins = m1.group(1) + "  expenseRecords: { endpoint: \"/api/expense-records\", setter: setExpenseRecords },\n"
        s = s[:m1.start(1)] + ins + s[m1.end(1):]
        inserted = True

    # Strategy 2: after donationRecords block
    if not inserted:
        pat2 = re.compile(r"(donationRecords\s*:\s*\{\s*endpoint\s*:\s*['\"]\/api\/donation-records['\"][\s\S]*?\}\s*,\s*\n)", re.M)
        m2 = pat2.search(s)
        if m2:
            ins = m2.group(1) + "  expenseRecords: { endpoint: \"/api/expense-records\", setter: setExpenseRecords },\n"
            s = s[:m2.start(1)] + ins + s[m2.end(1):]
            inserted = True

    if not inserted:
        raise SystemExit("ERROR: Could not find fetch batch config to insert expenseRecords. Please paste ContentContext.tsx fetch config section.")

# (B) Ensure addExpenseRecord uses API and returned DB record
# We patch a dedicated function if it exists; otherwise patch addContent case.
def patch_add_expense_record(src: str) -> str:
    # If there is a named function addExpenseRecord(...)
    m = re.search(r"const\s+addExpenseRecord\s*=\s*useCallback\([\s\S]*?\n\s*\);\s*", src, re.M)
    if m:
        block = m.group(0)
        # Replace entire function body safely (keep dependencies minimal by reusing existing helpers)
        new_block = re.sub(
            r"const\s+addExpenseRecord\s*=\s*useCallback\([\s\S]*?\n\s*\);\s*",
            """const addExpenseRecord = useCallback(async (data: any) => {
  try {
    const resp = await fetch(`${API_BASE_URL}/expense-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const created = await resp.json();
    setExpenseRecords(prev => [created, ...prev]);
    return created;
  } catch (err) {
    console.error("Error adding expense record:", err);
    return null;
  }
}, [getAuthHeaders, setExpenseRecords]);\n""",
            src,
            flags=re.M,
        )
        return new_block
    return src

s2 = patch_add_expense_record(s)

# If not patched and there is addContent switch with "expenseRecord", patch that case
if s2 == s:
    # Replace only the expenseRecord case block inside addContent switch
    # This is tolerant: finds `case "expenseRecord": { ... }` until next `case` at same indent.
    pat_case = re.compile(r'(case\s+["\']expenseRecord["\']\s*:\s*\{)([\s\S]*?)(\n\s*\}\s*)(?=\n\s*case\s+["\']|default\s*:)', re.M)
    mc = pat_case.search(s2)
    if mc:
        repl = mc.group(1) + """
        try {
          const resp = await fetch(`${API_BASE_URL}/expense-records`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(data),
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const created = await resp.json();
          setExpenseRecords(prev => [created, ...prev]);
          return created;
        } catch (err) {
          console.error("Error adding expense record:", err);
          return null;
        }
""" + mc.group(3)
        s2 = s2[:mc.start()] + repl + s2[mc.end():]

s = s2

# (C) Ensure updateContent/deleteContent endpoint maps include expenseRecord -> "expense-records"
def ensure_endpoint_map(src: str, fn_name: str) -> str:
    # Find an endpointMap object inside a function block
    # This is best-effort: add a missing line inside `{ ... }`.
    pat = re.compile(rf"(const\s+{fn_name}[\s\S]*?const\s+endpointMap\s*:\s*Record<ContentType,\s*string>\s*=\s*\{{)([\s\S]*?)(\n\s*\}};)", re.M)
    m = pat.search(src)
    if not m:
        return src
    body = m.group(2)
    if re.search(r"\bexpenseRecord\s*:\s*['\"]expense-records['\"]", body):
        return src
    # Insert near donationRecords/collectionRecords if present, else at end
    insert_line = "\n      expenseRecord: \"expense-records\","
    if "donationRecord" in body:
        body = re.sub(r'(\n\s*donationRecord\s*:\s*["\']donation-records["\']\s*,?)', r"\1"+insert_line, body, count=1)
    elif "collectionRecord" in body:
        body = re.sub(r'(\n\s*collectionRecord\s*:\s*["\']collection-records["\']\s*,?)', r"\1"+insert_line, body, count=1)
    else:
        body = body.rstrip() + insert_line
    return src[:m.start(2)] + body + src[m.end(2):]

s = ensure_endpoint_map(s, "updateContent")
s = ensure_endpoint_map(s, "deleteContent")

write(ctx, s)

# -----------------------------
# 2) Expense form: enforce dropdowns (category/status) with lists
# -----------------------------
m = read(modal)

# Ensure types import includes expenseCategoryList & expenseStatusList if it already imports from ../types or ../../types
# We will add to an existing import line that contains expenseCategoryList OR expenseStatusList or ExpenseRecordFormData.
def ensure_imports(src: str) -> str:
    # Find an import from "../types" or "../../types"
    imp_pat = re.compile(r"import\s*\{([\s\S]*?)\}\s*from\s*['\"]\.\.\/\.\.\/types['\"];|import\s*\{([\s\S]*?)\}\s*from\s*['\"]\.\.\/types['\"];", re.M)
    # We’ll do a simpler approach: if both names exist, nothing.
    if "expenseCategoryList" in src and "expenseStatusList" in src:
        return src

    # Try to patch the first import that brings in ExpenseRecordFormData or ExpenseRecord
    lines = src.splitlines(True)
    for i, line in enumerate(lines):
        if line.strip().startswith("import") and "from" in line and ("../types" in line or "../../types" in line) and "{" in line:
            # collect multi-line import
            j = i
            buf = [lines[j]]
            while "}" not in lines[j]:
                j += 1
                buf.append(lines[j])
            block = "".join(buf)
            if "../types" in block or "../../types" in block:
                # If this import seems to include expense-related types, patch it; else continue
                if ("Expense" in block) or ("expense" in block) or ("ContentType" in block):
                    inside = re.search(r"\{([\s\S]*?)\}", block).group(1)
                    items = [x.strip() for x in inside.split(",") if x.strip()]
                    if "expenseCategoryList" not in items:
                        items.append("expenseCategoryList")
                    if "expenseStatusList" not in items:
                        items.append("expenseStatusList")
                    new_inside = ", ".join(items)
                    new_block = re.sub(r"\{[\s\S]*?\}", "{ " + new_inside + " }", block)
                    lines[i:j+1] = [new_block]
                    return "".join(lines)
    return src

m = ensure_imports(m)

# Now enforce dropdowns in Expense form:
# We will patch in two common patterns:
#  - <input name="category" ...>
#  - renderInput("category"...)
# same for status.

def replace_input_with_select(src: str, field: str, list_name: str, label: str) -> str:
    # Replace renderInput("category", ...) with a select block
    src = re.sub(
        rf"renderInput\(\s*['\"]{field}['\"][\s\S]*?\)\s*",
        rf"""(
  <div>
    <label className="block text-xs font-medium text-slate-700">{label} <span className="text-red-500">*</span></label>
    <select
      name="{field}"
      value={(formData as any).{field} || {list_name}[0]}
      onChange={handleChange}
      className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
      required
    >
      {{{list_name}.map((v) => (
        <option key={v} value={v}>{v}</option>
      ))}}
    </select>
  </div>
)""",
        src,
        flags=re.M,
    )

    # Replace a raw <input ... name="field" ...> block if exists
    src = re.sub(
        rf"""<input[^>]*name=['"]{field}['"][\s\S]*?/>""",
        rf"""<select
      name="{field}"
      value={{(formData as any).{field} || {list_name}[0]}}
      onChange={{handleChange}}
      className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
      required
    >
      {{{list_name}.map((v) => (
        <option key={{v}} value={{v}}>{{v}}</option>
      ))}}
    </select>""",
        src,
        flags=re.M,
    )
    return src

m2 = replace_input_with_select(m, "category", "expenseCategoryList", "Category")
m2 = replace_input_with_select(m2, "status", "expenseStatusList", "Status")

# If nothing changed, we still keep file as-is; the DB fix is the critical part.
write(modal, m2)

# -----------------------------
# 3) White background on ManageExpensesPage (UI only)
# -----------------------------
p = read(page)
p = re.sub(r"\bbg-(?:gray|slate)-50\b", "bg-white", p)
p = re.sub(r"\bbg-(?:gray|slate)-100\b", "bg-white", p)
write(page, p)

print("Patched:")
print(" - ContentContext.tsx (expenseRecords now loaded/saved via DB API)")
print(" - ContentFormModal.tsx (expense category/status dropdowns best-effort)")
print(" - ManageExpensesPage.tsx (white background)")
PY

echo "✅ Done."
echo "Backups created with .bak.$ts"
