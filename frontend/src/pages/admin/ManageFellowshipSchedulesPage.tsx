import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { EditScheduleDraftModal } from '../../components/admin/EditScheduleDraftModal';
// Removed ViewGeneratedScheduleModal and ViewRosterItemModal as they are replaced by the detail page
import { generateSchedulePDF, generateRosterItemPDF } from '../../components/admin/PrintableSchedulePDF';
import { FellowshipRosterItem, GeneratedScheduleItem, FellowshipRosterFormData, GenericContentFormData, RosterType, rosterTypeList, Responsibility } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import { PlusIcon as HeroPlusIcon, ArrowPathIcon, PencilSquareIcon, TrashIcon, ShareIcon as HeroShareIcon, CalendarDaysIcon, EllipsisVerticalIcon, DocumentArrowDownIcon, EnvelopeIcon, MegaphoneIcon, EyeIcon as HeroEyeIcon, TableCellsIcon as HeroTableCellsIcon, Squares2X2Icon as HeroSquares2X2Icon, ListBulletIcon as HeroListBulletIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { Link } from "react-router-dom"; // Import Link

const parseAdditionalDetailsForDisplay = (detailsString?: string): Record<string, string> => {
  if (!detailsString) return {};
  const details: Record<string, string> = {};
  const lines = detailsString.split('\n');
  lines.forEach(line => {
    const parts = line.split(/:(.*)/s); // Split only on the first colon
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      if (value) details[key] = value;
    }
  });
  return details;
};

const escapeCsvCell = (cellData: any): string => {
    if (cellData === null || cellData === undefined) return '';
    const stringData = String(cellData);
    if (stringData.includes(',') || stringData.includes('\n') || stringData.includes('"')) {
      return `"${String(cellData).replace(/"/g, '""')}"`;
    }
    return stringData;
};

const getResponsibility = (responsibilities: Responsibility[] | undefined, roleName: string): string => {
    if (!responsibilities) return '';
    const resp = responsibilities.find(r => r.role.toLowerCase().includes(roleName.toLowerCase()));
    return resp ? resp.assignedTo : '';
};


