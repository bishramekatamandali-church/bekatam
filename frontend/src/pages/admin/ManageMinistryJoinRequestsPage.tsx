

import React, { useState, useMemo, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { MinistryJoinRequest, MinistryJoinRequestStatus } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import { Link } from "react-router-dom";

const ITEMS_PER_PAGE = 10;

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
);
const CheckBadgeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
);
const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
);


const ManageMinistryJoinRequestsPage: React.FC = () => {
  const { ministryJoinRequests, updateMinistryJoinRequestStatus, loadingContent } = useContent();
  const { isAdmin } = useAuth(); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<MinistryJoinRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<MinistryJoinRequestStatus>('pending');
  const [filterStatus, setFilterStatus] = useState<'all' | MinistryJoinRequestStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedRequest) {
      setAdminNotes(selectedRequest.adminNotes || '');
      setNewStatus(selectedRequest.status);
    }
  }, [selectedRequest]);

  const filteredAndSortedRequests = useMemo(() => {
    return ministryJoinRequests
      .filter(req => {
        const statusMatch = filterStatus === 'all' || req.status === filterStatus;
        const term = searchTerm.toLowerCase();
        const searchMatch = req.userName.toLowerCase().includes(term) ||
                            req.ministryName.toLowerCase().includes(term) ||
                            req.userEmail.toLowerCase().includes(term);
        return statusMatch && searchMatch;
      })
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }, [ministryJoinRequests, filterStatus, searchTerm]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedRequests, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedRequests.length / ITEMS_PER_PAGE);

  const openViewModal = (request: MinistryJoinRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const openProcessModal = (request: MinistryJoinRequest) => {
    setSelectedRequest(request);
    setIsProcessModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    const success = await updateMinistryJoinRequestStatus(selectedRequest.id, newStatus, adminNotes);
    if (success) {
      alert('Request status updated successfully.');
      setIsProcessModalOpen(false);
      setIsViewModalOpen(false); 
      setSelectedRequest(null);
      setAdminNotes('');
    } else {
      alert('Failed to update status.');
    }
  };
  
  const getStatusColor = (status: MinistryJoinRequestStatus) => {
    if (status === 'approved') return 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300';
    if (status === 'rejected') return 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300';
  };
  
  if (loadingContent && ministryJoinRequests.length === 0) {
      return <p className="p-4 text-slate-500 dark:text-slate-400">Loading ministry join requests...</p>;
  }

  if (!isAdmin) { 
    return (
      <Card><CardContent><p className="text-center text-slate-500 dark:text-slate-400 py-8">You do not have permission to manage ministry join requests.</p></CardContent></Card>
    );
  }

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Manage Ministry Join Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Review and process requests from users to join ministries.</p>
      </header>
      <Card className="dark:bg-slate-800">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">All Requests</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search user or ministry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-slate-200"/>
            <select value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value as any); setCurrentPage(1);}} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-slate-200">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedRequests.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">No requests match the current filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Ministry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Request Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedRequests.map(req => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{req.userName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={req.ministryName}>{req.ministryName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{formatDateADBS(req.requestDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(req.status)}`}>{req.status}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openViewModal(req)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">View</Button>
                        <Button variant="primary" size="sm" onClick={() => openProcessModal(req)}>
                          Process Request
                        </Button>
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
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Request from ${selectedRequest.userName}`} size="lg">
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <p><strong>Ministry:</strong> {selectedRequest.ministryName}</p>
            <p><strong>Requested At:</strong> {formatTimestampADBS(selectedRequest.requestDate)}</p>
            <p><strong>User Email:</strong> <a href={`mailto:${selectedRequest.userEmail}`} className="text-purple-600 hover:underline">{selectedRequest.userEmail}</a></p>
            <div>
                <p className="font-medium"><strong>User's Message:</strong></p>
                <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded max-h-40 overflow-y-auto whitespace-pre-line">{selectedRequest.message || '(No message provided)'}</div>
            </div>
            <div>
                <p className="font-medium"><strong>Ministry Guidelines (at time of request):</strong></p>
                <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded max-h-40 overflow-y-auto whitespace-pre-line">{selectedRequest.ministryGuidelines || '(No guidelines recorded)'}</div>
            </div>
            {selectedRequest.adminNotes && (
              <div>
                <p className="font-medium"><strong>Admin Notes:</strong></p>
                <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded max-h-32 overflow-y-auto whitespace-pre-line">{selectedRequest.adminNotes}</div>
              </div>
            )}
             <div className="flex justify-end space-x-2 pt-4 border-t dark:border-slate-600">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Close</Button>
                 <Button variant="primary" onClick={() => { setIsViewModalOpen(false); openProcessModal(selectedRequest); }}>
                    Process Request
                 </Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedRequest && isProcessModalOpen && (
        <Modal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} title={`Process Request for ${selectedRequest.userName}`} size="md">
           <div className="space-y-4">
            <div>
              <label htmlFor="newStatus" className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Status</label>
              <select id="newStatus" value={newStatus} onChange={(e) => setNewStatus(e.target.value as MinistryJoinRequestStatus)} className="mt-1 w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label htmlFor="adminNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Admin Notes (Optional)</label>
              <textarea id="adminNotes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="mt-1 w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200" placeholder="Notes for processing this request..."/>
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

export default ManageMinistryJoinRequestsPage;