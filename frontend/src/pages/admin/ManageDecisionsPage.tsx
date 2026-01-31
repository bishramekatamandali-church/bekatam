// frontend/src/pages/admin/ManageDecisionsPage.tsx

import React, { useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { DecisionLog, DecisionLogStatus, ActionItemStatus } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import { jsPDF } from 'jspdf';
import { preparePdfDoc, setPdfFont } from '../../utils/pdfFonts';
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
  const { content: decisions = [], loading: loadingContent } = useContent();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);

  const filteredDecisions = decisions.filter(d =>
    d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (decision = null) => {
    setEditingContent(decision);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    console.log('Delete decision:', id);
    // Add actual delete logic here
  };

  const generateDecisionPdf = async (decision) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const fontState = await preparePdfDoc(doc);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    setPdfFont(doc, fontState, 'bold');
    doc.setFontSize(16);
    doc.text("BEM Church", pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
    setPdfFont(doc, fontState, 'normal');
    doc.setFontSize(14);
    doc.text("Decision Record", pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    setPdfFont(doc, fontState, 'bold');
    doc.setFontSize(12);
    doc.text(decision.title || 'N/A', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    const addDetail = (label, value) => {
      if (!value) return;
      setPdfFont(doc, fontState, 'bold');
      doc.text(`${label}: `, margin, yPos);
      setPdfFont(doc, fontState, 'normal');
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.text(value, margin + labelWidth, yPos);
      yPos += 6;
    };

    addDetail('Decision Date', formatDateADBS(decision.decisionDate));
    addDetail('Made By', decision.madeBy);
    addDetail('Status', decision.status);
    addDetail('Description', decision.description);
    addDetail('Recorded By', decision.postedByAdminName);
    if (decision.createdAt) addDetail('Created At', formatTimestampADBS(decision.createdAt));

    doc.save(`Decision_${(decision.title || 'Log').replace(/\s+/g, '_')}.pdf`);
  };

  const downloadAllDecisionsExcel = () => {
    const data = [
      ["ID", "Title", "Date", "Made By", "Status", "Description"],
      ...filteredDecisions.map(d => [
        d.id,
        d.title,
        formatDateADBS(d.decisionDate),
        d.madeBy,
        d.status || 'N/A',
        d.description
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Decisions");
    XLSX.writeFile(wb, "decision_logs.xlsx");
  };

  const renderDecisionCard = (decision) => (
    <Card key={decision.id} className="mb-4">
      <CardHeader>{decision.title}</CardHeader>
      <CardContent>
        <span className={`px-2 py-1 rounded ${getDecisionStatusColorClassName(decision.status)}`}>
          {decision.status || 'N/A'}
        </span>
        <p className="mt-2">Date: {formatDateADBS(decision.decisionDate)} | By: {decision.madeBy}</p>
        <p className="mt-2">{decision.description}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button size="sm" onClick={() => generateDecisionPdf(decision)}>PDF</Button>
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
                    <Button size="sm" onClick={() => generateDecisionPdf(decision)}>PDF</Button>
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
          onClose={() => setIsModalOpen(false)}
          initialData={editingContent}
          type="decision"
        />
      )}
    </div>
  );
};

export default ManageDecisionsPage; 
