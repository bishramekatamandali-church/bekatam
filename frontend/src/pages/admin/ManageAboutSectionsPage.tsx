
import React, { useState, useEffect, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { AboutSection, AboutSectionFormData, GenericContentFormData, CoreAboutSectionId, coreAboutSectionIds } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter'; 

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
);
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75H4.5a.75.75 0 000 1.5h11a.75.75 0 000-1.5H14A2.75 2.75 0 0011.25 1H8.75zM10 4.75a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5A.75.75 0 0110 4.75zM6.53 4.5c-.16 0-.313.006-.462.017L4.96 16.02A2.25 2.25 0 007.197 18.5h5.606a2.25 2.25 0 002.237-2.48l-1.108-11.504A3.001 3.001 0 0013.47 4.5H6.53z" clipRule="evenodd" /></svg>
);


const ManageAboutSectionsPage: React.FC = () => {
  const { aboutSections, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<AboutSection | null>(null);

  const sortedSections = useMemo(() => {
    return [...aboutSections].sort((a, b) => {
      if (a.isCoreSection && !b.isCoreSection) return -1;
      if (!a.isCoreSection && b.isCoreSection) return 1;
      if (a.isCoreSection && b.isCoreSection) {
        return (coreAboutSectionIds.indexOf(a.id as CoreAboutSectionId) || 99) - (coreAboutSectionIds.indexOf(b.id as CoreAboutSectionId) || 99);
      }
      return (a.displayOrder || 999) - (b.displayOrder || 999);
    });
  }, [aboutSections]);

  const handleOpenModal = (section?: AboutSection) => {
    setEditingSection(section || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSection(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingSection) {
      await updateContent('aboutSection', editingSection.id, data as AboutSectionFormData);
    } else {
      // For adding new custom sections, ID will be generated in context. Display order needs careful handling if manual.
      await addContent('aboutSection', data as AboutSectionFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    const section = aboutSections.find(s => s.id === id);
    if (section && section.isCoreSection) {
      alert("Core sections cannot be deleted.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this section?')) {
      await deleteContent('aboutSection', id);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Manage About Page Sections</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add Custom Section
        </Button>
      </div>

      {loadingContent && <p className="text-slate-500">Loading sections...</p>}
      
      {!loadingContent && sortedSections.length === 0 && (
        <Card>
            <CardContent>
                <p className="text-center text-slate-500 py-8">No sections found. Core sections should initialize. Add custom sections to expand.</p>
            </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sortedSections.map((section) => (
          <Card key={section.id} className="flex flex-col sm:flex-row items-start">
            {section.imageUrl && (
                <img src={section.imageUrl} alt={section.title} className="w-full sm:w-48 h-32 sm:h-auto object-cover sm:rounded-l-xl sm:rounded-r-none"/>
            )}
            <div className="flex-grow p-4">
              <h2 className="text-lg font-semibold text-slate-700">{section.title}</h2>
              <p className="text-xs text-slate-500">
                {section.isCoreSection ? <span className="text-purple-600 font-medium">Core Section</span> : `Custom Section (Order: ${section.displayOrder})`}
              </p>
              <p className="text-sm text-slate-600 mt-1 line-clamp-3" title={section.content}>{section.content}</p>
              {section.updatedAt && <p className="text-xs text-slate-400 mt-2">Last updated: {formatTimestampADBS(section.updatedAt)}</p>}
            </div>
            <CardFooter className="flex sm:flex-col sm:items-end sm:justify-start sm:space-y-2 sm:space-x-0 space-x-2 sm:w-auto w-full border-t sm:border-t-0 sm:border-l p-3 bg-slate-50 rounded-b-xl sm:rounded-r-xl sm:rounded-b-none">
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(section)}>
                <EditIcon className="mr-1 h-4 w-4"/>Edit
              </Button>
              {!section.isCoreSection && (
                <Button variant="secondary" size="sm" onClick={() => handleDelete(section.id)} className="!bg-red-500 hover:!bg-red-600 text-white">
                  <TrashIcon className="mr-1 h-4 w-4"/>Delete
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="aboutSection"
          initialData={editingSection}
          isLoading={loadingContent}
          isCoreSectionEditing={editingSection?.isCoreSection}
        />
      )}
    </div>
  );
};

export default ManageAboutSectionsPage;