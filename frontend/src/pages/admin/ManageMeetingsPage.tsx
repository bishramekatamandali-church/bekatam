import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { MeetingLog, MeetingLogFormData, GenericContentFormData, MeetingLogStatus, DecisionLogStatus, ActionItemStatus } from '../../types';
import { formatDateADBS } from '../../dateConverter';
import { PlusIcon as HeroPlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { downloadBackendPdf } from '../../utils/downloadBackendPdf';

// Icons (re-defined locally for brevity, consider centralizing if used more)
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className || ''}`}>
    <path
      fillRule="evenodd"
      d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
      clipRule="evenodd"
    />
  </svg>
);

const ViewGridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className || 'w-5 h-5'}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  </svg>
);

const ViewListIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className || 'w-5 h-5'}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
    />
  </svg>
);

const normalizeStatus = (status?: string | null) => {
  // Handles:
  // "Follow-up Required" -> "Follow_up_Required"
  // "Pending Discussion" -> "Pending_Discussion"
  // "Decisions Approved" -> "Decisions_Approved"
  return String(status ?? '')
    .trim()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_');
};

const displayStatus = (status?: string | null) => {
  return String(status ?? '').replace(/_/g, ' ').trim();
};

const getMeetingStatusColor = (status?: MeetingLogStatus | string) => {
  const s = normalizeStatus(status);

  switch (s) {
    case 'Decisions_Approved':
    case 'Completed':
      return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-700/30';

    case 'Follow_up_Required':
    case 'In_Progress':
      return 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-700/30';

    case 'Agenda_Set':
    case 'Pending_Discussion':
      return 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-700/30';

    case 'Postponed':
    case 'Cancelled':
      return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-700/30';

    default:
      return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50';
  }
};

const getDecisionStatusColor = (status?: DecisionLogStatus | string) => {
  const s = normalizeStatus(status);

  switch (s) {
    case 'Approved':
      return 'text-green-600 dark:text-green-400';
    case 'Implemented':
      return 'text-blue-600 dark:text-blue-400';
    case 'Proposed':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'Rejected':
      return 'text-red-600 dark:text-red-400';
    case 'Cancelled':
      return 'text-slate-600 dark:text-slate-400';
    case 'Follow_up_Required':
      return 'text-amber-600 dark:text-amber-400';
    case 'Postponed':
      return 'text-indigo-600 dark:text-indigo-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

const getActionItemStatusColor = (status: ActionItemStatus | string) => {
  const s = String(status ?? '').trim();

  switch (s) {
    case 'Completed':
      return 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-700/30';
    case 'In Progress':
    case 'In_Progress':
      return 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-700/30';
    case 'Pending':
      return 'text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-700/30';
    case 'Cancelled':
      return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-700/30';
    default:
      return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/50';
  }
};

const makeMeetingPdfFilename = (meeting: MeetingLog) => {
  const safeTitle = String(meeting.title || 'MeetingLog')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '_');

  return `MeetingLog_${safeTitle}_${meeting.id}.pdf`;
};

const ManageMeetingsPage: React.FC = () => {
  const { meetingLogs, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const filteredMeetings = useMemo(
    () =>
      meetingLogs
        .filter((meeting: any) => String(meeting.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a: any, b: any) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()),
    [meetingLogs, searchTerm]
  );

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

  const downloadMeetingPdf = async (meeting: any) => {
  try {
    await downloadBackendPdf(`/api/pdfs/meetings/${meeting.id}`, makeMeetingPdfFilename(meeting));
  } catch (err: any) {
    alert(err?.message || "Failed to download PDF");
  }
};

  const renderMeetingCard = (meeting: MeetingLog) => (
    <Card key={meeting.id} className="flex flex-col dark:bg-slate-800">
      {(meeting as any).imageUrl && (
        <img src={(meeting as any).imageUrl} alt={meeting.title} className="w-full h-40 object-cover" />
      )}

      <CardHeader className="dark:border-slate-700 pb-3">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-100 flex-grow mr-2" title={meeting.title}>
            {meeting.title}
          </h2>
          {meeting.status && (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getMeetingStatusColor(meeting.status)}`}>
              {displayStatus(meeting.status)}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400">Date: {formatDateADBS((meeting as any).meetingDate)}</p>
        {(meeting as any).meetingType && (
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{displayStatus((meeting as any).meetingType)}</p>
        )}
      </CardHeader>

      <CardContent className="text-sm text-gray-600 dark:text-slate-300 space-y-2 flex-grow pt-2 pb-3">
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
            Attendees ({String((meeting as any).attendees || '').split('\n').filter((a) => a.trim() !== '').length})
          </summary>
          <div className="attendees-list mt-1 bg-gray-50 dark:bg-slate-700 p-2 rounded max-h-20 overflow-y-auto">
            {String((meeting as any).attendees || '')
              .split('\n')
              .map((attendee, index) => (
                <div key={index} className="truncate">
                  {attendee.trim()}
                </div>
              ))}
          </div>
        </details>

        {(((meeting as any).actionItems || []).length > 0) && (
          <details className="text-xs mt-2">
            <summary className="cursor-pointer font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
              Action Items ({(meeting as any).actionItems?.length})
            </summary>
            <ul className="mt-1 space-y-1 bg-gray-50 dark:bg-slate-700 p-2 rounded max-h-28 overflow-y-auto">
              {((meeting as any).actionItems || []).map((item: any) => (
                <li key={item.id} className="border-b border-gray-200 dark:border-slate-600 last:border-b-0 pb-1 mb-1">
                  <p className="truncate font-medium text-slate-700 dark:text-slate-200" title={item.description}>
                    {item.description}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="font-semibold">{item.assignedTo || 'Unassigned'}</span>
                    {item.dueDate && ` - Due: ${formatDateADBS(item.dueDate)}`}
                  </p>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full inline-block mt-0.5 ${getActionItemStatusColor(item.status)}`}>
                    {displayStatus(item.status)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {(((meeting as any).decisionPoints || []).length > 0) && (
          <div className="mt-2">
            <p className="font-medium text-xs mb-0.5 text-gray-700 dark:text-slate-200">Decisions/Plans:</p>
            <ul className="space-y-1 text-xs max-h-28 overflow-y-auto bg-gray-50 dark:bg-slate-700 p-2 rounded">
              {((meeting as any).decisionPoints || []).slice(0, 3).map((dp: any) => (
                <li key={dp.id} className="border-b border-gray-200 dark:border-slate-600 last:border-b-0 pb-1 mb-1">
                  <p className="truncate" title={dp.description}>
                    {dp.description}
                  </p>
                  <p className={`font-semibold ${getDecisionStatusColor(dp.status)}`}>Status: {displayStatus(dp.status)}</p>
                </li>
              ))}
              {((meeting as any).decisionPoints || []).length > 3 && (
                <li className="text-center text-gray-400 dark:text-slate-500 text-xs">
                  ...and {((meeting as any).decisionPoints || []).length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-2">
          <p className="font-medium text-xs mb-0.5 text-gray-700 dark:text-slate-200">Minutes Summary:</p>
          <p className="whitespace-pre-line line-clamp-3 text-xs bg-gray-50 dark:bg-slate-700 p-2 rounded">
            {(meeting as any).minutes}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-2 bg-gray-100 dark:bg-slate-700/50 p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadMeetingPdf(meeting)}
          className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
        >
          <DocumentTextIcon className="mr-1 h-4 w-4" />
          PDF
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenModal(meeting)}
          className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
        >
          View/Edit
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleDelete(meeting.id)}
          className="!bg-red-500 hover:!bg-red-600 text-white"
        >
          Delete
        </Button>
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
            aria-pressed={viewMode === 'card'}
            aria-label="Card View"
          >
            <ViewGridIcon />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? '' : '!text-gray-600 dark:!text-slate-300'}`}
            aria-pressed={viewMode === 'list'}
            aria-label="List View"
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
              {searchTerm ? `No meeting logs found matching "${searchTerm}".` : 'No meeting logs found. Add one to get started!'}
            </p>
          </CardContent>
        </Card>
      )}

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{filteredMeetings.map((meeting: any) => renderMeetingCard(meeting))}</div>
      ) : (
        <Card className="overflow-x-auto dark:bg-slate-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredMeetings.map((meeting: any) => (
                <tr key={meeting.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100 max-w-xs truncate" title={meeting.title}>
                    {meeting.title}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{formatDateADBS(meeting.meetingDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{meeting.meetingType ? displayStatus(meeting.meetingType) : 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMeetingStatusColor(meeting.status)}`}>
                      {meeting.status ? displayStatus(meeting.status) : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadMeetingPdf(meeting)}
                      className="!p-1.5 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                      title="Download PDF"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(meeting)}
                      className="!p-1.5 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                    >
                      View/Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(meeting.id)}
                      className="!bg-red-500 hover:!bg-red-600 text-white !p-1.5"
                    >
                      Delete
                    </Button>
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
          contentType="meetingLog"
          initialData={editingMeeting as any}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageMeetingsPage;
