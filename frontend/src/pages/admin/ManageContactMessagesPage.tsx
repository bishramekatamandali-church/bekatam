

import React, { useState, useMemo, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ContactMessage } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter'; 


const ITEMS_PER_PAGE = 10;

const ManageContactMessagesPage: React.FC = () => {
  const { contactMessages, updateContactMessageStatus, loadingContent } = useContent();
  const { isOwner } = useAuth(); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyNote, setReplyNote] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'replied'>('all');

  const sortedMessages = useMemo(() => {
    return [...contactMessages]
        .filter(msg => filterStatus === 'all' || msg.status === filterStatus)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [contactMessages, filterStatus]);

  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedMessages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedMessages, currentPage]);

  const totalPages = Math.ceil(sortedMessages.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (selectedMessage) {
      setReplyNote(selectedMessage.replyNote || '');
    }
  }, [selectedMessage]);

  const openViewModal = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsViewModalOpen(true);
  };

  const openReplyModal = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsReplyModalOpen(true);
  };

  const handleUpdateStatus = async (status: 'replied' | 'pending') => {
    if (!selectedMessage) return;
    await updateContactMessageStatus(selectedMessage.id, status, status === 'replied' ? replyNote : undefined);
    setIsReplyModalOpen(false);
    setIsViewModalOpen(false); 
    setSelectedMessage(null);
    setReplyNote('');
  };
  
  if (loadingContent && contactMessages.length === 0) {
      return <p className="text-slate-500 p-4">Loading messages...</p>;
  }

  if (!isOwner) { 
    return (
      <Card><CardContent><p className="text-center text-slate-500 py-8">You do not have permission to manage contact messages.</p></CardContent></Card>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Manage Contact Messages</h1>
        <p className="text-sm text-slate-500">Review and manage messages submitted through the contact form.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h2 className="text-xl font-semibold text-slate-700 mb-2 sm:mb-0">Submitted Messages</h2>
          <div className="flex space-x-2">
            <select value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value as any); setCurrentPage(1);}} className="p-2 border border-slate-300 rounded-md text-sm bg-white">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="replied">Replied</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedMessages.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No messages match the current filter, or no messages submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedMessages.map(msg => (
                    <tr key={msg.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{formatTimestampADBS(msg.submittedAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{msg.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{msg.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 truncate max-w-xs" title={msg.subject}>{msg.subject}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${msg.status === 'replied' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openViewModal(msg)}>View</Button>
                        <Button variant="primary" size="sm" onClick={() => openReplyModal(msg)}>
                          {msg.status === 'replied' ? 'Edit Reply Note' : 'Reply/Log'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline" size="sm">Previous</Button>
              <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline" size="sm">Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isViewModalOpen && selectedMessage && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Message from ${selectedMessage.name}`} size="lg">
          <div className="space-y-4">
            <p><strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})</p>
            <p><strong>Subject:</strong> {selectedMessage.subject}</p>
            <p><strong>Submitted:</strong> {formatTimestampADBS(selectedMessage.submittedAt)}</p>
            <div className="p-3 bg-slate-50 rounded border max-h-60 overflow-y-auto">
              <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
            <p><strong>Status:</strong> <span className={`font-semibold ${selectedMessage.status === 'replied' ? 'text-green-600' : 'text-yellow-600'}`}>{selectedMessage.status.toUpperCase()}</span></p>
            {selectedMessage.status === 'replied' && (
              <>
                <p><strong>Replied At:</strong> {formatTimestampADBS(selectedMessage.repliedAt)}</p>
                <p><strong>Admin Reply Note:</strong></p>
                <div className="p-3 bg-blue-50 rounded border max-h-40 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm">{selectedMessage.replyNote || '(No note added)'}</p>
                </div>
              </>
            )}
            <div className="flex justify-end space-x-2 pt-3 border-t">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                 <Button variant="primary" onClick={() => { setIsViewModalOpen(false); openReplyModal(selectedMessage); }}>
                    {selectedMessage.status === 'replied' ? 'Edit Reply Note' : 'Log Reply'}
                 </Button>
            </div>
          </div>
        </Modal>
      )}

      {isReplyModalOpen && selectedMessage && (
        <Modal isOpen={isReplyModalOpen} onClose={() => setIsReplyModalOpen(false)} title={`Respond to ${selectedMessage.name}`} size="md">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">This form is for internal logging of your reply. You should send the actual reply via your email client.</p>
            <div>
              <label htmlFor="replyNote" className="block text-sm font-medium text-slate-700">Admin Reply Note (Internal)</label>
              <textarea
                id="replyNote"
                value={replyNote}
                onChange={(e) => setReplyNote(e.target.value)}
                rows={4}
                className="mt-1 w-full p-2 border border-slate-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                placeholder="E.g., Replied on [Date] regarding [Topic]. Advised to..."
              />
            </div>
             <div className="flex items-center justify-between pt-3 border-t">
                <div>
                    {selectedMessage.status === 'replied' && (
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus('pending')} className="text-yellow-600 hover:bg-yellow-50">
                            Mark as Pending
                        </Button>
                    )}
                </div>
                <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsReplyModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => handleUpdateStatus('replied')}>
                        Save & Mark as Replied
                    </Button>
                </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageContactMessagesPage;