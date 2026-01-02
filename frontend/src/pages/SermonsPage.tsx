import React, { useState, useMemo } from 'react';
import { useContent } from '../contexts/ContentContext'; 
import SermonCard from '../components/sermons/SermonCard';
import { Sermon, sermonCategoriesList, SermonCategory } from '../types';
import { SearchIcon, FilterIcon } from '../components/icons/GenericIcons'; 
import AdSlot from '../components/ads/AdSlot';

const SermonsPage: React.FC = () => {
  const { sermons, loadingContent } = useContent(); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SermonCategory | 'all'>('all');

  const filteredSermons = useMemo(() => {
    const term = searchTerm.toLowerCase();

    const getScore = (sermon: Sermon): number => {
        if (!term) return 1; // If no search term, all are relevant for sorting by date

        let score = 0;
        if (sermon.title.toLowerCase().includes(term)) {
            score += 10; // Title match is highest priority
        }
        if (sermon.speaker?.toLowerCase().includes(term)) {
            score += 5;
        }
        if (sermon.scripture?.toLowerCase().includes(term)) {
            score += 5; // Scripture is also important
        }
        if (sermon.description.toLowerCase().includes(term)) {
            score += 2;
        }
        if (sermon.fullContent?.toLowerCase().includes(term)) {
            score += 1; // Full content is lowest priority to avoid noise
        }
        return score;
    };

    const categoryFiltered = sermons.filter(sermon => 
        selectedCategory === 'all' || sermon.category === selectedCategory
    );

    if (!term) {
        // If no search term, just sort by date
        return categoryFiltered.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
    }

    return categoryFiltered
      .map(sermon => ({
        sermon,
        score: getScore(sermon)
      }))
      .filter(item => item.score > 0) // Only include items that have a match
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score; // Higher score first
        }
        // Tie-breaker: newest date first
        return new Date(b.sermon.date!).getTime() - new Date(a.sermon.date!).getTime();
      })
      .map(item => item.sermon); // Extract just the sermon object
      
  }, [sermons, searchTerm, selectedCategory]);

  if (loadingContent && sermons.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-gray-600">Loading sermons...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pb-12">
        {/* Search and Filter Controls */}
        <div className="mb-8 p-4 bg-white rounded-xl shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="search-sermons" className="block text-sm font-medium text-slate-700 mb-1">
                Search Sermons
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search-sermons"
                  placeholder="Title, speaker, scripture..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2.5 pl-10 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-slate-700 mb-1">
                Filter by Category
              </label>
              <div className="relative">
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as SermonCategory | 'all')}
                  className="w-full p-2.5 pl-10 border border-slate-300 rounded-xl bg-white focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">All Categories</option>
                  {sermonCategoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
        
        <AdSlot placementKey="sermon_list_top" />

        {filteredSermons.length === 0 && !loadingContent ? (
         <p className="text-center text-gray-500 text-lg py-10 bg-white rounded-xl shadow">
            No sermons available matching your criteria. Please check back later or adjust your filters.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSermons.map((sermon: Sermon) => ( 
            <SermonCard key={sermon.id} sermon={sermon} />
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default SermonsPage;