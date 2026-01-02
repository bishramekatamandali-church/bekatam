


import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Modal from '../ui/Modal';
import { useContent } from '../../contexts/ContentContext';
import { ContentType, Sermon, EventItem, Ministry, BlogPost, AboutSection, KeyPerson, HistoryMilestone, BranchChurch, DirectMediaItem, HistoryChapter, ContentItem } from '../../types';
import { Link } from "react-router-dom";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDateADBS } from '../../dateConverter';
import Button from '../ui/Button'; 

interface SearchResultItem {
  id: string;
  title: string;
  type: string; 
  typeKey: ContentType | 'Other'; 
  snippet: string;
  linkPath: string;
  imageUrl?: string;
  date?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_RESULTS_PER_TYPE = 5;
const TOTAL_MAX_RESULTS = 20;

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    sermons, events, ministries, blogPosts, aboutSections, keyPersons,
    historyMilestones, historyChapters, branchChurches, directMediaItems,
    loadingContent
  } = useContent();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setSearchTerm('');
      setDebouncedSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const lowerTerm = term.toLowerCase();
    let results: SearchResultItem[] = [];

    const searchInItems = <T extends ContentItem>(items: T[], typeLabel: string, typeKey: ContentType | 'Other', fieldsToSearch: string[]) => {
      const typeResults: SearchResultItem[] = [];
      for (const item of items) {
        let matchFound = false;
        let snippet = (item as any).description?.substring(0, 100) || (item as any).content?.substring(0, 100) || '';
        
        for (const field of fieldsToSearch) {
          const value = (item as any)[field];
          if (typeof value === 'string' && value.toLowerCase().includes(lowerTerm)) {
            matchFound = true;
            if (field === 'description' || field === 'content' || field === 'bio' || field === 'summary') {
              const matchIndex = value.toLowerCase().indexOf(lowerTerm);
              const start = Math.max(0, matchIndex - 30);
              snippet = `...${value.substring(start, matchIndex + lowerTerm.length + 70)}...`;
            }
            break; 
          } else if (Array.isArray(value) && field === 'tags') { 
             if (value.some(tag => typeof tag === 'string' && tag.toLowerCase().includes(lowerTerm))) {
                matchFound = true;
                snippet = `Matched tag: ${value.find(tag => tag.toLowerCase().includes(lowerTerm))}`;
                break;
             }
          }
        }

        if (matchFound) {
          typeResults.push({
            id: (item as any).id,
            title: (item as any).title || (item as any).name || 'Untitled',
            type: typeLabel,
            typeKey: typeKey,
            snippet: snippet,
            linkPath: (item as any).linkPath || `/${String(typeKey).toLowerCase()}s/${(item as any).id}`,
            imageUrl: (item as any).imageUrl || (item as any).profileImageUrl || ((item as any).mediaType === 'image' ? (item as any).url : undefined) ,
            date: (item as any).date || (item as any).uploadDate || (item as any).createdAt,
          });
        }
        if (typeResults.length >= MAX_RESULTS_PER_TYPE) break;
      }
      results = results.concat(typeResults);
    };

    searchInItems(sermons, "Sermons", 'sermon', ['title', 'description', 'speaker', 'scripture', 'category']);
    searchInItems(events, "Events", 'event', ['title', 'description', 'location', 'category', 'guests']);
    searchInItems(ministries, "Ministries", 'ministry', ['title', 'description', 'leader', 'category']);
    searchInItems(blogPosts, "Blog", 'blogPost', ['title', 'description', 'category']);
    searchInItems(aboutSections, "About Us", 'aboutSection', ['title', 'content']);
    searchInItems(keyPersons, "Key Persons", 'keyPerson', ['name', 'role', 'bio']);
    searchInItems(historyMilestones, "History Milestones", 'historyMilestone', ['title', 'description', 'year']);
    searchInItems(historyChapters.filter(hc => hc.status === 'published'), "History Chapters", 'historyChapter', ['title', 'summary', 'content']);
    searchInItems(branchChurches, "Branches", 'branchChurch', ['name', 'address', 'pastorName', 'description']);
    searchInItems(directMediaItems, "Media Items", 'directMedia', ['title', 'description', 'category', 'tags']);

    setSearchResults(results.slice(0, TOTAL_MAX_RESULTS));
    setIsSearching(false);
  }, [sermons, events, ministries, blogPosts, aboutSections, keyPersons, historyMilestones, historyChapters, branchChurches, directMediaItems]);

  useEffect(() => {
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, performSearch]);

  const groupedResults = useMemo(() => {
    return searchResults.reduce((acc, result) => {
      (acc[result.type] = acc[result.type] || []).push(result);
      return acc;
    }, {} as Record<string, SearchResultItem[]>);
  }, [searchResults]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="flex flex-col h-[80vh] sm:h-[70vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <input
              ref={inputRef}
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={"Search sermons, events, people, etc..."}
              className="w-full p-3 pl-10 text-lg border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              aria-label="Global search input"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {loadingContent && isSearching && <p className="text-slate-500 dark:text-slate-400 text-center py-4">Loading...</p>}
          {!isSearching && !debouncedSearchTerm.trim() && <p className="text-slate-500 dark:text-slate-400 text-center py-4">Start typing to search...</p>}
          {!isSearching && debouncedSearchTerm.trim() && searchResults.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">{`No results found for "${debouncedSearchTerm}".`}</p>
          )}

          {Object.entries(groupedResults).map(([type, items]) => (
            items.length > 0 && (
              <section key={type} aria-labelledby={`search-results-${type.toLowerCase().replace(' ', '-')}`}>
                <h2 id={`search-results-${type.toLowerCase().replace(' ', '-')}`} className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">
                  {type} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({items.length})</span>
                </h2>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg hover:shadow-md transition-shadow">
                      <Link to={item.linkPath} onClick={onClose} className="flex items-start space-x-3">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="" className="w-16 h-16 object-cover rounded flex-shrink-0" />
                        )}
                        <div className="flex-grow">
                          <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 hover:text-purple-600 dark:hover:text-purple-300">{item.title}</h3>
                          {item.date && <p className="text-xs text-slate-400 dark:text-slate-500">{formatDateADBS(item.date)}</p>}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: item.snippet || '' }}></p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-right">
            <Button onClick={onClose} variant="outline" className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default GlobalSearchModal;
