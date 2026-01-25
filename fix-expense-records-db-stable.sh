#!/usr/bin/env bash
set -euo pipefail

FRONT="/var/www/Bekatam/frontend"
PAGE="$FRONT/src/pages/admin/ManageExpensesPage.tsx"
MODAL="$FRONT/src/components/admin/ContentFormModal.tsx"

ts="$(date +%F_%H%M%S)"
for f in "$PAGE" "$MODAL"; do
  [ -f "$f" ] || { echo "ERROR: missing $f"; exit 1; }
  cp -a "$f" "$f.bak.$ts"
done

echo "==> Patch 1/2: ManageExpensesPage.tsx (load/save expenses from DB via /api/expense-records)"
cat <<'TSX' > "$PAGE"
import React, { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import ContentFormModal from '../../components/admin/ContentFormModal';
import type { ExpenseRecord, ExpenseRecordFormData } from '../../types';
import { API_BASE_URL } from '../../contexts/ContentContext';

const jsonHeaders = () => ({
  'Content-Type': 'application/json',
});

async function apiGetExpenses(): Promise<ExpenseRecord[]> {
  const resp = await fetch(`${API_BASE_URL}/expense-records`, { method: 'GET' });
  if (!resp.ok) throw new Error(`GET /expense-records failed: HTTP ${resp.status}`);
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

async function apiCreateExpense(payload: ExpenseRecordFormData): Promise<ExpenseRecord> {
  const resp = await fetch(`${API_BASE_URL}/expense-records`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`POST /expense-records failed: HTTP ${resp.status}`);
  return await resp.json();
}

async function apiUpdateExpense(id: string, payload: ExpenseRecordFormData): Promise<ExpenseRecord> {
  const resp = await fetch(`${API_BASE_URL}/expense-records/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`PUT /expense-records/${id} failed: HTTP ${resp.status}`);
  return await resp.json();
}

async function apiDeleteExpense(id: string): Promise<void> {
  const resp = await fetch(`${API_BASE_URL}/expense-records/${id}`, { method: 'DELETE' });
  if (!resp.ok && resp.status !== 204) throw new Error(`DELETE /expense-records/${id} failed: HTTP ${resp.status}`);
}

const ManageExpensesPage: React.FC = () => {
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRecord | null>(null);

  // Load from DB on page open (stable across devices)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setPageError('');
      try {
        const data = await apiGetExpenses();
        if (alive) setExpenseRecords(data);
      } catch (e: any) {
        if (alive) setPageError(e?.message || 'Failed to load expense records.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const total = useMemo(() => {
    return expenseRecords.reduce((sum, r: any) => sum + Number(r?.amount ?? 0), 0);
  }, [expenseRecords]);

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (record: ExpenseRecord) => {
    setEditing(record);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleSave = async (formData: ExpenseRecordFormData) => {
    // Only expense record behavior — no other features touched
    setPageError('');
    try {
      if (editing?.id) {
        const updated = await apiUpdateExpense(editing.id, formData);
        setExpenseRecords(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      } else {
        const created = await apiCreateExpense(formData);
        setExpenseRecords(prev => [created, ...prev]);
      }
      closeModal();
    } catch (e: any) {
      setPageError(e?.message || 'Failed to save expense record.');
    }
  };

  const handleDelete = async (id: string) => {
    setPageError('');
    try {
      await apiDeleteExpense(id);
      setExpenseRecords(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      setPageError(e?.message || 'Failed to delete expense record.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Expense Records</h1>
            <p className="text-sm text-slate-600">Stable (database-backed) expense tracking.</p>
          </div>
          <Button variant="primary" onClick={openCreate}>Add Expense</Button>
        </div>

        {pageError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <Card className="bg-white border border-slate-200 shadow-sm mb-6">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-sm text-slate-700">
              <span className="font-semibold">Total:</span> NPR {Number(total).toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">
              Records: {expenseRecords.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">All Expenses</h2>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-slate-600">Loading...</div>
            ) : expenseRecords.length === 0 ? (
              <div className="p-6 text-sm text-slate-600">No expense records yet.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {expenseRecords.map((r: any) => (
                  <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate">{r.description || 'Expense'}</p>
                        {r.category && (
                          <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                            {String(r.category).replace(/_/g, ' ')}
                          </span>
                        )}
                        {r.status && (
                          <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                            {String(r.status).replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {r.expenseDate ? new Date(r.expenseDate).toLocaleDateString() : ''}
                        {r.payee ? ` • Payee: ${r.payee}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3">
                      <div className="text-sm font-semibold text-slate-900">
                        NPR {Number(r.amount ?? 0).toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ContentFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          contentType="expenseRecord"
          mode={editing ? 'edit' : 'add'}
          initialData={editing ?? undefined}
          onSave={handleSave as any}
        />
      </div>
    </div>
  );
};

export default ManageExpensesPage;
TSX

echo "==> Patch 2/2: ContentFormModal.tsx (ExpenseRecord: Category & Status dropdowns)"
python3 - <<'PY'
from pathlib import Path

path = Path("/var/www/Bekatam/frontend/src/components/admin/ContentFormModal.tsx")
s = path.read_text(encoding="utf-8")

# If expenseRecord case already exists, do nothing.
if "case 'expenseRecord':" in s or 'case "expenseRecord":' in s:
    path.write_text(s, encoding="utf-8")
    print("ContentFormModal already has expenseRecord case. Skipped insert.")
    raise SystemExit(0)

# We insert a new case block just before "default:" in the big switch(contentType)
marker = "\n      default:\n"
if marker not in s:
    raise SystemExit("ERROR: Could not find switch(contentType) default marker in ContentFormModal.tsx")

insert = """
      case 'expenseRecord':
        return (
          <div className="space-y-4 bg-white">
            <FormSection title="Expense Details" subtitle="Keep expense logs consistent and clear.">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Expense Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expenseDate"
                    value={(formData as any).expenseDate || ''}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Amount (NPR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={(formData as any).amount ?? ''}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="any"
                    className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={(formData as any).description || ''}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., Sound system repair, chairs purchase..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={(formData as any).category || expenseCategoryList?.[0] || ''}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  >
                    {(expenseCategoryList || []).map((c: any) => (
                      <option key={c} value={c}>{String(c).replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={(formData as any).status || expenseStatusList?.[0] || ''}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  >
                    {(expenseStatusList || []).map((st: any) => (
                      <option key={st} value={st}>{String(st).replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Payee (optional)
                  </label>
                  <input
                    type="text"
                    name="payee"
                    value={(formData as any).payee || ''}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Who was paid?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Transaction Reference (optional)
                  </label>
                  <input
                    type="text"
                    name="transactionReference"
                    value={(formData as any).transactionReference || ''}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Voucher / bill / reference"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  value={(formData as any).notes || ''}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                  rows={3}
                />
              </div>
            </FormSection>
          </div>
        );
"""

s = s.replace(marker, insert + marker)
path.write_text(s, encoding="utf-8")
print("Inserted expenseRecord form UI (dropdowns for category/status).")
PY

echo "✅ Expense Records patch applied."
echo "Backups:"
echo " - $PAGE.bak.$ts"
echo " - $MODAL.bak.$ts"
