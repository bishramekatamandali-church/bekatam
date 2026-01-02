import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import { AdminActionLog } from '../../types';
import Button from '../../components/ui/Button';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter'; 


const ITEMS_PER_PAGE = 10;

const AdminActivityLogPage: React.FC = () => {
  const { adminActionLogs, loadingAuthState, isOwner } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  const sortedLogs = useMemo(() => {
    return [...adminActionLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [adminActionLogs]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedLogs, currentPage]);

  const totalPages = Math.ceil(sortedLogs.length / ITEMS_PER_PAGE);

  if (loadingAuthState) {
    return <p>Loading activity logs...</p>;
  }

  if (!isOwner) {
    return (
        <Card>
            <CardContent>
                <p className="text-slate-600 text-center py-8">You do not have permission to view admin activity logs.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Admin Activity Log</h1>
        <p className="text-sm text-slate-500">Records of actions performed by administrators.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-700">Activity Records</h2>
        </CardHeader>
        <CardContent>
          {adminActionLogs.length === 0 ? (
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
                  {paginatedLogs.map(log => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{formatTimestampADBS(log.timestamp)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{log.adminName} <span className="text-xs text-slate-400">(ID: {log.adminId})</span></td>
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
          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <Button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages}
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