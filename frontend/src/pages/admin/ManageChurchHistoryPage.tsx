

import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { HistoryChapter, HistoryChapterFormData, GenericContentFormData } from '../../types';
import { formatDateADBS, formatTimestampADBS } from '../../dateConverter';
import { Link } from "react-router-dom";

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
);

const ManageChurchHistoryPage: React.FC = () => {
  const { historyChapters, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<HistoryChapter | null>(null);

  const sortedChapters = useMemo(() => 
    [...historyChapters].sort((a, b) => a.chapterNumber - b.chapterNumber), 
  [historyChapters]);

  const handleOpenModal = (chapter?: HistoryChapter) => {
    setEditingChapter(chapter || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingChapter(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingChapter) {
      await updateContent('historyChapter', editingChapter.id, data as HistoryChapterFormData);
    } else {
      await addContent('historyChapter', data as HistoryChapterFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this history chapter? This action cannot be undone.')) {
      await deleteContent('historyChapter', id);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Manage Church History Chapters</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add New Chapter
        </Button>
      </div>

      {loadingContent && <p className="text-slate-500">Loading history chapters...</p>}
      
      {!loadingContent && sortedChapters.length === 0 && (
        <Card>
            <CardContent>
                <p className="text-center text-slate-500 py-8">No history chapters found. Add one to start building the church memorial.</p>
            </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sortedChapters.map((chapter) => (
          <Card key={chapter.id} className="flex flex-col sm:flex-row items-start">
            {chapter.imageUrl && (
                <img src={chapter.imageUrl} alt={chapter.title} className="w-full sm:w-48 h-32 sm:h-auto object-cover sm:rounded-l-xl sm:rounded-r-none"/>
            )}
            <div className="flex-grow p-4">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-lg font-semibold text-slate-700" title={chapter.title}>
                  Ch. {chapter.chapterNumber}: {chapter.title}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${chapter.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                  `}>
                    {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                  </span>
                   {chapter.status === 'published' && chapter.linkPath && (
                     <Link to={chapter.linkPath} target="_blank" rel="noopener noreferrer" title="View Published Chapter" className="text-purple-600 hover:text-purple-800">
                        <EyeIcon className="w-4 h-4" />
                     </Link>
                   )}
                </div>
              </div>
              {chapter.summary && <p className="text-sm text-slate-500 italic line-clamp-1" title={chapter.summary}>{chapter.summary}</p>}
              <p className="text-sm text-slate-600 mt-1 line-clamp-2" title={chapter.content}>
                {chapter.content.substring(0, 150) + (chapter.content.length > 150 ? '...' : '')}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Author: {chapter.authorName || 'N/A'} | Last Updated: {formatTimestampADBS(chapter.updatedAt)}
              </p>
            </div>
            <CardFooter className="flex sm:flex-col sm:items-end sm:justify-start sm:space-y-2 sm:space-x-0 space-x-2 sm:w-auto w-full border-t sm:border-t-0 sm:border-l p-3 bg-slate-50 rounded-b-xl sm:rounded-r-xl sm:rounded-b-none">
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(chapter)}>Edit</Button>
              <Button variant="secondary" size="sm" onClick={() => handleDelete(chapter.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="historyChapter"
          initialData={editingChapter}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageChurchHistoryPage;