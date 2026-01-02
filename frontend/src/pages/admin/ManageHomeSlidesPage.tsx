import React, { useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { HomeSlide, HomeSlideFormData, GenericContentFormData } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter'; 

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a.75.75 0 010-1.113ZM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" /></svg>
);

const EyeSlashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113Z" /><path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A5.25 5.25 0 0015.75 12ZM12.53 15.713l-4.244-4.243a5.25 5.25 0 006.71 6.71L12.53 15.713Z" /><path d="M20.35 18.251A11.249 11.249 0 0112.001 21.75c-4.97 0-9.185-3.223-10.675-7.69a.75.75 0 010-1.113l.923-.923a.75.75 0 00-.068.002L1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75a11.217 11.217 0 013.356.565L14.47 5.54a.75.75 0 00-.067-.003Z" /></svg>
);


const ManageHomeSlidesPage: React.FC = () => {
  const { homeSlides, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);

  const sortedSlides = React.useMemo(() => 
    [...homeSlides].sort((a, b) => a.order - b.order), 
  [homeSlides]);

  const handleOpenModal = (slide?: HomeSlide) => {
    setEditingSlide(slide || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSlide(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingSlide) {
      await updateContent('homeSlide', editingSlide.id, data as HomeSlideFormData);
    } else {
      await addContent('homeSlide', data as HomeSlideFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this home slide?')) {
      await deleteContent('homeSlide', id);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Home Slides</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add Home Slide
        </Button>
      </div>

      {loadingContent && <p className="text-gray-500">Loading slides...</p>}
      
      {!loadingContent && sortedSlides.length === 0 && (
        <Card>
            <CardContent>
                <p className="text-center text-gray-500 py-8">No home slides found. Add one to get started!</p>
            </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sortedSlides.map((slide) => (
          <Card key={slide.id} className="flex flex-col sm:flex-row items-start">
            <img src={slide.imageUrl} alt={slide.title} className="w-full sm:w-48 h-32 sm:h-auto object-cover sm:rounded-l-xl sm:rounded-r-none"/>
            <div className="flex-grow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700" title={slide.title}>{slide.title}</h2>
                        <p className="text-xs text-gray-500">Order: {slide.order} &bull; Links to: {slide.linkPath}</p>
                    </div>
                    {slide.isActive ? <EyeIcon className="w-5 h-5 text-green-500" /> : <EyeSlashIcon className="w-5 h-5 text-gray-400" />}
                </div>
              </CardHeader>
              <CardContent className="pt-1 pb-2 text-sm text-gray-600">
                <p className="line-clamp-2">{slide.description}</p>
                <p className="text-xs mt-1">CTA: "{slide.ctaText}"</p>
                {/* Optionally display createdAt/updatedAt */}
                {/* {slide.createdAt && <p className="text-xs text-gray-400 mt-1">Created: {formatTimestampADBS(slide.createdAt)}</p>} */}
                {/* {slide.updatedAt && <p className="text-xs text-gray-400">Updated: {formatTimestampADBS(slide.updatedAt)}</p>} */}
              </CardContent>
            </div>
            <CardFooter className="flex sm:flex-col sm:items-end sm:justify-start sm:space-y-2 sm:space-x-0 space-x-2 sm:w-auto w-full border-t sm:border-t-0 sm:border-l p-3 bg-gray-50 rounded-b-xl sm:rounded-r-xl sm:rounded-b-none">
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(slide)}>Edit</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDelete(slide.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="homeSlide"
          initialData={editingSlide}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageHomeSlidesPage;