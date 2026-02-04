// frontend/src/pages/admin/ManageDecisionsPage.tsx

import React, { useMemo, useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { ActionItemStatus, DecisionLog, DecisionLogFormData, DecisionLogStatus, GenericContentFormData } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import { downloadBackendPdf } from '../../utils/downloadBackendPdf';
import * as XLSX from 'xlsx';
import { PlusIcon as HeroPlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const PlusIcon = ({ className }) => <HeroPlusIcon className={className} />;
const ViewGridIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
const ViewListIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const getDecisionStatusColorClassName = (status) => {
  switch (status) {
    case 'Approved': return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-700/30';
    case 'Implemented': return 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-700/30';
    case 'Proposed': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-700/30';
    case 'Rejected': return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-700/30';
    case 'Cancelled': return 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-700/50';
    case 'Follow-up Required': return 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-700/30';
    case 'Postponed': return 'text-indigo-700 bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-700/30';
    default: return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50';
  }
};

const getActionItemStatusColor = (status) => {
  switch (status) {
    case 'Completed': return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-700/30';
    case 'In Progress': return 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-700/30';
    case 'Pending': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-700/30';
    case 'Cancelled': return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-700/30';
    default: return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50';
  }
};

const ManageDecisionsPage = () => {
  const { decisionLogs, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<DecisionLog | null>(null);

  const safeFilenamePiece = (value: unknown) =>
    String(value ?? '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w\-]+/g, '_');

  const filteredDecisions = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return decisionLogs
      .filter((decision) => (
        decision.title?.toLowerCase().includes(query)
        || decision.description?.toLowerCase().includes(query)
        || decision.madeBy?.toLowerCase().includes(query)
      ))
      .sort((a, b) => new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime());
  }, [decisionLogs, searchTerm]);

  const handleOpenModal = (decision?: DecisionLog) => {
    setEditingDecision(decision || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDecision(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingDecision) {
      await updateContent('decisionLog', editingDecision.id, data as DecisionLogFormData);
    } else {
      await addContent('decisionLog', data as DecisionLogFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this decision log? This action cannot be undone.')) {
      await deleteContent('decisionLog', id);
    }
  };

  const downloadDecisionPdf = async (decision: DecisionLog) => {
    const safeTitle = safeFilenamePiece(decision.title || 'Decision');
    const shortId = String(decision.id || '').slice(0, 6) || 'id';
    await downloadBackendPdf(`/api/pdfs/decisions/${decision.id}`, `Decision_${safeTitle}_${shortId}.pdf`);
  };

  const downloadAllDecisionsExcel = () => {
    const data = [
      ["ID", "Decision Date", "Title", "Description", "Made By", "Status", "Follow-up Actions", "Posted By Admin ID", "Posted By Admin Name", "Created At", "Updated At"],
      ...filteredDecisions.map((log) => [
        log.id,
        log.decisionDate ? new Date(log.decisionDate).toLocaleDateString('en-CA') : '',
        log.title,
        log.description,
        log.madeBy,
        log.status || 'N/A',
        (log.followUpActions || []).map((item) => `${item.description} (Assigned: ${item.assignedTo || 'N/A'}, Due: ${item.dueDate || 'N/A'}, Status: ${item.status})`).join('; '),
        log.postedByAdminId || '',
        log.postedByAdminName || '',
        log.createdAt ? new Date(log.createdAt).toISOString() : '',
        log.updatedAt ? new Date(log.updatedAt).toISOString() : ''
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Decision Logs");
    XLSX.writeFile(wb, "bem_decision_logs.xlsx");
  };

  const renderDecisionCard = (decision: DecisionLog) => (
    <Card key={decision.id} className="flex flex-col dark:bg-slate-800">
      <CardHeader className="dark:border-slate-700 pb-3">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-100 flex-grow mr-2" title={decision.title}>{decision.title}</h2>
          {decision.status && (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getDecisionStatusColorClassName(decision.status)}`}>
              {decision.status}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400">Date: {formatDateADBS(decision.decisionDate)} | By: {decision.madeBy}</p>
      </CardHeader>
      <CardContent className="text-sm text-gray-600 dark:text-slate-300 space-y-1 flex-grow pt-2 pb-3">
        <p className="line-clamp-3" title={decision.description}>{decision.description}</p>
        {((decision.followUpActions || []).length > 0) && (
          <details className="text-xs mt-2">
            <summary className="cursor-pointer font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">Follow-up Actions ({decision.followUpActions?.length})</summary>
            <ul className="mt-1 space-y-1 bg-gray-50 dark:bg-slate-700 p-2 rounded max-h-28 overflow-y-auto">
              {(decision.followUpActions || []).map((item) => (
                <li key={item.id} className="border-b border-gray-200 dark:border-slate-600 last:border-b-0 pb-1 mb-1">
                  <p className="truncate font-medium text-slate-700 dark:text-slate-200" title={item.description}>{item.description}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="font-semibold">{item.assignedTo || 'Unassigned'}</span>
                    {item.dueDate && ` - Due: ${formatDateADBS(item.dueDate)}`}
                  </p>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full inline-block mt-0.5 ${getActionItemStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button size="sm" onClick={() => downloadDecisionPdf(decision)}>PDF</Button>
        <Button size="sm" onClick={() => handleOpenModal(decision)}>Edit</Button>
        <Button size="sm" variant="destructive" onClick={() => handleDelete(decision.id)}>Delete</Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Decision Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">Record, view, edit, and manage key church decisions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => handleOpenModal()} variant="primary">
            <PlusIcon className="h-5 w-5 mr-2" /> Add Decision Log
          </Button>
          <Button onClick={downloadAllDecisionsExcel}>
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Download Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search decision logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500"
        />
        <div className="flex gap-2">
          <Button variant={viewMode === 'card' ? 'primary' : 'outline'} onClick={() => setViewMode('card')}>
            <ViewGridIcon className="h-5 w-5" />
          </Button>
          <Button variant={viewMode === 'list' ? 'primary' : 'outline'} onClick={() => setViewMode('list')}>
            <ViewListIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {loadingContent ? (
        <p className="text-center">Loading decision logs...</p>
      ) : filteredDecisions.length === 0 ? (
        <p className="text-center text-gray-500">
          {searchTerm ? `No matches for "${searchTerm}"` : "No decision logs found"}
        </p>
      ) : viewMode === 'card' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDecisions.map(renderDecisionCard)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Made By</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
          {filteredDecisions.map((decision) => (
            <tr key={decision.id}>
              <td className="px-6 py-4">{decision.title}</td>
              <td className="px-6 py-4">{formatDateADBS(decision.decisionDate)}</td>
              <td className="px-6 py-4">{decision.madeBy}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded ${getDecisionStatusColorClassName(decision.status)}`}>
                  {decision.status || 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                <Button size="sm" onClick={() => downloadDecisionPdf(decision)}>PDF</Button>
                <Button size="sm" onClick={() => handleOpenModal(decision)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(decision.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

  {isModalOpen && (
    <ContentFormModal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      onSubmit={handleSubmit}
      contentType="decisionLog"
      initialData={editingDecision}
      isLoading={loadingContent}
    />
  )}
    </div>
  );
};

export default ManageDecisionsPage;
