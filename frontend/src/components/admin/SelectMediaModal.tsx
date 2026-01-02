

import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useContent } from '../../contexts/ContentContext';
import { DirectMediaItem } from '../../types';
import Card from '../ui/Card'; // Using Card for consistent styling of items
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface SelectMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSelection: (selectedUrls: string[]) => void;
  initialSelectedUrls?: string[];
}

const ITEMS_PER_PAGE = 12;

const SelectMediaModal: React.FC<SelectMediaModalProps> = ({
  isOpen,
  onClose,
  onConfirmSelection,
  initialSelectedUrls = [],
}) => {
  const { directMediaItems, loadingContent } = useContent();
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>(initialSelectedUrls);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isOpen) {
        setSelectedImageUrls(initialSelectedUrls);
        setCurrentPage(1); // Reset page on open
        setSearchTerm(''); // Reset search on open
    }
  }, [isOpen, initialSelectedUrls]);

  const imageItems = useMemo(() => {
    return directMediaItems
      .filter(item => item.mediaType === 'image' && 
                     (item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                     )
      )
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [directMediaItems, searchTerm]);
  
  const paginatedImageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return imageItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [imageItems, currentPage]);

  const totalPages = Math.ceil(imageItems.length / ITEMS_PER_PAGE);

  const toggleSelection = (url: string) => {
    setSelectedImageUrls(prevSelected =>
      prevSelected.includes(url)
        ? prevSelected.filter(u => u !== url)
        : [...prevSelected, url]
    );
  };

  const handleConfirm = () => {
    onConfirmSelection(selectedImageUrls);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Theme Images" size="xl">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search images by title, category, tags..."
          value={searchTerm}
          onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
        />
        {loadingContent && <p className="text-center text-slate-500">Loading media...</p>}
        {!loadingContent && paginatedImageItems.length === 0 && (
          <p className="text-center text-slate-500 py-6">
            {searchTerm ? 'No images match your search.' : 'No images found in Direct Media. Please upload some images first.'}
          </p>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto p-1">
          {paginatedImageItems.map(item => {
            const isSelected = selectedImageUrls.includes(item.url);
            return (
              <Card
                key={item.id}
                onClick={() => toggleSelection(item.url)}
                className={`cursor-pointer relative group overflow-hidden ${isSelected ? 'ring-2 ring-purple-500 border-purple-500' : 'border-transparent'}`}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {isSelected && (
                    <div className="absolute top-1 right-1 bg-purple-500 text-white rounded-full p-0.5">
                        <CheckCircleIconSolid className="w-5 h-5"/>
                    </div>
                )}
                <div className="p-1.5 bg-slate-50 dark:bg-slate-700">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate" title={item.title}>
                    {item.title}
                  </p>
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate" title={item.category || 'Uncategorized'}>
                    {item.category || 'Uncategorized'}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="pt-3 flex justify-center items-center space-x-2">
            <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline" size="sm">Previous</Button>
            <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
            <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline" size="sm">Next</Button>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm}>Confirm Selection ({selectedImageUrls.length})</Button>
        </div>
      </div>
    </Modal>
  );
};

export default SelectMediaModal;
