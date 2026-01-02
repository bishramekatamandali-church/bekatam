

import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { HistoryMilestone, HistoryMilestoneFormData, GenericContentFormData } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter'; 

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const ManageHistoryPage: React.FC = () => {
  const { historyMilestones, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<HistoryMilestone | null>(null);

  const sortedMilestones = useMemo(() => 
    [...historyMilestones].sort((a, b) => {
        const yearA = parseInt(a.year);
        const yearB = parseInt(b.year);
        if (!isNaN(yearA) && !isNaN(yearB)) {
            return yearA - yearB;
        }
        return a.year.localeCompare(b.year); 
    }), 
  [historyMilestones]);

  const handleOpenModal = (milestone?: HistoryMilestone) => {
    setEditingMilestone(milestone || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMilestone(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingMilestone) {
      await updateContent('historyMilestone', editingMilestone.id, data as HistoryMilestoneFormData);
    } else {
      await addContent('historyMilestone', data as HistoryMilestoneFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this history milestone?')) {
      await deleteContent('historyMilestone', id);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Manage Church History</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add Milestone
        </Button>
      </div>

      {loadingContent && <p className="text-slate-500">Loading history milestones...</p>}
      
      {!loadingContent && sortedMilestones.length === 0 && (
        <Card>
            <CardContent>
                <p className="text-center text-slate-500 py-8">No history milestones found. Add one to get started!</p>
            </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sortedMilestones.map((milestone) => (
          <Card key={milestone.id} className="flex flex-col sm:flex-row items-start">
            {milestone.imageUrl && (
                <img src={milestone.imageUrl} alt={milestone.title} className="w-full sm:w-40 h-32 sm:h-auto object-cover sm:rounded-l-xl sm:rounded-r-none"/>
            )}
            <div className="flex-grow p-4">
              <h2 className="text-lg font-semibold text-slate-700">{milestone.title} <span className="text-sm text-amber-600">({milestone.year})</span></h2>
              <p className="text-sm text-slate-600 mt-1 line-clamp-3">{milestone.description}</p>
              {/* Optionally display createdAt/updatedAt */}
              {/* {milestone.createdAt && <p className="text-xs text-slate-400 mt-1">Created: {formatTimestampADBS(milestone.createdAt)}</p>} */}
              {/* {milestone.updatedAt && <p className="text-xs text-slate-400">Updated: {formatTimestampADBS(milestone.updatedAt)}</p>} */}
            </div>
            <CardFooter className="flex sm:flex-col sm:items-end sm:justify-start sm:space-y-2 sm:space-x-0 space-x-2 sm:w-auto w-full border-t sm:border-t-0 sm:border-l p-3 bg-slate-50 rounded-b-xl sm:rounded-r-xl sm:rounded-b-none">
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(milestone)}>Edit</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDelete(milestone.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="historyMilestone"
          initialData={editingMilestone}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageHistoryPage;