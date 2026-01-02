import React, { useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { KeyPerson, KeyPersonFormData, GenericContentFormData } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter'; 

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const ManageKeyPersonsPage: React.FC = () => {
  const { keyPersons, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<KeyPerson | null>(null);

  const handleOpenModal = (person?: KeyPerson) => {
    setEditingPerson(person || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPerson(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingPerson) {
      await updateContent('keyPerson', editingPerson.id, data as KeyPersonFormData);
    } else {
      await addContent('keyPerson', data as KeyPersonFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      await deleteContent('keyPerson', id);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Manage Key Persons</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add Key Person
        </Button>
      </div>

      {loadingContent && <p className="text-slate-500">Loading key persons...</p>}
      
      {!loadingContent && keyPersons.length === 0 && (
        <Card>
            <CardContent>
                <p className="text-center text-slate-500 py-8">No key persons found. Add one to get started!</p>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {keyPersons.map((person) => (
          <Card key={person.id} className="flex flex-col">
            {person.imageUrl && <img src={person.imageUrl} alt={person.name} className="w-full h-48 object-cover"/>}
            <CardHeader className="flex-grow">
              <h2 className="text-lg font-semibold text-slate-700 truncate" title={person.name}>{person.name}</h2>
              <p className="text-sm text-amber-600">{person.role}</p>
            </CardHeader>
            <CardContent className="py-2 px-4 h-24 overflow-hidden">
              <p className="text-xs text-slate-600 text-ellipsis line-clamp-4">{person.bio}</p>
              {/* Optionally display createdAt/updatedAt */}
              {/* {person.createdAt && <p className="text-xs text-slate-400 mt-1">Created: {formatTimestampADBS(person.createdAt)}</p>} */}
              {/* {person.updatedAt && <p className="text-xs text-slate-400">Updated: {formatTimestampADBS(person.updatedAt)}</p>} */}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 bg-slate-50">
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(person)}>Edit</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDelete(person.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="keyPerson"
          initialData={editingPerson}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageKeyPersonsPage;