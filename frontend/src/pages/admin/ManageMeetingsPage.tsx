import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { MeetingLog, MeetingLogFormData, GenericContentFormData, MeetingLogStatus, DecisionLogStatus, MeetingDecisionPoint, ActionItemStatus } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import { jsPDF } from 'jspdf';
import { PlusIcon as HeroPlusIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';


// Icons (re-defined locally for brevity, consider centralizing if used more)
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

const getMeetingStatusColor = (status?: MeetingLogStatus) => {
    switch(status) {
        case 'Decisions Approved': case 'Completed': return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-700/30';
        case 'Follow-up Required': case 'In Progress': return 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-700/30';
        case 'Agenda Set': case 'Pending Discussion': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-700/30';
        case 'Postponed': case 'Cancelled': return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-700/30';
        default: return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50';
    }
};

const getDecisionStatusColor = (status?: DecisionLogStatus) => {
    switch(status) {
        case 'Approved': return 'text-green-600 dark:text-green-400';
        case 'Implemented': return 'text-blue-600 dark:text-blue-400';
        case 'Proposed': return 'text-yellow-600 dark:text-yellow-400';
        case 'Rejected': return 'text-red-600 dark:text-red-400';
        case 'Cancelled': return 'text-slate-600 dark:text-slate-400';
        case 'Follow-up Required': return 'text-amber-600 dark:text-amber-400';
        case 'Postponed': return 'text-indigo-600 dark:text-indigo-400';
        default: return 'text-gray-600 dark:text-gray-400';
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

const ManageMeetingsPage: React.FC = () => {
  const { meetingLogs, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');


  const filteredMeetings = useMemo(() => 
    meetingLogs
        .filter(meeting => meeting.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()), 
  [meetingLogs, searchTerm]);

  const handleOpenModal = (meeting?: MeetingLog) => {
    setEditingMeeting(meeting || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingMeeting) {
      await updateContent('meetingLog', editingMeeting.id, data as MeetingLogFormData);
    } else {
      await addContent('meetingLog', data as MeetingLogFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this meeting log? This action cannot be undone.')) {
      await deleteContent('meetingLog', id);
    }
  };
  
  const generateMeetingPdf = (meeting: MeetingLog) => {
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
    const documentTitle = "Meeting Minutes/Log"; 
    
    doc.setFontSize(16);
    doc.setFont(getCurrentFont(churchNameForPdf), 'bold'); 
    doc.text(churchNameForPdf, pageWidth / 2, yPosRef.current, { align: 'center' });
    yPosRef.current += 7;

    doc.setFontSize(14);
    doc.setFont(BASE_FONT_NAME, 'normal'); 
    doc.text(documentTitle, pageWidth / 2, yPosRef.current, { align: 'center' });
    yPosRef.current += 10;
    
    const meetingTitle = meeting.title || 'N/A';
    doc.setFontSize(12);
    doc.setFont(getCurrentFont(meetingTitle), 'bold');
    doc.text(meetingTitle, pageWidth / 2, yPosRef.current, { align: 'center' });
    yPosRef.current += sectionSpacing + 2;

    doc.setFontSize(baseFontSize);

    const addDetail = (label: string, value?: string, options: { isPotentiallyMultilingualValue?: boolean, isMultiLine?: boolean } = {}) => {
        const { isMultiLine = false } = options;
        const valueString = String(value ?? '').trim();
        if (valueString === '') return;

        if (yPosRef.current > pageHeight - footerMargin - 25) {
            doc.addPage();
            yPosRef.current = margin;
        }
        
        doc.setFont(getCurrentFont(label), 'bold'); 
        doc.text(`${label}:`, margin, yPosRef.current);
        
        doc.setFont(getCurrentFont(valueString), 'normal'); 
        
        const labelWidth = doc.getTextWidth(`${label}:`) + 2;
        const valueXPos = margin + labelWidth;
        const calculatedTextBlockWidth = pageWidth - margin - valueXPos - 5;

        if (calculatedTextBlockWidth <= 0) {
            console.warn(`PDF: Not enough width for value of "${label}". Skipping.`);
            yPosRef.current += lineSpacing;
            return;
        }
        
        const linesOutput = doc.splitTextToSize(valueString, calculatedTextBlockWidth);
        const textToRender = Array.isArray(linesOutput) ? linesOutput : [linesOutput];
        doc.text(textToRender, valueXPos, yPosRef.current);
        
        const numLines = textToRender.length;
        let increment = numLines * (lineSpacing * 0.85);
        yPosRef.current += Math.max(lineSpacing, increment);
    };
    
    addDetail('Date', formatDateADBS(meeting.meetingDate));
    if (meeting.meetingType) addDetail('Type', meeting.meetingType, { isPotentiallyMultilingualValue: true }); 
    if (meeting.status) addDetail('Overall Status', meeting.status, { isPotentiallyMultilingualValue: true }); 
    addDetail('Attendees', meeting.attendees || '', { isMultiLine: true, isPotentiallyMultilingualValue: true });
    yPosRef.current += (sectionSpacing / 2);
    
    addDetail('Agenda', meeting.agenda || '', { isMultiLine: true, isPotentiallyMultilingualValue: true });
    yPosRef.current += (sectionSpacing / 2);
    addDetail('Minutes', meeting.minutes || '', { isMultiLine: true, isPotentiallyMultilingualValue: true });
    yPosRef.current += (sectionSpacing / 2);
    
    if (meeting.actionItems && meeting.actionItems.length > 0) {
        if (yPosRef.current > pageHeight - footerMargin - 40) { doc.addPage(); yPosRef.current = margin; }
        doc.setFontSize(11);
        doc.setFont(BASE_FONT_NAME, 'bold');
        doc.text('Action Items:', margin, yPosRef.current);
        yPosRef.current += lineSpacing + 1;
        (meeting.actionItems || []).forEach((item, index) => {
            if (yPosRef.current > pageHeight - footerMargin - 40) { doc.addPage(); yPosRef.current = margin; }
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
        yPosRef.current += sectionSpacing;
    }

    if (meeting.decisionPoints && meeting.decisionPoints.length > 0) {
        if (yPosRef.current > pageHeight - footerMargin - 40) { doc.addPage(); yPosRef.current = margin; }
        doc.setFontSize(11);
        doc.setFont(BASE_FONT_NAME, 'bold'); 
        doc.text('Decisions & Plans Discussed:', margin, yPosRef.current);
        yPosRef.current += lineSpacing + 1;
        
        (meeting.decisionPoints || []).forEach((dp, index) => {
            if (yPosRef.current > pageHeight - footerMargin - 40) { doc.addPage(); yPosRef.current = margin; }
            doc.setFontSize(10);
            doc.setFont(BASE_FONT_NAME, 'bold'); 
            doc.text(`Item ${index + 1}:`, margin, yPosRef.current);
            yPosRef.current += lineSpacing - 1;
            addDetail('  Description', dp.description, { isMultiLine: true, isPotentiallyMultilingualValue: true });
            if(dp.proposedBy) addDetail('  Proposed By', dp.proposedBy, { isPotentiallyMultilingualValue: true });
            addDetail('  Status', dp.status); 
            if(dp.resolutionDate) addDetail('  Resolution Date', formatDateADBS(dp.resolutionDate));
            if(dp.followUpNotes) addDetail('  Follow-up Notes', dp.followUpNotes, { isMultiLine: true, isPotentiallyMultilingualValue: true });
            yPosRef.current += lineSpacing/2; 
        });
        yPosRef.current += sectionSpacing;
    }
    
    addDetail('Recorded By', meeting.postedByOwnerName, { isPotentiallyMultilingualValue: true });
    if (meeting.createdAt) addDetail('Record Created At', formatTimestampADBS(meeting.createdAt));


    const totalPages = doc.getNumberOfPages();
    const currentYear = new Date().getFullYear();
    const generatedDate = formatDateADBS(new Date().toISOString()).split('(')[0].trim();

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(BASE_FONT_NAME, 'normal'); 
        
        doc.text(`Generated date: ${generatedDate}`, margin, pageHeight - footerMargin);
        
        const copyrightText = `All rights reserved at ${churchNameForPdf} © ${currentYear}`;
        doc.setFont(getCurrentFont(copyrightText), 'normal'); 
        const copyrightTextWidth = doc.getTextWidth(copyrightText);
        doc.text(copyrightText, (pageWidth - copyrightTextWidth) / 2, pageHeight - footerMargin);
        
        const pageNumText = `Page ${i} of ${totalPages}`;
        const pageNumTextWidth = doc.getTextWidth(pageNumText);
        doc.text(pageNumText, pageWidth - margin - pageNumTextWidth, pageHeight - footerMargin);
    }
    
    doc.save(`MeetingLog_${(meeting.title || 'Log').replace(/\s+/g, '_')}.pdf`);
  };
  

  const renderMeetingCard = (meeting: MeetingLog) => (
    <Card key={meeting.id} className="flex flex-col dark:bg-slate-800">
      {meeting.imageUrl && <img src={meeting.imageUrl} alt={meeting.title} className="w-full h-40 object-cover"/>}
      <CardHeader className="dark:border-slate-700 pb-3">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-100 flex-grow mr-2" title={meeting.title}>{meeting.title}</h2>
          {meeting.status && (
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getMeetingStatusColor(meeting.status)}`}>
                  {meeting.status}
              </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400">Date: {formatDateADBS(meeting.meetingDate)}</p>
        {meeting.meetingType && <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{meeting.meetingType}</p>}
      </CardHeader>
      <CardContent className="text-sm text-gray-600 dark:text-slate-300 space-y-2 flex-grow pt-2 pb-3">
          <details className="text-xs">
              <summary className="cursor-pointer font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">Attendees ({ (meeting.attendees || '').split('\n').filter(a => a.trim() !== '').length})</summary>
              <div className="attendees-list mt-1 bg-gray-50 dark:bg-slate-700 p-2 rounded max-h-20 overflow-y-auto">
                  {(meeting.attendees || '').split('\n').map((attendee, index) => (
                      <div key={index} className="truncate">{attendee.trim()}</div>
                  ))}
              </div>
          </details>
          {((meeting.actionItems || []).length > 0) && (
            <details className="text-xs mt-2">
                <summary className="cursor-pointer font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">Action Items ({meeting.actionItems?.length})</summary>
                <ul className="mt-1 space-y-1 bg-gray-50 dark:bg-slate-700 p-2 rounded max-h-28 overflow-y-auto">
                    {(meeting.actionItems || []).map(item => (
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
          {((meeting.decisionPoints || []).length > 0) && (
            <div className="mt-2">
                <p className="font-medium text-xs mb-0.5 text-gray-700 dark:text-slate-200">Decisions/Plans:</p>
                <ul className="space-y-1 text-xs max-h-28 overflow-y-auto bg-gray-50 dark:bg-slate-700 p-2 rounded">
                    {(meeting.decisionPoints || []).slice(0, 3).map(dp => ( 
                        <li key={dp.id} className="border-b border-gray-200 dark:border-slate-600 last:border-b-0 pb-1 mb-1">
                            <p className="truncate" title={dp.description}>{dp.description}</p>
                            <p className={`font-semibold ${getDecisionStatusColor(dp.status)}`}>Status: {dp.status}</p>
                        </li>
                    ))}
                    {(meeting.decisionPoints || []).length > 3 && <li className="text-center text-gray-400 dark:text-slate-500 text-xs">...and {(meeting.decisionPoints || []).length - 3} more</li>}
                </ul>
            </div>
          )}
          <div className="mt-2">
              <p className="font-medium text-xs mb-0.5 text-gray-700 dark:text-slate-200">Minutes Summary:</p>
              <p className="whitespace-pre-line line-clamp-3 text-xs bg-gray-50 dark:bg-slate-700 p-2 rounded">{meeting.minutes}</p>
          </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 bg-gray-100 dark:bg-slate-700/50 p-3">
        <Button variant="outline" size="sm" onClick={() => generateMeetingPdf(meeting)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"><DocumentTextIcon className="mr-1 h-4 w-4"/>PDF</Button>
        <Button variant="outline" size="sm" onClick={() => handleOpenModal(meeting)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600">View/Edit</Button>
        <Button variant="secondary" size="sm" onClick={() => handleDelete(meeting.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
      </CardFooter>
      <style>{`
        .attendees-list { column-count: 2; column-gap: 1rem; }
        @media (max-width: 400px) { .attendees-list { column-count: 1; } }
      `}</style>
    </Card>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
        <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">Manage Meeting Logs</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Add, view, edit, and manage church meeting logs and their outcomes.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => handleOpenModal()} variant="primary" size="sm" className="w-full sm:w-auto">
            <HeroPlusIcon className="mr-1.5 h-4 w-4" /> Add Meeting Log
            </Button>
        </div>
      </div>
      
      <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <input 
            type="text"
            placeholder="Search by meeting title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-grow p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 dark:text-slate-200"
            aria-label="Search meeting logs"
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

      {loadingContent && <p className="text-gray-500 dark:text-slate-400">Loading meeting logs...</p>}
      
      {!loadingContent && filteredMeetings.length === 0 && (
        <Card className="dark:bg-slate-800">
            <CardContent>
                <p className="text-center text-gray-500 dark:text-slate-400 py-8">
                  {searchTerm ? `No meeting logs found matching "${searchTerm}".` : "No meeting logs found. Add one to get started!"}
                </p>
            </CardContent>
        </Card>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMeetings.map(meeting => renderMeetingCard(meeting))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          {/* Table view logic can be added here if needed */}
        </Card>
      )}

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="meetingLog"
          initialData={editingMeeting}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageMeetingsPage;
