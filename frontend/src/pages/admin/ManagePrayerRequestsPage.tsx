import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import { PrayerRequest, PrayerRequestStatus, prayerRequestStatusList, PrayerRequestVisibility, prayerRequestVisibilityList } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';

const ITEMS_PER_PAGE = 10;

const ManagePrayerRequestsPage: React.FC = () => {
  const { prayerRequests, updatePrayerRequestStatusByAdmin, deleteContent, loadingContent } = useContent();
  const { currentUser } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<PrayerRequestStatus | 'all'>('all');
  const [filterVisibility, setFilterVisibility] = useState<PrayerRequestVisibility | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newStatus, setNewStatus] = useState<PrayerRequestStatus>('active');
  const [adminNotes, setAdminNotes] = useState('');

  const filteredAndSortedRequests = useMemo(() => {
    return prayerRequests
      .filter(pr => {
        const statusMatch = filterStatus === 'all' || pr.status === filterStatus;
        const visibilityMatch = filterVisibility === 'all' || pr.visibility === filterVisibility;
        const term = searchTerm.toLowerCase();
        const searchMatch = pr.title.toLowerCase().includes(term) || 
                            pr.requestText.toLowerCase().includes(term) ||
                            (pr.userName || 'anonymous').toLowerCase().includes(term);
        return statusMatch && visibilityMatch && searchMatch;
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [prayerRequests, filterStatus, filterVisibility, searchTerm]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedRequests, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedRequests.length / ITEMS_PER_PAGE);

  const openViewModal = (request: PrayerRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const openProcessModal = (request: PrayerRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setAdminNotes(request.adminNotes || '');
    setIsProcessModalOpen(true);
  };
  
  const handleUpdateStatus = async () => {
    if (!selectedRequest || !currentUser) return;
    const success = await updatePrayerRequestStatusByAdmin(selectedRequest.id, newStatus, adminNotes);
    if (success) {
      alert('Prayer request status updated successfully.');
      setIsProcessModalOpen(false);
      setSelectedRequest(null);
    } else {
      alert('Failed to update prayer request status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prayer request? This action cannot be undone.')) {
      await deleteContent('prayerRequest', id);
    }
  };
  
  const getStatusColor = (status: PrayerRequestStatus) => {
    if (status === 'active') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300';
    if (status === 'prayed_for') return 'bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300';
    if (status === 'answered') return 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300';
    if (status === 'archived') return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300';
  };

  if (loadingContent && prayerRequests.length === 0) {
    return <p className="p-4 text-slate-500 dark:text-slate-400">Loading prayer requests...</p>;
  }

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Manage Prayer Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View, update status, and manage submitted prayer requests.</p>
      </header>

      <Card className="dark:bg-slate-800">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">All Requests</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Search by title, text, user..." 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm w-full sm:w-auto bg-white dark:bg-slate-700 dark:text-slate-200"
            />
            <select value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value as any); setCurrentPage(1);}} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm w-full sm:w-auto bg-white dark:bg-slate-700 dark:text-slate-200">
              <option value="all">All Statuses</option>
              {prayerRequestStatusList.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
            </select>
            <select value={filterVisibility} onChange={(e) => {setFilterVisibility(e.target.value as any); setCurrentPage(1);}} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm w-full sm:w-auto bg-white dark:bg-slate-700 dark:text-slate-200">
              <option value="all">All Visibilities</option>
              {prayerRequestVisibilityList.map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedRequests.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              {searchTerm || filterStatus !== 'all' || filterVisibility !== 'all' ? 'No requests match your filters.' : 'No prayer requests submitted yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Submitted By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Visibility</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Prayer Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedRequests.map(pr => (
                    <tr key={pr.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate" title={pr.title}>{pr.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{pr.userName || 'Anonymous'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatDateADBS(pr.submittedAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 capitalize">{pr.visibility}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(pr.status)}`}>
                          {pr.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-center">{pr.prayers.length}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openViewModal(pr)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">View</Button>
                        <Button variant="primary" size="sm" onClick={() => openProcessModal(pr)}>Update Status</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleDelete(pr.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline" size="sm" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Previous</Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline" size="sm" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRequest && isViewModalOpen && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Prayer Request: ${selectedRequest.title}`} size="lg">
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <p><strong>Submitted By:</strong> {selectedRequest.userName || 'Anonymous'} {selectedRequest.userId && `(User ID: ${selectedRequest.userId})`}</p>
            <p><strong>Submitted At:</strong> {formatTimestampADBS(selectedRequest.submittedAt)}</p>
            <p><strong>Visibility:</strong> <span className="capitalize">{selectedRequest.visibility}</span></p>
            <p><strong>Status:</strong> <span className={`font-semibold capitalize ${getStatusColor(selectedRequest.status).split(' ')[0]}`}>{selectedRequest.status.replace('_', ' ')}</span></p>
            <p><strong>Prayer Count:</strong> {selectedRequest.prayers.length}</p>
            {selectedRequest.category && <p><strong>Category:</strong> {selectedRequest.category}</p>}
            <div>
                <p className="font-medium"><strong>Request Details:</strong></p>
                <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded max-h-40 overflow-y-auto whitespace-pre-line">
                    {selectedRequest.requestText}
                </div>
            </div>
            {selectedRequest.adminNotes && (
                <div>
                    <p className="font-medium"><strong>Admin Notes:</strong></p>
                    <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded max-h-32 overflow-y-auto whitespace-pre-line">
                        {selectedRequest.adminNotes}
                    </div>
                </div>
            )}
            <div className="flex justify-end space-x-2 pt-4 border-t dark:border-slate-600">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Close</Button>
              <Button variant="primary" onClick={() => { setIsViewModalOpen(false); openProcessModal(selectedRequest); }}>Update Status</Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedRequest && isProcessModalOpen && (
        <Modal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} title={`Update Status for "${selectedRequest.title}"`} size="md">
          <div className="space-y-4">
            <div>
              <label htmlFor="newStatus" className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Status</label>
              <select
                id="newStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as PrayerRequestStatus)}
                className="mt-1 w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500"
              >
                {prayerRequestStatusList.map(s => <option key={s} value={s} className="capitalize">{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="adminNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Admin Notes (Optional)</label>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Internal notes about this status update..."
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t dark:border-slate-600">
              <Button variant="outline" onClick={() => setIsProcessModalOpen(false)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Cancel</Button>
              <Button variant="primary" onClick={handleUpdateStatus}>Save Status</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManagePrayerRequestsPage;