
import React, { useMemo } from 'react';
import { useParams, Link } from "react-router-dom";
import { useContent } from '../contexts/ContentContext';
import { FellowshipRosterItem, GeneratedScheduleItem, FellowshipProgramItemType, FellowshipProgramDetailType, Responsibility } from '../types';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatDateADBS, formatTimestampADBS } from '../dateConverter';
import { 
  CalendarDaysIcon, 
  MapPinIcon as LocationMarkerIcon, 
  UsersIcon, 
  MicrophoneIcon, 
  UserGroupIcon, 
  ClockIcon, 
  TagIcon, 
  LinkIcon as HeroLinkIcon,
  PencilIcon, 
  InformationCircleIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserCircleIcon as PostedByIcon 
} from '@heroicons/react/24/outline';

// Helper to parse additional details string into a key-value object for display
const parseDetailsString = (detailsString?: string): Record<string, string> => {
  if (!detailsString) return {};
  const details: Record<string, string> = {};
  const lines = detailsString.split('\n');
  lines.forEach(line => {
    const parts = line.split(/:(.*)/s); // Split only on the first colon
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts[1].trim();
      if (value) details[key] = value;
    }
  });
  return details;
};

const formatLabelFromKey = (key: string): string => {
    return key.split('.').pop()?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) || key;
};


