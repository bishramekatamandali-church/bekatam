import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import { DonationRecord, GenericContentFormData, DonationRecordFormData, PaymentMethod } from '../../types';
import Button from '../../components/ui/Button';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const ITEMS_PER_PAGE = 10;

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);


const ManageDonationsPage: React.FC = () => {
  const { donationRecords, loadingContent, addContent, updateContent, deleteContent } = useContent();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DonationRecord | null>(null);

  const handleOpenModal = (record?: DonationRecord) => {
    setEditingRecord(record || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    const formData = data as DonationRecordFormData;
    if (editingRecord) {
      await updateContent('donation', editingRecord.id, formData);
    } else {
      await addContent('donation', formData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this donation record? This action cannot be undone.')) {
      await deleteContent('donation', id);
    }
  };


  const sortedRecords = useMemo(() => {
    return [...donationRecords].sort((a, b) => 
      new Date(b.transactionTimestamp).getTime() - new Date(a.transactionTimestamp).getTime()
    );
  }, [donationRecords]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedRecords, currentPage]);

  const totalPages = Math.ceil(sortedRecords.length / ITEMS_PER_PAGE);

  if (loadingContent && donationRecords.length === 0) { 
    return <p className="text-slate-500 p-4">Loading donation records...</p>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Manage Donation Records</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add Donation Record
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-slate-700">Logged Donations</h2>
        </CardHeader>
        <CardContent>
          {donationRecords.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No donations have been logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Donor Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount (NPR)</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Purpose</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Receipt Sent</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Donation Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedRecords.map(record => (
                    <tr key={record.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-medium">{record.donorName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-right">{record.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{record.purpose}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{record.paymentMethod || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 text-center">
                        {record.isReceiptSent ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500 inline-block" title="Yes" />
                        ) : (
                            <XCircleIcon className="w-5 h-5 text-red-500 inline-block" title="No" />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{formatDateADBS(record.donationDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(record)}>Edit</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleDelete(record.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
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
      
      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="donation"
          initialData={editingRecord}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageDonationsPage;
