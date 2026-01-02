

import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { MonthlyThemeImage, MonthlyThemeImageFormData, GenericContentFormData } from '../../types';

// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const BS_MONTH_NAMES_EN = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra",
  "Ashwin", "Kartik", "Mangsir", "Poush", "Magh",
  "Falgun", "Chaitra"
];


const ManageMonthlyThemeImagesPage: React.FC = () => {
  const { monthlyThemeImages, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingThemeImage, setEditingThemeImage] = useState<MonthlyThemeImage | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);


  const sortedThemeImages = useMemo(() => 
    [...monthlyThemeImages].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year; // BS Year
      return b.month - a.month; // BS Month
    }), 
  [monthlyThemeImages]);

  const handleOpenModal = (image?: MonthlyThemeImage) => {
    setEditingThemeImage(image || null);
    setIsModalOpen(true);
    setFeedbackMessage(null); 
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingThemeImage(null);
  };

  const showFeedback = (message: string, error: boolean = false) => {
    setFeedbackMessage(message);
    setIsError(error);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    let result: { success: boolean; message?: string; newItem?: any; updatedItem?: any };
    const action = editingThemeImage ? 'updated' : 'added';
    try {
      const formData = data as MonthlyThemeImageFormData;
      if (formData.year < 2070 || formData.year > 2150) {
         showFeedback('Invalid BS Year. Please enter a valid BS year (e.g., 2081).', true);
         return;
      }
       if (!formData.imageUrlsString?.trim()) {
        showFeedback('At least one Image URL is mandatory.', true);
        return;
      }
      
      if (editingThemeImage) {
        result = await updateContent('monthlyThemeImage', editingThemeImage.id, formData);
      } else {
        result = await addContent('monthlyThemeImage', formData);
      }
      
      if (result.success) {
        showFeedback(`Theme image ${action} successfully!`);
        handleCloseModal();
      } else {
        showFeedback(result.message || `Failed to ${action.slice(0,-2)} theme image. The selected Year/Month might already exist or data is invalid.`, true);
      }
    } catch (e) {
       showFeedback(`Error ${action.slice(0,-2).replace('e','i')}ing theme image: ${(e as Error).message}`, true);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this theme image?')) {
      try {
        const success = await deleteContent('monthlyThemeImage', id);
        if (success) {
          showFeedback('Theme image deleted successfully!');
        } else {
          showFeedback('Failed to delete theme image.', true);
        }
      } catch (e) {
        showFeedback(`Error deleting theme image: ${(e as Error).message}`, true);
      }
    }
  };

  const getBsMonthName = (bsMonthNumber: number) => {
    if (bsMonthNumber < 1 || bsMonthNumber > 12) return "Invalid Month";
    return BS_MONTH_NAMES_EN[bsMonthNumber - 1];
  };
  

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage PDF Monthly Theme Images</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add Theme Image
        </Button>
      </div>

      {feedbackMessage && (
        <div className={`p-3 mb-4 rounded-md text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`} role="alert">
          {feedbackMessage}
        </div>
      )}

      {loadingContent && <p className="text-gray-500">Loading theme images...</p>}
      
      {!loadingContent && sortedThemeImages.length === 0 && (
        <Card>
            <CardContent>
                <p className="text-center text-gray-500 py-8">No theme images found. Add one to customize your PDF calendars!</p>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedThemeImages.map((image) => {
          const firstImageUrl = Array.isArray(image.imageUrls) && image.imageUrls.length > 0 ? image.imageUrls[0] : 'https://picsum.photos/seed/defaulttheme/300/200';
          const additionalImagesCount = Array.isArray(image.imageUrls) ? image.imageUrls.length - 1 : 0;

          return (
            <Card key={image.id} className="flex flex-col group">
              <div className="relative h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                <img src={firstImageUrl} alt={`Theme for ${getBsMonthName(image.month)} ${image.year} BS`} className="w-full h-full object-cover"/>
                {additionalImagesCount > 0 && (
                  <span className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                    +{additionalImagesCount} more
                  </span>
                )}
                {image.quoteOrCaption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-70 text-white text-xs text-center line-clamp-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    {image.quoteOrCaption}
                  </div>
                )}
              </div>
              <CardHeader className="flex-grow py-3">
                <h2 className="text-md font-semibold text-gray-700">
                  {getBsMonthName(image.month)} {image.year} BS 
                </h2>
              </CardHeader>
              <CardFooter className="flex justify-end space-x-2 bg-gray-50 p-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenModal(image)} className="text-xs">Edit</Button>
                <Button variant="secondary" size="sm" onClick={() => handleDelete(image.id)} className="!bg-red-500 hover:!bg-red-600 text-white text-xs">Delete</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="monthlyThemeImage"
          initialData={editingThemeImage}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageMonthlyThemeImagesPage;