
import React, { useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { Ministry, MinistryFormData, GenericContentFormData } from '../../types';

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const ManageMinistriesPage: React.FC = () => {
  const { ministries, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);

  const handleOpenModal = (ministry?: Ministry) => {
    setEditingMinistry(ministry || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMinistry(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingMinistry) {
      await updateContent('ministry', editingMinistry.id, data as MinistryFormData);
    } else {
      await addContent('ministry', data as MinistryFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ministry?')) {
      await deleteContent('ministry', id);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Ministries</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add Ministry
        </Button>
      </div>

      {loadingContent && <p className="text-gray-500">Loading ministries...</p>}
      {!loadingContent && ministries.length === 0 && (
         <Card><CardContent><p className="text-center text-gray-500 py-8">No ministries found. Add one to get started!</p></CardContent></Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ministries.map((ministry) => (
          <Card key={ministry.id} className="flex flex-col">
             {ministry.imageUrl && <img src={ministry.imageUrl} alt={ministry.title} className="w-full h-40 object-cover"/>}
            <CardHeader className="flex-grow">
              <h2 className="text-lg font-semibold text-gray-700 truncate" title={ministry.title}>{ministry.title}</h2>
              <p className="text-xs text-gray-500">{ministry.leader} - {ministry.meetingTime}</p>
               <p className="text-xs text-purple-600 mt-1">{ministry.category}</p>
            </CardHeader>
            <CardContent className="py-2 px-4 h-20 overflow-hidden">
              <p className="text-xs text-gray-600 text-ellipsis">{ministry.description}</p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(ministry)}>Edit</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDelete(ministry.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="ministry"
          initialData={editingMinistry}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageMinistriesPage;