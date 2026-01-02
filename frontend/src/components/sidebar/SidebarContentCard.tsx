

import React from 'react';
import { Link } from "react-router-dom";
import { EventItem, Sermon, NewsItem, BlogPost } from '../../types';
import Card, { CardContent } from '../ui/Card'; // Using Card and CardContent for structure
import { formatDateADBS } from '../../dateConverter';

type SidebarCardItemType = EventItem | Sermon | NewsItem | BlogPost;

interface SidebarContentCardProps {
  item: SidebarCardItemType;
  typeLabel: string;
}

const SidebarContentCard: React.FC<SidebarContentCardProps> = ({ item, typeLabel }) => {
  // Determine image URL: sermons might have videoUrl which could be used for thumbnail generation,
  // but for simplicity, we primarily rely on imageUrl.
  // For NewsItem, BlogPost, and EventItem, imageUrl is standard.
  // Sermons might also have imageUrl.
  const imageToDisplay = item.imageUrl;
  const itemDate = (item as { date?: string }).date;

  return (
    <Link to={item.linkPath} className="block group h-full" aria-label={`Read more about ${item.title}`}>
      <div className="bg-white dark:bg-slate-800/70 shadow-md hover:shadow-xl rounded-lg overflow-hidden transition-shadow duration-300 h-full flex flex-col">
        {imageToDisplay ? (
          <img 
            src={imageToDisplay} 
            alt={item.title} 
            className="w-full h-24 object-cover group-hover:opacity-90 transition-opacity duration-200" 
            loading="lazy"
          />
        ) : (
          <div className="w-full h-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs">
            <span>No Image</span>
          </div>
        )}
        <div className="p-2.5 flex-grow flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block mb-0.5 uppercase tracking-wider">
              {typeLabel}
            </span>
            <h4 
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-300 line-clamp-2 leading-tight mb-1"
              title={item.title}
            >
              {item.title}
            </h4>
          </div>
          {itemDate && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-auto pt-1">
              {formatDateADBS(itemDate)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default SidebarContentCard;