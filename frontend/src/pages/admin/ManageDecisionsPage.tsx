import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { DecisionLog, DecisionLogFormData, GenericContentFormData, DecisionLogStatus, decisionLogStatusList, ActionItemStatus } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { PlusIcon as HeroPlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';


const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const ViewGridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
);
const ViewListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
);


const getDecisionStatusColorClassName = (status?: DecisionLogStatus): string => {
    switch(status) {
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

const getActionItemStatusColor = (status: ActionItemStatus) => {
    switch(status) {
        case 'Completed': return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-700/30';
        case 'In Progress': return 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-700/30';
        case 'Pending': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-700/30';
        case 'Cancelled': return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-700/30';
        default: return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50';
    }
};

const NotoSansDevanagariBase64: string = "AAEAAAARAQAABAAQR0RFRgBsAmsAAEV0AAAABkdQT1O2B51VAAEVrAAAAGxHU1VC4spaYQAA+LAAAAA4T1MvMmpgKQQAAAFgAAAAYGNtYXABDQGXAAACDAAAAGxnbHlm/nK3EAAABWAAAAJgaGVhZBsAmsAAAADcAAAANmhoZWEH3gOFAAABJAAAACRobXR4DAAD/AAAAfQAAAAybG9jYQG8BIwAAARcAAAAMm1heHABGQCbAAABOAAAACBuYW1l406XlQAA+NgAAASxcG9zdBvYcFEAARMUAAAAOwABAAADUv9qAAMAAQAAAAAAAAAAAAAAAAAAAAABAAAD//3PAAEAAQAAAAoAAgAEAAMAAAAAAADUASQAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAAAAAQAAAgAAAAAAAAAAAAAAAwAAAAMAAAAcAAEAAAAAAHAACAAEAAAAAAG4ABQADAAEAAAAAAAQABAANAAAAAABcABcAEgAAAAAQABgAAgABAAEAEAAg//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8AAAAg//8ADgABAAgAAgAAAAAAAgABAAAAAAABAAAAAAACAAAAAwAAABQAAwABAAAAFAAEAEAAAAAMAAgAIgAEAAAAAAB0AEgAFAAMAAQAgAAoADABH//8=";
const DEVANAGARI_FONT_NAME = 'NotoSansDevanagariCustomPDF';
const BASE_FONT_NAME = 'Helvetica';
let isDevanagariFontSuccessfullyEmbedded = false;

const getCurrentFont = (text: string): string => {
  if (isDevanagariFontSuccessfullyEmbedded && text && /[^\x00-\x7F]+/.test(text)) {
    return DEVANAGARI_FONT_NAME;
  }
  return BASE_FONT_NAME;
};

const ManageDecisionsPage: React.FC = () => {
  const { decisionLogs, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<DecisionLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const filteredDecisions = useMemo(() => 
    decisionLogs
      .filter(decision => 
        decision.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decision.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decision.madeBy.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime()), 
  [decisionLogs, searchTerm]);

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

  const generateDecisionPdf = (decision: DecisionLog) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    isDevanagariFontSuccessfullyEmbedded = false;
    try {
        if (NotoSansDevanagariBase64 && NotoSansDevanagariBase64 !== "YOUR_DEVANAGARI_FONT_BASE64_STRING_HERE") {
            doc.addFileToVFS('NotoSansDevanagariCustom.ttf', NotoSansDevanagariBase64);
            doc.addFont('NotoSansDevanagariCustom.ttf', DEVANAGARI_FONT_NAME, 'normal');
            isDevanagariFontSuccessfullyEmbedded = true;
        }
    } catch (e) { console.error("Could not embed font for PDF", e); }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const footerMargin = 10;
    const yPosRef = { current: margin }; 
    const lineSpacing = 6;
    const sectionSpacing = 8;
    const baseFontSize = 10;
    
    const churchNameForPdf = "BEM Church";
    const documentTitle = "Decision Record";
    
    doc.setFont(getCurrentFont(churchNameForPdf), 'bold');
    doc.setFontSize(16);
    doc.text(churchNameForPdf, pageWidth / 2, yPosRef.current, { align: 'center' });
    yPosRef.current += 7;

    doc.setFont(BASE_FONT_NAME, 'normal');
    doc.setFontSize(14);
    doc.text(documentTitle, pageWidth / 2, yPosRef.current, { align: 'center' });
    yPosRef.current += 10;
    
    const decisionTitle = decision.title || 'N/A';
    doc.setFont(getCurrentFont(decisionTitle), 'bold');
    doc.setFontSize(12);
    doc.text(decisionTitle, margin, yPosRef.current);
    yPosRef.current += sectionSpacing;

    doc.setFontSize(baseFontSize);

    const addDetail = (label: string, value?: string, options: { isPotentiallyMultilingualValue?: boolean, isMultiLine?: boolean } = {}) => {
        const { isMultiLine = false } = options;
        const valueString = String(value ?? '').trim();
        if (valueString === '') return;

        if (yPosRef.current > pageHeight - footerMargin - 25) { doc.addPage(); yPosRef.current = margin; }
        
        doc.setFont(getCurrentFont(label), 'bold');
        doc.text(`${label}: `, margin, yPosRef.current);
        
        doc.setFont(getCurrentFont(valueString), 'normal');
        
        const labelWidth = doc.getTextWidth(`${label}: `) + 1; 
        const valueXPos = margin + labelWidth;
        const textBlockWidth = pageWidth - 2 * margin - labelWidth;
    
        if (textBlockWidth <= 0) { console.warn(`PDF: Not enough width for value of "${label}".`); yPosRef.current += lineSpacing; return; }
        
        const linesOutput = doc.splitTextToSize(valueString, textBlockWidth);
        const textToRender = Array.isArray(linesOutput) ? linesOutput : [linesOutput];
        doc.text(textToRender, valueXPos, yPosRef.current);
        
        const numActualLines = textToRender.length;
        
        if (numActualLines > 0) {
            let increment = numActualLines * (lineSpacing - 1); 
            if(isMultiLine && numActualLines > 1) { 
                increment = numActualLines * lineSpacing;
            }
            yPosRef.current += Math.max(lineSpacing, increment);
        }
    };

    addDetail('Decision Date', formatDateADBS(decision.decisionDate));
    addDetail('Made By', decision.madeBy, { isPotentiallyMultilingualValue: true });
    if (decision.status) addDetail('Status', decision.status);
    yPosRef.current += sectionSpacing / 2;
    addDetail('Description/Rationale', decision.description, { isPotentiallyMultilingualValue: true, isMultiLine: true });
    yPosRef.current += sectionSpacing / 2;
    
    if (decision.followUpActions && decision.followUpActions.length > 0) {
        if (yPosRef.current > pageHeight - footerMargin - 40) { doc.addPage(); yPosRef.current = margin; }
        doc.setFontSize(11);
        doc.setFont(BASE_FONT_NAME, 'bold');
        doc.text('Follow-up Action Items:', margin, yPosRef.current);
        yPosRef.current += lineSpacing + 1;
        (decision.followUpActions || []).forEach((item, index) => {
            if (yPosRef.current > pageHeight - footerMargin - 30) { doc.addPage(); yPosRef.current = margin; }
            doc.setFontSize(10);
            doc.setFont(BASE_FONT_NAME, 'bold');
            doc.text(`Item ${index + 1}:`, margin, yPosRef.current);
            yPosRef.current += lineSpacing - 1;
            addDetail('  Description', item.description, { isMultiLine: true, isPotentiallyMultilingualValue: true });
            if(item.assignedTo) addDetail('  Assigned To', item.assignedTo, { isPotentiallyMultilingualValue: true });
            if(item.dueDate) addDetail('  Due Date', formatDateADBS(item.dueDate));
            addDetail('  Status', item.status);
            yPosRef.current += lineSpacing/2;
        });
    }

    addDetail('Recorded By', decision.postedByOwnerName, { isPotentiallyMultilingualValue: true });
    if (decision.createdAt) addDetail('Record Created At', formatTimestampADBS(decision.createdAt));

    const totalPages = doc.getNumberOfPages();
    const currentYear = new Date().getFullYear();
    const generatedDate = formatDateADBS(new Date().toISOString()).split('(')[0].trim();

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont(BASE_FONT_NAME, 'normal');
        doc.setFontSize(8);
        doc.text(`Generated date: ${generatedDate}`, margin, pageHeight - footerMargin);
        const copyrightText = `All rights reserved at ${churchNameForPdf} © ${currentYear}`;
        doc.text(copyrightText, (pageWidth - doc.getTextWidth(copyrightText)) / 2, pageHeight - footerMargin);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - doc.getTextWidth(`Page ${i} of ${totalPages}`), pageHeight - footerMargin);
    }
    
    doc.save(`DecisionLog_${(decision.title || 'Log').replace(/\s+/g, '_')}.pdf`);
  };
  
  const downloadAllDecisionsExcel = () => {
    const dataForExcel = [
      ["ID", "Decision Date", "Title", "Description", "Made By", "Status", "Follow-up Actions", "Posted By Owner ID", "Posted By Owner Name", "Created At", "Updated At"],
      ...filteredDecisions.map(log => [ 
        log.id,
        new Date(log.decisionDate).toLocaleDateString('en-CA'), // AD Date
        log.title,
        log.description,
        log.madeBy,
        log.status || 'N/A',
        (log.followUpActions || []).map(a => `${a.description} (Assigned: ${a.assignedTo || 'N/A'}, Due: ${a.dueDate || 'N/A'}, Status: ${a.status})`).join('; '),
        log.postedByOwnerId || '',
        log.postedByOwnerName || '',
        log.createdAt ? new Date(log.createdAt).toISOString() : '',
        log.updatedAt ? new Date(log.updatedAt).toISOString() : ''
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
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
                        {(decision.followUpActions || []).map(item => (
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
        <CardFooter className="flex justify-end space-x-2 bg-gray-100 dark:bg-slate-700/50 p-3">
            <Button variant="outline" size="sm" onClick={() => generateDecisionPdf(decision)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"><ArrowDownTrayIcon className="mr-1 h-4 w-4"/>PDF</Button>
            <Button variant="outline" size="sm" onClick={() => handleOpenModal(decision)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600">Edit</Button>
            <Button variant="secondary" size="sm" onClick={() => handleDelete(decision.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
        </CardFooter>
    </Card>
  );


  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
        <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">Manage Decision Logs</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Record, view, edit, and manage key church decisions.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => handleOpenModal()} variant="primary" size="sm" className="w-full sm:w-auto">
                <HeroPlusIcon className="mr-1.5 h-4 w-4" /> Add Decision Log
            </Button>
            <Button 
                onClick={downloadAllDecisionsExcel} 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto dark:text-purple-300 dark:border-purple-500 dark:hover:bg-purple-700 dark:hover:text-white"
                disabled={filteredDecisions.length === 0}
                title={filteredDecisions.length === 0 ? "No decisions to download" : "Download filtered decisions as Excel"}
            >
                <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" /> Download Excel
            </Button>
        </div>
      </div>
      
      <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <input 
            type="text"
            placeholder="Search by title, description, or decision maker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-grow p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 dark:text-slate-200"
            aria-label="Search decision logs"
        />
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
            <Button 
                variant={viewMode === 'card' ? 'primary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('card')} 
                className={`p-2 ${viewMode === 'card' ? '' : '!text-gray-600 dark:!text-slate-300'}`}
                aria-pressed={viewMode === 'card'} aria-label="Card View"
            >
                <ViewGridIcon />
            </Button>
            <Button 
                variant={viewMode === 'list' ? 'primary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('list')} 
                className={`p-2 ${viewMode === 'list' ? '' : '!text-gray-600 dark:!text-slate-300'}`}
                aria-pressed={viewMode === 'list'} aria-label="List View"
            >
                <ViewListIcon />
            </Button>
        </div>
      </div>

      {loadingContent && <p className="text-gray-500 dark:text-slate-400">Loading decision logs...</p>}
      
      {!loadingContent && filteredDecisions.length === 0 && (
        <Card className="dark:bg-slate-800">
            <CardContent>
                <p className="text-center text-gray-500 dark:text-slate-400 py-8">
                   {searchTerm ? `No decisions found matching "${searchTerm}".` : "No decision logs found. Add one to get started!"}
                </p>
            </CardContent>
        </Card>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecisions.map(decision => renderDecisionCard(decision))}
        </div>
      ) : (
        <Card className="overflow-x-auto dark:bg-slate-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Made By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredDecisions.map((decision) => (
                <tr key={decision.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100 max-w-xs truncate" title={decision.title}>{decision.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{formatDateADBS(decision.decisionDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{decision.madeBy}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDecisionStatusColorClassName(decision.status)}`}>
                        {decision.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium space-x-1">
                     <Button variant="outline" size="sm" onClick={() => generateDecisionPdf(decision)} className="!p-1.5 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"><ArrowDownTrayIcon className="w-4 h-4"/></Button>
                     <Button variant="outline" size="sm" onClick={() => handleOpenModal(decision)} className="!p-1.5 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Edit</Button>
                     <Button variant="secondary" size="sm" onClick={() => handleDelete(decision.id)} className="!bg-red-500 hover:!bg-red-600 text-white !p-1.5">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
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
