

import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { DirectMediaItem, DirectMediaFormData, GenericContentFormData } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';

// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);
const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 0v9.5c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-9.5a.75.75 0 00-.75-.75H3.25a.75.75 0 00-.75.75zm6.75 2.5a.75.75 0 00-1.5 0v1.5h-1.5a.75.75 0 000 1.5h1.5v1.5a.75.75 0 001.5 0v-1.5h1.5a.75.75 0 000-1.5h-1.5v-1.5z" clipRule="evenodd" /></svg>
);
const VideoCameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-2.318a.75.75 0 00-.52-.714l-.75-.25a.75.75 0 01-.52-.714V8.25A2.25 2.25 0 008.75 6H6.5a.75.75 0 010-1.5h2.25A3.75 3.75 0 0112.5 8.25v1.086l.75.25a2.25 2.25 0 011.57 2.144V13.75A3.75 3.75 0 0110.75 17.5h-7.5A3.75 3.75 0 01-.5 13.75v-7.5A3.75 3.75 0 013.25 2.5H6a.75.75 0 010 1.5H3.25z" /><path d="M15 7.75a2.75 2.75 0 00-2.75 2.75v3A2.75 2.75 0 0015 16.25h2.25A2.75 2.75 0 0020 13.5v-3A2.75 2.75 0 0017.25 7.75H15zM14.25 13.5V10.5a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0z" /></svg>
);

const ManageDirectMediaPage: React.FC = () => {
  const { directMediaItems, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<DirectMediaItem | null>(null);

  const sortedMedia = useMemo(() => 
    [...directMediaItems].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()), 
  [directMediaItems]);

  const handleOpenModal = (media?: DirectMediaItem) => {
    setEditingMedia(media || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMedia(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingMedia) {
      await updateContent('directMedia', editingMedia.id, data as DirectMediaFormData);
    } else {
      await addContent('directMedia', data as DirectMediaFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this media item? This action cannot be undone.')) {
      await deleteContent('directMedia', id);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Direct Media Uploads</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add New Media
        </Button>
      </div>

      {loadingContent && <p className="text-gray-500">Loading media items...</p>}
      
      {!loadingContent && sortedMedia.length === 0 && (
        <Card>
            <CardContent>
                <p className="text-center text-gray-500 py-8">No media items found. Upload one to get started!</p>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedMedia.map((media) => (
          <Card key={media.id} className="flex flex-col">
            <div className="relative h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
              {media.mediaType === 'image' ? (
                <img src={media.url} alt={media.title} className="w-full h-full object-cover"/>
              ) : (
                <video src={media.url} className="w-full h-full object-cover" controlsList="nodownload nofullscreen" preload="metadata" />
              )}
               <span className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded capitalize flex items-center">
                {media.mediaType === 'image' ? <PhotoIcon className="w-3 h-3 mr-1"/> : <VideoCameraIcon className="w-3 h-3 mr-1"/>}
                {media.mediaType}
              </span>
            </div>
            <CardHeader className="flex-grow">
              <h2 className="text-md font-semibold text-gray-700 truncate" title={media.title}>{media.title}</h2>
              {media.category && <p className="text-xs text-purple-600 mt-0.5">{media.category}</p>}
              <p className="text-xs text-gray-400 mt-1">Uploaded: {formatTimestampADBS(media.uploadDate)}</p>
            </CardHeader>
            {media.description && (
                <CardContent className="py-1 px-4 text-xs text-gray-600">
                     <p className="line-clamp-2">{media.description}</p>
                </CardContent>
            )}
            {media.tags && media.tags.length > 0 && (
                <CardContent className="py-1 px-4">
                    <div className="flex flex-wrap gap-1">
                        {media.tags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">{tag}</span>
                        ))}
                    </div>
                </CardContent>
            )}
            <CardFooter className="flex justify-end space-x-2 bg-gray-50 p-3">
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(media)}>Edit</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDelete(media.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="directMedia"
          initialData={editingMedia}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageDirectMediaPage;