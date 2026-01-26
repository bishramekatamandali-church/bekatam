import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import { AdminActionLog, FrontendActivityLog } from '../../types';
import Button from '../../components/ui/Button';
import { formatTimestampADBS } from '../../dateConverter';

const ITEMS_PER_PAGE = 10;

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
    notification_added: 'Notification Added',
    direct_media_upload: 'Direct Media Upload',
    user_login: 'User Login',
    user_logout: 'User Logout',
    notification_preference_update: 'Notification Preference Update',
    forgot_password_request: 'Forgot Password Request',
    password_reset_success: 'Password Reset Success',
    password_reset_failure: 'Password Reset Failure',
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
  };
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const paginate = <T,>(items: T[], page: number) => {
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
};

const AdminActivityLogPage: React.FC = () => {
  const { adminActionLogs, loadingAuthState, isAdmin, userActivityLogs } = useAuth();
  const { contentActivityLogs } = useContent();
  const [currentPage, setCurrentPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);

  const sortedSiteLogs = useMemo(() => {
    const allLogs: FrontendActivityLog[] = [...contentActivityLogs, ...userActivityLogs];
    return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [contentActivityLogs, userActivityLogs]);

  const sortedAdminLogs = useMemo(() => {
    return [...adminActionLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [adminActionLogs]);

  const paginatedSiteLogs = useMemo(() => paginate(sortedSiteLogs, currentPage), [sortedSiteLogs, currentPage]);
  const paginatedAdminLogs = useMemo(() => paginate(sortedAdminLogs, adminPage), [sortedAdminLogs, adminPage]);

  const totalSitePages = Math.ceil(sortedSiteLogs.length / ITEMS_PER_PAGE);
  const totalAdminPages = Math.ceil(sortedAdminLogs.length / ITEMS_PER_PAGE);

  if (loadingAuthState) {
    return <p>Loading activity logs...</p>;
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent>
          <p className="text-slate-600 text-center py-8">You do not have permission to view admin activity logs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Activity Log</h1>
        <p className="text-sm text-slate-500">
          A complete timeline of site activity (content + user actions) and administrator actions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-700">Site Activity</h2>
        </CardHeader>
        <CardContent>
          {sortedSiteLogs.length === 0 ? (
            <p className="text-slate-500">No site activities recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Activity</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedSiteLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{formatTimestampADBS(log.timestamp)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{log.description}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{activityTypeToEnglish(log.type)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{log.userId || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {log.itemType ? `${log.itemType}${log.itemId ? ` • ${log.itemId}` : ''}` : log.itemId || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalSitePages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalSitePages}
              </span>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(totalSitePages, prev + 1))}
                disabled={currentPage === totalSitePages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-700">Admin Actions</h2>
        </CardHeader>
        <CardContent>
          {sortedAdminLogs.length === 0 ? (
            <p className="text-slate-500">No admin activities recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Admin</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedAdminLogs.map((log: AdminActionLog) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{formatTimestampADBS(log.timestamp)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                        {log.adminName} <span className="text-xs text-slate-400">(ID: {log.adminId})</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{log.action}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate" title={log.details}>
                        {log.targetId && <span className="text-xs mr-1 text-slate-400">Target ID: {log.targetId}</span>}
                        {log.details || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalAdminPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <Button
                onClick={() => setAdminPage((prev) => Math.max(1, prev - 1))}
                disabled={adminPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {adminPage} of {totalAdminPages}
              </span>
              <Button
                onClick={() => setAdminPage((prev) => Math.min(totalAdminPages, prev + 1))}
                disabled={adminPage === totalAdminPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLogPage;
