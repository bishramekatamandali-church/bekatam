
import React, { useState, useMemo } from 'react';
import { useContent } from '../contexts/ContentContext'; 
import NewsItemCard from '../components/news/NewsItemCard';
import { NewsItem, newsCategoriesList, NewsCategory } from '../types';
import { SearchIcon, FilterIcon } from '../components/icons/GenericIcons';
import AdSlot from '../components/ads/AdSlot';

const NewsPage: React.FC = () => {
  const { newsItems, loadingContent } = useContent(); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');

  const filteredNewsItems = useMemo(() => {
    return newsItems
      .filter(item => {
        const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
        const term = searchTerm.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(term);
        const descriptionMatch = item.description.toLowerCase().includes(term);
        const searchMatch = titleMatch || descriptionMatch;
        return categoryMatch && searchMatch;
      })
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
  }, [newsItems, searchTerm, selectedCategory]);

  if (loadingContent && newsItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-gray-600">Loading news...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pb-12">
        <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="search-news" className="block text-sm font-medium text-slate-700 mb-1">
                Search News
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search-news"
                  placeholder="Title, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2.5 pl-10 border border-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-white"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <label htmlFor="category-filter-news" className="block text-sm font-medium text-slate-700 mb-1">
                Filter by Category
              </label>
              <div className="relative">
                <select
                  id="category-filter-news"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as NewsCategory | 'all')}
                  className="w-full p-2.5 pl-10 border border-purple-300 rounded-md bg-white focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">All Categories</option>
                  {newsCategoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
        
        <AdSlot placementKey="news_list_top" />

        {filteredNewsItems.length === 0 && !loadingContent ? (
         <p className="text-center text-gray-500 text-lg py-10 bg-purple-50 rounded-lg shadow">
            No news items available matching your criteria. Please check back later or adjust your filters.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNewsItems.map((item: NewsItem) => ( 
            <NewsItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default NewsPage;