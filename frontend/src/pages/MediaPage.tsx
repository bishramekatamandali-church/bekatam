
import React, { useState, useMemo, useEffect } from 'react';
import { useContent } from '../contexts/ContentContext';
import { DisplayedMediaItem, MediaSourceContentType } from './../types';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { Link } from "react-router-dom";
import { formatDateADBS } from '../dateConverter';
import MediaViewerModal from '../components/ui/MediaViewerModal';

// Icons
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
);
const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
);
const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 0v9.5c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-9.5a.75.75 0 00-.75-.75H3.25a.75.75 0 00-.75.75zm6.75 2.5a.75.75 0 00-1.5 0v1.5h-1.5a.75.75 0 000 1.5h1.5v1.5a.75.75 0 001.5 0v-1.5h1.5a.75.75 0 000-1.5h-1.5v-1.5z" clipRule="evenodd" /></svg>
);
const PlayCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" /></svg>
);
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.75a.75.75 0 00-1.5 0V7.5H9.75a.75.75 0 000 1.5H11V10.5a.75.75 0 001.5 0V9h.75a.75.75 0 000-1.5H12.5V6.25z" clipRule="evenodd" />
  </svg>
);


const ITEMS_PER_PAGE = 12;

const MediaPage: React.FC = () => {
  const { allDerivedMediaItems, loadingContent } = useContent();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<DisplayedMediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    allDerivedMediaItems.forEach(item => {
      if (item.category) categories.add(item.category);
      if (item.sourceContentType) categories.add(item.sourceContentType);
    });
    return ['all', ...Array.from(categories).sort()];
  }, [allDerivedMediaItems]);

  const filteredMedia = useMemo(() => {
    return allDerivedMediaItems
      .filter(item => {
        const typeMatch = typeFilter === 'all' || item.type === typeFilter;
        const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter || item.sourceContentType === categoryFilter;
        const term = searchTerm.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(term);
        const sourceTitleMatch = item.sourceTitle.toLowerCase().includes(term);
        const descriptionMatch = item.description?.toLowerCase().includes(term) || false;
        const tagsMatch = item.tags?.some(tag => tag.toLowerCase().includes(term)) || false;
        
        return typeMatch && categoryMatch && (titleMatch || sourceTitleMatch || descriptionMatch || tagsMatch);
      })
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [allDerivedMediaItems, searchTerm, typeFilter, categoryFilter]);

  const paginatedMedia = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMedia.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMedia, currentPage]);

  const totalPages = Math.ceil(filteredMedia.length / ITEMS_PER_PAGE);

  const openModal = (media: DisplayedMediaItem) => {
    setSelectedMedia(media);
    setIsModalOpen(true);
  };

  if (loadingContent && allDerivedMediaItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-slate-600">Loading media...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pb-8">

        <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <label htmlFor="search-media" className="block text-xs font-medium text-slate-700 mb-1">Search Media</label>
              <div className="relative">
                <input
                  type="text"
                  id="search-media"
                  placeholder="Search by title, source, category..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full p-2.5 pl-10 border border-slate-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div>
              <label htmlFor="type-filter" className="block text-xs font-medium text-slate-700 mb-1">Filter by Type</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as any); setCurrentPage(1); }}
                className="w-full p-2.5 border border-slate-300 rounded-md bg-white focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Media Types</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>
             <div>
              <label htmlFor="category-filter" className="block text-xs font-medium text-slate-700 mb-1">Filter by Category/Source</label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="w-full p-2.5 border border-slate-300 rounded-md bg-white focus:ring-purple-500 focus:border-purple-500"
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat === 'all' ? 'All Categories/Sources' : cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {paginatedMedia.length === 0 && !loadingContent ? (
          <p className="text-center text-slate-500 text-lg py-10">No media items found matching your criteria.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedMedia.map((item) => (
                <Card key={item.id} className="flex flex-col group overflow-hidden">
                  <div className="relative h-48 bg-slate-200 flex items-center justify-center">
                    {item.type === 'image' && (
                      <img src={item.thumbnailUrl || item.url} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    )}
                    {(item.type === 'video' || item.type === 'audio') && item.thumbnailUrl && (
                      <img src={item.thumbnailUrl} alt={`${item.title} thumbnail`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    )}
                    {(item.type === 'video' || item.type === 'audio') && !item.thumbnailUrl && (
                       <div className="w-full h-full flex items-center justify-center bg-slate-300">
                           <PlayCircleIcon className="w-16 h-16 text-slate-500 opacity-70" />
                       </div>
                    )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <Button onClick={() => openModal(item)} variant="primary" size="sm" className="w-full !py-1.5 text-xs">
                            {item.type === 'image' ? "View Image" : "Play Media"}
                        </Button>
                    </div>
                  </div>
                  <CardContent className="flex-grow p-3">
                    <h3 className="text-sm font-semibold text-slate-700 truncate mb-0.5" title={item.title}>{item.title}</h3>
                    <p className="text-xs text-slate-500 truncate" title={item.sourceTitle}>Source: {item.sourceTitle}</p>
                    {item.date && <p className="text-xs text-slate-400 mt-0.5">Posted on: {formatDateADBS(item.date)}</p>}
                    {item.postedByOwnerName && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center">
                        <UserCircleIcon className="w-3 h-3 mr-1 text-slate-400" />
                        Curated by: {item.postedByOwnerName}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex justify-center items-center space-x-2">
                <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline">Previous</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pageNumber => totalPages <= 5 || Math.abs(pageNumber - currentPage) < 2 || pageNumber === 1 || pageNumber === totalPages) 
                    .map((page, index, arr) => (
                    <React.Fragment key={page}>
                        {index > 0 && arr[index-1] !== page - 1 && <span className="text-slate-500">...</span>}
                        <Button
                            onClick={() => setCurrentPage(page)}
                            variant={currentPage === page ? 'primary' : 'outline'}
                            className={`!px-3 !py-1.5 text-sm ${currentPage === page ? '' : '!text-slate-600'}`}
                        >
                            {page}
                        </Button>
                    </React.Fragment>
                ))}
                <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline">
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && selectedMedia && (
        <MediaViewerModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            mediaUrl={selectedMedia.url}
            mediaType={selectedMedia.type}
            title={selectedMedia.title}
        />
      )}
    </div>
  );
};

export default MediaPage;
