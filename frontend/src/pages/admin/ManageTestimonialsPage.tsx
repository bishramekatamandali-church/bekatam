import React, { useState, useMemo } from 'react';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import { Testimonial } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import AdminDeleteModal from '../../components/admin/AdminDeleteModal';
import { TrashIcon } from '@heroicons/react/24/outline';
import TestimonialCard from '../../components/prayer/TestimonialCard';
import Button from '../../components/ui/Button';

const ITEMS_PER_PAGE = 9;

const ManageTestimonialsPage: React.FC = () => {
  const { testimonials, deleteContent, loadingContent } = useContent();
  const { logAdminAction } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.contentText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [testimonials, searchTerm]);

  const paginatedTestimonials = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTestimonials.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTestimonials, currentPage]);

  const totalPages = Math.ceil(filteredTestimonials.length / ITEMS_PER_PAGE);

  const handleDeleteClick = (testimonial: Testimonial) => {
    setItemToDelete({ id: testimonial.id, name: testimonial.title });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (reason: string) => {
    if (!itemToDelete) return;
    await deleteContent('testimonial', itemToDelete.id);
    logAdminAction('Deleted Testimonial', itemToDelete.id, `Reason: ${reason}`);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  if (loadingContent) return <p>Loading testimonials...</p>;

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Manage Testimonials</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Review and moderate user-submitted testimonials.</p>
      </header>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search testimonials by title, content, or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
        />
      </div>

      {paginatedTestimonials.length === 0 ? (
        <Card className="dark:bg-slate-800">
          <CardContent className="text-center text-slate-500 dark:text-slate-400 py-10">
            No testimonials found matching your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTestimonials.map(testimonial => (
            <div key={testimonial.id} className="relative group">
              <TestimonialCard testimonial={testimonial} />
               <button 
                  onClick={() => handleDeleteClick(testimonial)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete testimonial"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
           <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline" size="sm">Previous</Button>
           <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
           <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline" size="sm">Next</Button>
        </div>
      )}

      {isDeleteModalOpen && itemToDelete && (
        <AdminDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={itemToDelete.name}
          isSubmitting={loadingContent}
        />
      )}
    </div>
  );
};

export default ManageTestimonialsPage;