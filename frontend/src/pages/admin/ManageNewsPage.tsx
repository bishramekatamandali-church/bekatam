
import React, { useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ContentFormModal from '../../components/admin/ContentFormModal';
import { NewsItem, NewsItemFormData, GenericContentFormData } from '../../types'; 
import { formatDateADBS } from '../../dateConverter'; 

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H3.75a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);
const HeartIconSolid: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" /></svg>
);
const ChatBubbleLeftEllipsisIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 017 7.75zM7 10.75a.75.75 0 000 1.5h.75a.75.75 0 000-1.5H7z" clipRule="evenodd" /></svg>
);

const ManageNewsPage: React.FC = () => {
  const { newsItems, addContent, updateContent, deleteContent, loadingContent } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNewsItem, setEditingNewsItem] = useState<NewsItem | null>(null);

  const handleOpenModal = (item?: NewsItem) => {
    setEditingNewsItem(item || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNewsItem(null);
  };

  const handleSubmit = async (data: GenericContentFormData) => {
    if (editingNewsItem) {
      await updateContent('news', editingNewsItem.id, data as NewsItemFormData);
    } else {
      await addContent('news', data as NewsItemFormData);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      await deleteContent('news', id);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">Manage News</h1>
        <Button onClick={() => handleOpenModal()} variant="primary" size="sm">
          <PlusIcon className="mr-1.5" /> Add News Item
        </Button>
      </div>

      {loadingContent && <p className="text-gray-500 dark:text-slate-400">Loading news items...</p>}
      {!loadingContent && newsItems.length === 0 && (
         <Card className="dark:bg-slate-800"><CardContent><p className="text-center text-gray-500 dark:text-slate-400 py-8">No news items found. Add one to get started!</p></CardContent></Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {newsItems.map((item) => (
          <Card key={item.id} className="flex flex-col dark:bg-slate-800">
            {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover"/>}
            <CardHeader className="flex-grow dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-100 truncate" title={item.title}>{item.title}</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">{formatDateADBS(item.date)}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{item.category}</p>
            </CardHeader>
             <CardContent className="py-2 px-4 h-20 overflow-hidden dark:text-slate-300">
              <p className="text-xs text-gray-600 dark:text-slate-300 text-ellipsis">{item.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-3">
              <div className="flex space-x-3">
                <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center" title={`${item.likes || 0} likes`}>
                    <HeartIconSolid className="w-4 h-4 mr-1 text-red-400" />
                    {item.likes || 0}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center" title={`${item.comments?.length || 0} comments`}>
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-1 text-blue-400" />
                    {item.comments?.length || 0}
                </span>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenModal(item)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Edit</Button>
                <Button variant="secondary" size="sm" onClick={() => handleDelete(item.id)} className="!bg-red-500 hover:!bg-red-600 text-white">Delete</Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <ContentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          contentType="news"
          initialData={editingNewsItem}
          isLoading={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageNewsPage;