const FellowshipProgramDetailPage: React.FC = () => {
  const { itemType, itemId } = useParams<{ itemType: FellowshipProgramItemType; itemId: string }>();
  const { getContentById, loadingContent } = useContent();

  const programItem = useMemo<FellowshipProgramDetailType | undefined>(() => {
    if (!itemId || !itemType) return undefined;
    const contentType = itemType === 'roster' ? 'fellowshipRoster' : 'generatedSchedule';
    return getContentById(contentType, itemId) as FellowshipProgramDetailType | undefined;
  }, [itemType, itemId, getContentById]);

  if (loadingContent) {
    return <div className="container mx-auto px-4 py-12 text-center text-slate-600 dark:text-slate-300">Loading program details...</div>;
  }

  if (!programItem) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-slate-700 dark:text-slate-100">Program Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">The fellowship program you are looking for does not exist or has been moved.</p>
        <Button asLink to="/admin/manage-fellowship-schedules" variant="primary" className="mt-6">
          Back to Schedules Management
        </Button>
      </div>
    );
  }

  const isRoster = itemType === 'roster';
  const rosterData = isRoster ? (programItem as FellowshipRosterItem) : null;
  const scheduleData = !isRoster ? (programItem as GeneratedScheduleItem) : null;
  
  // Parse additional details only once
  const specificDetails = useMemo(() => 
    parseDetailsString(rosterData?.additionalNotesOrProgramDetails || scheduleData?.additionalNotesOrProgramDetails),
    [rosterData, scheduleData]
  );

  const renderDetailRow = (labelKey: string, value?: string | null | boolean, iconElement?: React.ReactElement<{ className?: string }>, linkTo?: string) => {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    let displayValue = String(value);
    if (typeof value === 'boolean') displayValue = value ? 'Yes' : 'No';
    
    const iconWithClass = iconElement ? React.cloneElement(iconElement, { className: "w-5 h-5 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0" }) : null;
    const label = formatLabelFromKey(labelKey);

    return (
      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-start">
        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center">
          {iconWithClass}
          <span>{label}</span>
        </dt>
        <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2 whitespace-pre-line break-words">
          {linkTo ? <Link to={linkTo} className="text-purple-600 hover:underline dark:text-purple-400">{displayValue}</Link> : displayValue}
        </dd>
      </div>
    );
  };

  return (
    <div className="py-10 min-h-screen">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto shadow-xl dark:bg-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {programItem.groupNameOrEventTitle}
            </h1>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">{programItem.rosterType}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ID: {programItem.id}</p>
          </CardHeader>
          <CardContent className="divide-y divide-slate-200 dark:divide-slate-700">
            <div className="py-3">
                {renderDetailRow('admin.viewDetails.scheduledDate', formatDateADBS(isRoster ? rosterData!.assignedDate : scheduleData!.scheduledDate), <CalendarDaysIcon />)}
                {renderDetailRow('admin.viewDetails.timeSlot', programItem.timeSlot, <ClockIcon />)}
                {renderDetailRow('admin.viewDetails.location', programItem.location, <LocationMarkerIcon />)}
            </div>
            <div className="py-3">
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center">
                    <UsersIcon className="w-5 h-5 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span>Responsibilities</span>
                </dt>
                <dd className="mt-2 text-sm text-slate-900 dark:text-slate-100 sm:col-span-3 space-y-2 pl-7">
                    {(programItem.responsibilities || []).length > 0 ? (
                        (programItem.responsibilities || []).map(resp => (
                            <div key={resp.id} className="flex">
                                <span className="font-medium w-32 flex-shrink-0">{resp.role}:</span>
                                <span>{resp.assignedTo}</span>
                            </div>
                        ))
                    ) : (
                        <p>No specific responsibilities listed.</p>
                    )}
                </dd>
            </div>
            <div className="py-3">
                {renderDetailRow('admin.viewDetails.contactNumber', programItem.contactNumber, <InformationCircleIcon />)}
            </div>
            
            {isRoster && renderDetailRow('admin.viewDetails.isTemplate', rosterData!.isTemplate, <TagIcon />)}
            
            {!isRoster && scheduleData && (
              <div className="py-3">
                {renderDetailRow('admin.viewDetails.isPublishedAsEvent', scheduleData.isPublishedAsEvent ? "Published as Event" : "Draft", <InformationCircleIcon />)}
                {scheduleData.isPublishedAsEvent && scheduleData.publishedEventId && 
                  renderDetailRow('admin.viewDetails.publishedEventId', "View Public Event", <HeroLinkIcon />, `/events/${scheduleData.publishedEventId}`)
                }
                {renderDetailRow('admin.viewDetails.generatedAt', formatTimestampADBS(scheduleData.generatedAt), <PencilIcon />)}
                {scheduleData.basedOnRosterItemId && renderDetailRow('admin.viewDetails.basedOnRosterItemId', "View Source Roster", <HeroLinkIcon />, `/fellowship-program/roster/${scheduleData.basedOnRosterItemId}`)}
              </div>
            )}
            
            {Object.keys(specificDetails).length > 0 && (
                <div className="py-3">
                    <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center">
                       <DocumentTextIcon className="w-5 h-5 mr-2 text-slate-400 dark:text-slate-500" />
                       Specific Program Details:
                    </h4>
                    <dl className="pl-7 space-y-1">
                    {Object.entries(specificDetails).map(([key, value]) => 
                        <div key={key} className="text-sm text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{key}:</span> {value}
                        </div>
                    )}
                    </dl>
                </div>
            )}
            
            {((isRoster && !rosterData?.additionalNotesOrProgramDetails?.trim()) || (!isRoster && !scheduleData?.additionalNotesOrProgramDetails?.trim())) && Object.keys(specificDetails).length === 0 &&
                renderDetailRow("Additional Details/Notes", "N/A", <DocumentTextIcon />)
            }
            
            {(!isRoster && scheduleData?.adminNotes) && (
                <div className="py-3">
                   {renderDetailRow('admin.viewDetails.adminNotes', scheduleData.adminNotes, <PencilIcon />)}
                </div>
            )}

            <div className="py-3">
                {programItem.postedByOwnerName && renderDetailRow('admin.viewDetails.postedBy', programItem.postedByOwnerName, <PostedByIcon/>)}
                {programItem.createdAt && renderDetailRow('admin.viewDetails.createdAt', formatTimestampADBS(programItem.createdAt), <ClockIcon/>)}
                {programItem.updatedAt && programItem.updatedAt !== programItem.createdAt && renderDetailRow('admin.viewDetails.updatedAt', formatTimestampADBS(programItem.updatedAt), <ClockIcon/>)}
            </div>

          </CardContent>
          <CardFooter>
            <Button asLink to="/admin/manage-fellowship-schedules" variant="outline" className="dark:text-purple-300 dark:border-purple-500 dark:hover:bg-purple-700 dark:hover:text-white">
              Back to Schedules Management
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default FellowshipProgramDetailPage;
