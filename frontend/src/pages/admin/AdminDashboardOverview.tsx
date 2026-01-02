
import React, { useMemo, useState, useCallback } from 'react'; 
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from "react-router-dom";
import Button from '../../components/ui/Button';
import { FrontendActivityLog, User } from '../../types';
import { formatTimestampADBS } from '../../dateConverter'; 
import { useNotification } from '../../contexts/NotificationContext';
import { generateJumboAdminReport, AllAdminDataForReport } from '../../../src/utils/adminExportUtils'; 
import { ArrowDownTrayIcon as HeroArrowDownTrayIcon } from '@heroicons/react/24/outline'; 


const ClipboardListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>
        <path fillRule="evenodd" d="M10.5 3.75a.75.75 0 0 1 .75.75V4.5h2.25V3.75a.75.75 0 0 1 1.5 0V4.5h.75A2.25 2.25 0 0 1 18 6.75v10.5A2.25 2.25 0 0 1 15.75 19.5H8.25A2.25 2.25 0 0 1 6 17.25V6.75A2.25 2.25 0 0 1 8.25 4.5h.75V3.75a.75.75 0 0 1 1.5 0Zm2.25 3H8.25V6h4.5v.75Zm-.75 3.75H8.25v1.5h3.75v-1.5Zm0 3H8.25v1.5h3.75v-1.5Z" clipRule="evenodd" />
        <path d="M4.5 6.75A2.25 2.25 0 0 0 2.25 9v9.75A2.25 2.25 0 0 0 4.5 21H15a2.25 2.25 0 0 0 2.25-2.25V18a.75.75 0 0 1-1.5 0v.75a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75V9a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0-1.5H4.5Z" />
    </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6Z" clipRule="evenodd" />
    </svg>
);
const MegaphoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
      <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a.75.75 0 0 0-.75.75v16.5a.75.75 0 0 0 .75.75 9.707 9.707 0 0 0 5.25 1.533c1.573 0 3.07-.39 4.403-1.085a.75.75 0 0 0 .297-1.036A9.744 9.744 0 0 0 15 12c0-1.451.323-2.826.899-4.036a.75.75 0 0 0-.297-1.036A9.707 9.707 0 0 0 11.25 4.533Z" />
      <path d="M12.75 7.5a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Z" />
      <path d="M15 6.75a.75.75 0 0 0-1.5 0v10.5a.75.75 0 0 0 1.5 0V6.75Z" />
      <path d="M3.75 9.75a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Z" />
    </svg>
);

const formatTimeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days <= 7) return `${days} day(s) ago`;
    return formatTimestampADBS(isoString); 
};

// Mapping activity types to user-friendly English strings
const activityTypeToEnglish = (type: FrontendActivityLog['type']): string => {
  const map: Record<FrontendActivityLog['type'], string> = {
    user_registration: 'User Registration',
    user_update: 'User Profile Update',
    content_creation: 'Content Creation',
    content_update: 'Content Update',
    content_deletion: 'Content Deletion',
    donation_logged: 'Donation Logged',
    collection_logged: 'Collection Logged',
    contact_submission: 'Contact Submission',
    contact_status_update: 'Contact Status Update',
    ministry_join_request_submission: 'Ministry Join Request',
    ministry_join_request_status_update: 'Ministry Request Update',
    event_comment_added: 'Event Comment Added',
    sermon_comment_added: 'Sermon Comment Added',
    blog_post_comment_added: 'Blog Post Comment Added',
    history_chapter_comment_added: 'History Chapter Comment',
    news_comment_added: 'News Comment Added',
    prayer_request_submission: 'Prayer Request Submitted',
    prayer_request_status_update: 'Prayer Request Status Updated',
    prayer_request_prayed_for: 'Prayer Request Prayed For',
    testimonial_submission: 'Testimonial Submitted',
    friend_request_sent: 'Friend Request Sent',
    friend_request_accepted: 'Friend Request Accepted',
    friend_request_declined: 'Friend Request Declined',
    friend_removed: 'Friend Removed',
    notification_added: 'Notification Added',
    direct_media_upload: 'Direct Media Upload',
    user_login: 'User Login',
    user_logout: 'User Logout',
    notification_preference_update: 'Notification Preference Update',
    password_change_simulated: 'Password Change (Simulated)',
    forgot_password_request: 'Forgot Password Request',
    password_reset_success: 'Password Reset Success',
    password_reset_failure: 'Password Reset Failure',
    social_login_google: 'Social Login (Google)',
    social_login_x: 'Social Login (X)',
    social_login_facebook: 'Social Login (Facebook)',
    social_login_apple: 'Social Login (Apple)',
    social_login_microsoft: 'Social Login (Microsoft)',
    social_login_github: 'Social Login (GitHub)',
    social_login_linkedin: 'Social Login (LinkedIn)',
    roster_item_created: 'Roster Item Created',
    roster_item_updated: 'Roster Item Updated',
    roster_item_deleted: 'Roster Item Deleted',
    schedule_draft_generated: 'Schedule Draft Generated',
    schedule_draft_updated: 'Schedule Draft Updated',
    schedule_draft_deleted: 'Schedule Draft Deleted',
    schedule_draft_published: 'Schedule Draft Published',
    ad_created: 'Advertisement Created',
    ad_updated: 'Advertisement Updated',
    ad_deleted: 'Advertisement Deleted',
    group_created: 'Group Created',
  };
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


const AdminDashboardOverview: React.FC = () => {
  const content = useContent(); 
  const { userActivityLogs, loadingAuthState, getAllUsers, currentUser, logAdminAction, isOwner } = useAuth();
  const { addNotification } = useNotification();

  const [featureUpdateMessage, setFeatureUpdateMessage] = useState('');
  const [broadcastFeedback, setBroadcastFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isGeneratingJumboReport, setIsGeneratingJumboReport] = useState(false);


  const combinedActivityLogs = useMemo(() => {
    const allLogs: FrontendActivityLog[] = [...content.contentActivityLogs, ...userActivityLogs];
    return allLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0,5); 
  }, [content.contentActivityLogs, userActivityLogs]);


  const quickLinks = [
    {label: "Add New Sermon", path: "/admin/manage-sermons"},
    {label: "Create Event", path: "/admin/manage-events"},
    {label: "New Blog Post", path: "/admin/manage-blog"},
    {label: "Add Home Slide", path: "/admin/manage-home-slides"},
  ];

  const isLoading = content.loadingContent || loadingAuthState;

  const handleBroadcastFeatureUpdate = () => {
    if (!featureUpdateMessage.trim()) {
        setBroadcastFeedback({type: 'error', message: 'Feature update message cannot be empty.'});
        setTimeout(() => setBroadcastFeedback(null), 3000);
        return;
    }
    if (!currentUser || !currentUser.id) {
        setBroadcastFeedback({type: 'error', message: 'Admin user not identified.'});
        return;
    }

    const allUsers = getAllUsers();
    allUsers.forEach(user => {
        addNotification({
            targetUserId: user.id,
            message: `✨ New Feature Update: ${featureUpdateMessage}`,
            link: "/", 
            type: 'feature_update'
        });
    });
    logAdminAction("Broadcasted Feature Update", undefined, `Message: ${featureUpdateMessage}`);
    setBroadcastFeedback({type: 'success', message: `Feature update notification (simulated) sent to ${allUsers.length} users.`});
    setFeatureUpdateMessage('');
    setTimeout(() => setBroadcastFeedback(null), 5000);
  };

  const handleDownloadJumboReport = useCallback(async () => {
    if (!isOwner) {
      alert("Access Denied: Only owners can download this report.");
      return;
    }
    setIsGeneratingJumboReport(true);
    try {
      const allData: AllAdminDataForReport = {
        expenses: content.expenseRecords,
        collections: content.collectionRecords,
        donations: content.donationRecords,
        members: content.churchMembers,
        meetings: content.meetingLogs,
        rosters: content.fellowshipRosters,
        schedules: content.generatedSchedules,
      };
      await generateJumboAdminReport(allData); 
    } catch (error) {
      console.error("Error generating jumbo report:", error);
      alert("Failed to generate jumbo report. Check console for details.");
    } finally {
      setIsGeneratingJumboReport(false);
    }
  }, [isOwner, content]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-1">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">A quick glance at your church application's content and activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-700">Total Sermons</h3></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{isLoading ? '...' : content.sermons.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-700">Total Events</h3></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{isLoading ? '...' : content.events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-700">Registered Users</h3></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{isLoading ? '...' : getAllUsers().length}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader><h3 className="font-semibold text-gray-700">Pending Items</h3></CardHeader>
          <CardContent>
            <div className="text-sm space-y-1 text-slate-600">
                 <p>Join Requests: {isLoading ? '...' : content.ministryJoinRequests.filter(r => r.status === 'pending').length}</p>
                 <p>Contact Messages: {isLoading ? '...' : content.contactMessages.filter(m => m.status === 'pending').length}</p>
                 <p>Prayer Requests (Active): {isLoading ? '...' : content.prayerRequests.filter(p => p.status === 'active').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><h3 className="font-semibold text-gray-700 flex items-center"><ClockIcon className="w-5 h-5 mr-2 text-purple-500" /> Recent Site Activity</h3></CardHeader>
          <CardContent>
            {isLoading ? <p>Loading activity...</p> : combinedActivityLogs.length === 0 ? <p>No recent activity.</p> : (
              <ul className="space-y-3">
                {combinedActivityLogs.map(log => (
                  <li key={log.id} className="text-xs border-b border-slate-100 pb-2 last:border-b-0">
                    <span className="font-medium text-slate-700">{log.description}</span>
                    <span className="text-slate-500 ml-1">({activityTypeToEnglish(log.type)})</span>
                    <p className="text-slate-400 text-[11px]">{formatTimeAgo(log.timestamp)} {log.userId && `by UserID: ${log.userId}`}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 text-right">
                <Button asLink to="/admin/activity-log" variant="ghost" size="sm" className="text-xs">View Full Log</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader><h3 className="font-semibold text-gray-700">Quick Links</h3></CardHeader>
            <CardContent>
                <ul className="space-y-2">
                {quickLinks.map(link => (
                    <li key={link.path}><Link to={link.path} className="text-purple-600 hover:underline text-sm">{link.label}</Link></li>
                ))}
                </ul>
            </CardContent>
        </Card>
      </div>

      {isOwner && (
        <>
            <Card>
            <CardHeader><h3 className="font-semibold text-gray-700 flex items-center"><MegaphoneIcon className="w-5 h-5 mr-2 text-purple-500" /> Broadcast Feature Update</h3></CardHeader>
            <CardContent>
                <textarea 
                    value={featureUpdateMessage} 
                    onChange={e => setFeatureUpdateMessage(e.target.value)} 
                    placeholder="Enter message about a new feature or important site update to notify all users..."
                    rows={3}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                />
                <Button onClick={handleBroadcastFeatureUpdate} variant="primary" size="sm" className="mt-2" disabled={!featureUpdateMessage.trim()}>Broadcast Notification</Button>
                {broadcastFeedback && <p className={`mt-2 text-xs ${broadcastFeedback.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{broadcastFeedback.message}</p>}
            </CardContent>
            </Card>

            <Card>
                <CardHeader><h3 className="font-semibold text-gray-700 flex items-center"><HeroArrowDownTrayIcon className="w-5 h-5 mr-2 text-purple-500"/> Download Admin Data</h3></CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-3">
                        Download a comprehensive Excel report containing key administrative data including expenses, collections, donations, members, meetings, rosters, and schedules. This is for owner use only.
                    </p>
                    <Button onClick={handleDownloadJumboReport} variant="primary" disabled={isGeneratingJumboReport}>
                        {isGeneratingJumboReport ? "Generating Report..." : "Download Jumbo Report (Excel)"}
                    </Button>
                </CardContent>
            </Card>
        </>
      )}

    </div>
  );
};

export default AdminDashboardOverview;