const ManageFellowshipSchedulesPage: React.FC = () => {
  const { 
    fellowshipRosters, 
    generatedSchedules, 
    addContent, 
    updateContent, 
    deleteContent, 
    generateNextSchedules,
    updateGeneratedSchedule, 
    deleteGeneratedSchedule,
    publishGeneratedScheduleToEvent,
    loadingContent 
  } = useContent();
  const { logAdminAction, currentUser } = useAuth();

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState<FellowshipRosterItem | null>(null);
  // Removed viewRosterItem state

  const [isEditDraftModalOpen, setIsEditDraftModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<GeneratedScheduleItem | null>(null);
  // Removed viewGeneratedSchedule state
  
  const [activeTab, setActiveTab] = useState<'inputtedRosters' | 'generatedSchedules'>('inputtedRosters');
  
  const [selectedRosterTypeForGeneration, setSelectedRosterTypeForGeneration] = useState<RosterType>(rosterTypeList[0]);
  const [numberOfSchedulesToGenerate, setNumberOfSchedulesToGenerate] = useState<number>(4);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const [rosterSearchTerm, setRosterSearchTerm] = useState('');
  const [rosterViewMode, setRosterViewMode] = useState<'card' | 'list'>('card');
  const [generatedSearchTerm, setGeneratedSearchTerm] = useState('');
  const [generatedViewMode, setGeneratedViewMode] = useState<'card' | 'list'>('card');

  const filteredRosters = useMemo(() => 
    [...fellowshipRosters].filter(roster => {
        const term = rosterSearchTerm.toLowerCase();
        return (
            roster.groupNameOrEventTitle.toLowerCase().includes(term) ||
            roster.rosterType.toLowerCase().includes(term) ||
            (roster.responsibilities || []).some(r => 
                r.assignedTo.toLowerCase().includes(term) || 
                r.role.toLowerCase().includes(term)
            )
        )
    }).sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime()), 
  [fellowshipRosters, rosterSearchTerm]);

  const filteredGeneratedSchedules = useMemo(() => 
    [...generatedSchedules].filter(schedule => {
        const term = generatedSearchTerm.toLowerCase();
        return (
            schedule.groupNameOrEventTitle.toLowerCase().includes(term) ||
            schedule.rosterType.toLowerCase().includes(term) ||
            (schedule.responsibilities || []).some(r => 
                r.assignedTo.toLowerCase().includes(term) || 
                r.role.toLowerCase().includes(term)
            )
        )
    }).sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()),
  [generatedSchedules, generatedSearchTerm]);

  // Roster Item Handlers
  const handleOpenRosterModal = (roster?: FellowshipRosterItem) => { setEditingRoster(roster || null); setIsRosterModalOpen(true); };
  const handleCloseRosterModal = () => { setIsRosterModalOpen(false); setEditingRoster(null); };
  const handleRosterSubmit = async (data: GenericContentFormData) => {
    if (editingRoster) await updateContent('fellowshipRoster', editingRoster.id, data as FellowshipRosterFormData);
    else await addContent('fellowshipRoster', data as FellowshipRosterFormData);
    handleCloseRosterModal();
  };
  const handleRosterDelete = async (id: string) => { if (window.confirm('Are you sure you want to delete this roster item?')) await deleteContent('fellowshipRoster', id); };
  const handleDownloadRosterPDF = async (roster: FellowshipRosterItem) => {
    alert("PDF generation started...");
    await generateRosterItemPDF(roster, "BEM Church", window.location.origin);
  };
  const rosterItemToExcelRow = (item: FellowshipRosterItem) => [
    item.id, item.rosterType, item.groupNameOrEventTitle, formatDateADBS(item.assignedDate), item.timeSlot,
    getResponsibility(item.responsibilities, 'coordinator'),
    getResponsibility(item.responsibilities, 'co-coordinator'),
    getResponsibility(item.responsibilities, 'choir'),
    getResponsibility(item.responsibilities, 'sermon') || getResponsibility(item.responsibilities, 'speaker'),
    item.location || '', item.contactNumber || '', item.additionalNotesOrProgramDetails || '',
    item.isTemplate ? 'Yes' : 'No', item.postedByOwnerName || '', formatTimestampADBS(item.createdAt || '')
  ];
  const rosterExcelHeaders = ["ID", "Type", "Title", "Date", "Time", "Coordinator", "Co-Coordinator", "Choir", "Speaker/Program", "Location", "Contact", "Details", "Is Template", "Posted By", "Created At"];
  
  const downloadSingleRosterExcel = (roster: FellowshipRosterItem) => {
    const data = [rosterExcelHeaders, rosterItemToExcelRow(roster)];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Roster Item");
    XLSX.writeFile(wb, `Roster_${roster.groupNameOrEventTitle.replace(/\s+/g, '_')}.xlsx`);
  };
  const downloadAllRostersExcel = () => {
    const data = [rosterExcelHeaders, ...filteredRosters.map(rosterItemToExcelRow)];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Rosters");
    XLSX.writeFile(wb, "All_Fellowship_Rosters.xlsx");
  };

  // Generated Schedule Handlers
  const handleOpenEditDraftModal = (draft: GeneratedScheduleItem) => { setEditingDraft(draft); setIsEditDraftModalOpen(true); setActiveDropdownId(null); };
  const handleCloseEditDraftModal = () => { setIsEditDraftModalOpen(false); setEditingDraft(null); };
  const handleDraftUpdateSubmit = async (draftId: string, data: Partial<GeneratedScheduleItem>) => {
    if (await updateGeneratedSchedule(draftId, data)) handleCloseEditDraftModal(); else alert("Update failed.");
  };
  // Removed handleViewGeneratedSchedule as it's replaced by detail page link
  const handleTriggerGenerateSchedules = async () => {
    if (!selectedRosterTypeForGeneration || numberOfSchedulesToGenerate < 1) return alert("Invalid selection.");
    const generated = await generateNextSchedules(selectedRosterTypeForGeneration, numberOfSchedulesToGenerate);
    alert(generated && generated.length > 0 ? `${generated.length} draft schedules generated for ${selectedRosterTypeForGeneration}!` : "Failed to generate schedules. Check console for details.");
  };
  const handlePublishToEvent = async (scheduleId: string) => {
    setActiveDropdownId(null);
    if(!window.confirm('Are you sure you want to publish this schedule to the public event calendar?')) return;
    const eventItem = await publishGeneratedScheduleToEvent(scheduleId);
    alert(eventItem ? `Schedule published successfully as event: "${eventItem.title}"` : 'Failed to publish schedule. It might be already published or an error occurred.');
  };
  const handleDraftDelete = async (scheduleId: string) => {
    setActiveDropdownId(null);
    if(window.confirm("Delete draft?")) await deleteGeneratedSchedule(scheduleId) ? alert("Draft deleted.") : alert("Delete failed.");
  };
  const handleCopyForSharing = (schedule: GeneratedScheduleItem) => {
    setActiveDropdownId(null);
    const responsibilitiesText = (schedule.responsibilities || []).map(r => `\n${r.role}: ${r.assignedTo}`).join('');
    const details = `Type: ${schedule.rosterType}\nTitle: ${schedule.groupNameOrEventTitle}\nDate: ${formatDateADBS(schedule.scheduledDate)}\nTime: ${schedule.timeSlot}${responsibilitiesText}${schedule.location ? `\nLocation: ${schedule.location}`:''}${schedule.additionalNotesOrProgramDetails ? `\nDetails:\n${schedule.additionalNotesOrProgramDetails}`:''}${schedule.adminNotes ? `\nAdmin Notes:\n${schedule.adminNotes}`:''}`.trim();
    navigator.clipboard.writeText(details).then(() => alert('Schedule details copied to clipboard!')).catch(err => console.error('Copy failed: ', err));
  };
  const handleSimulateEmail = (schedule: GeneratedScheduleItem) => {
    setActiveDropdownId(null);
    logAdminAction("Simulated Email Sent", schedule.id, `Schedule: ${schedule.groupNameOrEventTitle}`);
    alert(`Email (simulated) for "${schedule.groupNameOrEventTitle}" logged.`);
  };
  const handleDownloadSchedulePDF = async (schedule: GeneratedScheduleItem) => {
    setActiveDropdownId(null); alert("PDF generation started...");
    await generateSchedulePDF(schedule, "BEM Church", window.location.origin);
  };
  const scheduleToExcelRow = (item: GeneratedScheduleItem) => [
    item.id, item.rosterType, item.groupNameOrEventTitle, formatDateADBS(item.scheduledDate), item.timeSlot,
    getResponsibility(item.responsibilities, 'coordinator'),
    getResponsibility(item.responsibilities, 'co-coordinator'),
    getResponsibility(item.responsibilities, 'choir'),
    getResponsibility(item.responsibilities, 'sermon') || getResponsibility(item.responsibilities, 'speaker'),
    item.location || '', item.contactNumber || '', item.additionalNotesOrProgramDetails || '', item.adminNotes || '',
    item.isPublishedAsEvent ? 'Yes' : 'No', item.publishedEventId || '', formatTimestampADBS(item.generatedAt)
  ];
  const scheduleExcelHeaders = ["ID", "Type", "Title", "Date", "Time", "Coordinator", "Co-Coordinator", "Choir", "Speaker/Program", "Location", "Contact", "Details", "Admin Notes", "Published", "Event ID", "Generated At"];
  
  const downloadSingleScheduleExcel = (schedule: GeneratedScheduleItem) => {
    const data = [scheduleExcelHeaders, scheduleToExcelRow(schedule)];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule Draft");
    XLSX.writeFile(wb, `Schedule_${schedule.groupNameOrEventTitle.replace(/\s+/g, '_')}.xlsx`);
  };
  const downloadAllSchedulesExcel = () => {
    const data = [scheduleExcelHeaders, ...filteredGeneratedSchedules.map(scheduleToExcelRow)];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Schedules");
    XLSX.writeFile(wb, "All_Generated_Schedules.xlsx");
  };

  const renderSearchAndToggle = (
    currentViewMode: 'card' | 'list',
    setViewMode: (mode: 'card' | 'list') => void,
    currentSearchTerm: string,
    setSearchTerm: (term: string) => void,
    downloadAllExcelFunc: () => void,
    entityName: string
  ) => (
    <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg shadow-sm flex flex-col sm:flex-row gap-3 items-center">
      <div className="relative flex-grow w-full sm:w-auto">
        <input
          type="text"
          placeholder={`Search ${entityName}...`}
          value={currentSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 pl-8 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
        />
        <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="flex items-center gap-1 self-start sm:self-center">
        <Button onClick={() => setViewMode('card')} variant={currentViewMode === 'card' ? 'primary' : 'ghost'} size="sm" className="!p-1.5" aria-label="Card View"><HeroSquares2X2Icon className="w-5 h-5"/></Button>
        <Button onClick={() => setViewMode('list')} variant={currentViewMode === 'list' ? 'primary' : 'ghost'} size="sm" className="!p-1.5" aria-label="List View"><HeroListBulletIcon className="w-5 h-5"/></Button>
      </div>
      <Button onClick={downloadAllExcelFunc} variant="outline" size="sm" className="w-full sm:w-auto text-xs dark:text-purple-300 dark:border-purple-500 dark:hover:bg-purple-700 dark:hover:text-white">
        <DocumentArrowDownIcon className="w-4 h-4 mr-1"/> Download All {entityName} (Excel)
      </Button>
    </div>
  );

  const renderRosterCard = (roster: FellowshipRosterItem) => {
    const coordinator = getResponsibility(roster.responsibilities, 'coordinator');
    const speaker = getResponsibility(roster.responsibilities, 'sermon') || getResponsibility(roster.responsibilities, 'speaker');
    return (
    <Card key={roster.id} className="flex flex-col dark:bg-slate-800">
      <CardHeader className="dark:border-slate-700 pb-2">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={roster.groupNameOrEventTitle}>{roster.groupNameOrEventTitle}</h3>
        <p className="text-xs text-purple-600 dark:text-purple-400">{roster.rosterType}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateADBS(roster.assignedDate)}</p>
         {roster.isTemplate && <span className="text-xs text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-700/50 px-1.5 py-0.5 rounded mt-1 inline-block">Template</span>}
      </CardHeader>
      <CardContent className="text-xs text-slate-600 dark:text-slate-300 space-y-1 flex-grow pt-1 pb-2">
        {coordinator && <p className="truncate"><strong>Coordinator:</strong> {coordinator}</p>}
        {speaker && <p className="truncate"><strong>Speaker/Program:</strong> {speaker}</p>}
        {roster.location && <p className="truncate"><strong>Location:</strong> {roster.location}</p>}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 bg-gray-50 dark:bg-slate-700/50 p-2">
        <Button asLink to={roster.linkPath || '#'} variant="outline" size="sm" className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"><HeroEyeIcon className="w-4 h-4"/></Button>
        <Button variant="outline" size="sm" onClick={() => handleDownloadRosterPDF(roster)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"><DocumentArrowDownIcon className="w-4 h-4"/></Button>
        <Button variant="outline" size="sm" onClick={() => handleOpenRosterModal(roster)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Edit</Button>
        <Button variant="secondary" size="sm" onClick={() => handleRosterDelete(roster.id)} className="!bg-red-500 hover:!bg-red-600 text-white text-xs">Delete</Button>
      </CardFooter>
    </Card>
  )};

  const renderScheduleCard = (schedule: GeneratedScheduleItem) => {
    const coordinator = getResponsibility(schedule.responsibilities, 'coordinator');
    const speaker = getResponsibility(schedule.responsibilities, 'sermon') || getResponsibility(schedule.responsibilities, 'speaker');
    return (
    <Card key={schedule.id} className="flex flex-col dark:bg-slate-800">
       <CardHeader className="dark:border-slate-700 pb-2">
        <div className="flex justify-between items-start">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 truncate flex-grow mr-2" title={schedule.groupNameOrEventTitle}>{schedule.groupNameOrEventTitle}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${schedule.isPublishedAsEvent ? 'bg-green-100 text-green-700 dark:bg-green-700/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/50 dark:text-yellow-300'}`}>{schedule.isPublishedAsEvent ? 'Published' : 'Draft'}</span>
        </div>
        <p className="text-xs text-purple-600 dark:text-purple-400">{schedule.rosterType}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateADBS(schedule.scheduledDate)}</p>
       </CardHeader>
       <CardContent className="text-xs text-slate-600 dark:text-slate-300 space-y-1 flex-grow pt-1 pb-2">
          {coordinator && <p className="truncate"><strong>Coordinator:</strong> {coordinator}</p>}
          {speaker && <p className="truncate"><strong>Speaker/Program:</strong> {speaker}</p>}
          {schedule.location && <p className="truncate"><strong>Location:</strong> {schedule.location}</p>}
       </CardContent>
       <CardFooter className="flex justify-end space-x-2 bg-gray-50 dark:bg-slate-700/50 p-2">
         <Button asLink to={schedule.linkPath || '#'} variant="outline" size="sm" className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"><HeroEyeIcon className="w-4 h-4"/></Button>
         <Button variant="outline" size="sm" onClick={() => handleOpenEditDraftModal(schedule)} className="text-xs dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Edit</Button>
         <div className="relative">
            <Button variant="ghost" size="sm" className="!p-1" onClick={() => setActiveDropdownId(activeDropdownId === schedule.id ? null : schedule.id)}>
                <EllipsisVerticalIcon className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
            </Button>
            {activeDropdownId === schedule.id && (
                <div className="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-600 z-10 py-1">
                    <button onClick={() => handlePublishToEvent(schedule.id)} className="w-full text-left text-xs px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center" disabled={schedule.isPublishedAsEvent}>
                       <MegaphoneIcon className="w-4 h-4 mr-2"/> Publish as Event
                    </button>
                    <button onClick={() => handleCopyForSharing(schedule)} className="w-full text-left text-xs px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center">
                       <HeroShareIcon className="w-4 h-4 mr-2"/> Copy for Sharing
                    </button>
                    <button onClick={() => handleDownloadSchedulePDF(schedule)} className="w-full text-left text-xs px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center">
                       <DocumentArrowDownIcon className="w-4 h-4 mr-2"/> Download PDF
                    </button>
                     <button onClick={() => downloadSingleScheduleExcel(schedule)} className="w-full text-left text-xs px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center">
                       <HeroTableCellsIcon className="w-4 h-4 mr-2"/> Download Excel
                    </button>
                     <button onClick={() => handleSimulateEmail(schedule)} className="w-full text-left text-xs px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center">
                       <EnvelopeIcon className="w-4 h-4 mr-2"/> Email (Simulate)
                    </button>
                    <div className="my-1 border-t dark:border-slate-600"></div>
                     <button onClick={() => handleDraftDelete(schedule.id)} className="w-full text-left text-xs px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center">
                       <TrashIcon className="w-4 h-4 mr-2"/> Delete Draft
                    </button>
                </div>
            )}
         </div>
       </CardFooter>
    </Card>
  )};

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Fellowship Schedules Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage recurring program rosters and generate schedules.</p>
      </header>

      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700 mb-6">
        <button onClick={() => setActiveTab('inputtedRosters')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'inputtedRosters' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
          Inputted Rosters ({fellowshipRosters.length})
        </button>
        <button onClick={() => setActiveTab('generatedSchedules')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'generatedSchedules' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
          Generated Schedule Drafts ({generatedSchedules.length})
        </button>
      </div>

      {activeTab === 'inputtedRosters' && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">List of Inputted Roster Data</h2>
            <Button onClick={() => handleOpenRosterModal()} variant="primary" size="sm"><HeroPlusIcon className="w-4 h-4 mr-1.5"/> Add New Roster Item</Button>
          </div>
          {renderSearchAndToggle(rosterViewMode, setRosterViewMode, rosterSearchTerm, setRosterSearchTerm, downloadAllRostersExcel, "Rosters")}
          {loadingContent ? <p>Loading...</p> : filteredRosters.length === 0 ? <p>No roster items inputted yet.</p> : (
            rosterViewMode === 'card' ? 
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredRosters.map(renderRosterCard)}</div> :
              <div className="overflow-x-auto"><table className="min-w-full divide-y dark:divide-slate-700"><thead>{/* List view table headers here */}</thead><tbody>{/* List view table rows here */}</tbody></table></div>
          )}
        </section>
      )}

      {activeTab === 'generatedSchedules' && (
         <section>
            <Card className="mb-6 dark:bg-slate-800">
              <CardHeader className="dark:border-slate-700"><h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center"><ArrowPathIcon className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400"/> Generate Next Schedules</h3></CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-grow w-full sm:w-auto">
                    <label htmlFor="rosterTypeSelect" className="text-xs font-medium text-slate-600 dark:text-slate-400">Roster Type to Generate</label>
                    <select id="rosterTypeSelect" value={selectedRosterTypeForGeneration} onChange={e => setSelectedRosterTypeForGeneration(e.target.value as RosterType)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200">
                        {rosterTypeList.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                    </select>
                  </div>
                  <div className="flex-shrink-0">
                     <label htmlFor="numToGenerate" className="text-xs font-medium text-slate-600 dark:text-slate-400">Number to Generate</label>
                     <input id="numToGenerate" type="number" value={numberOfSchedulesToGenerate} onChange={e => setNumberOfSchedulesToGenerate(Math.max(1, parseInt(e.target.value)))} min="1" max="52" className="w-24 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-200"/>
                  </div>
                  <Button onClick={handleTriggerGenerateSchedules} className="w-full sm:w-auto">Generate</Button>
              </CardContent>
            </Card>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">List of Generated Schedule Drafts</h2>
            {renderSearchAndToggle(generatedViewMode, setGeneratedViewMode, generatedSearchTerm, setGeneratedSearchTerm, downloadAllSchedulesExcel, "Schedules")}
            {loadingContent ? <p>Loading...</p> : filteredGeneratedSchedules.length === 0 ? <p>No schedules generated yet.</p> : (
              generatedViewMode === 'card' ?
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredGeneratedSchedules.map(renderScheduleCard)}</div> :
                <div className="overflow-x-auto"><table className="min-w-full divide-y dark:divide-slate-700"><thead>{/* List view table headers here */}</thead><tbody>{/* List view table rows here */}</tbody></table></div>
            )}
        </section>
      )}

      {isRosterModalOpen && (
        <ContentFormModal
          isOpen={isRosterModalOpen}
          onClose={handleCloseRosterModal}
          onSubmit={handleRosterSubmit}
          contentType="fellowshipRoster"
          initialData={editingRoster}
          isLoading={loadingContent}
        />
      )}
       {isEditDraftModalOpen && editingDraft && (
        <EditScheduleDraftModal
            isOpen={isEditDraftModalOpen}
            onClose={handleCloseEditDraftModal}
            onSubmit={handleDraftUpdateSubmit}
            initialData={editingDraft}
            isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageFellowshipSchedulesPage;
