

import React from 'react';
import { Link } from "react-router-dom";
import { FeatureInfo } from '../../types';
import Button from '../ui/Button';
import Card, { CardContent, CardFooter, CardHeader } from '../ui/Card';
import { formatDateADBS } from '../../dateConverter';

// Placeholder Icons
const VideoCameraIconSolid: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-16 h-16"}>
    <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-1.561l3.47-1.735a.75.75 0 000-1.308L15.75 10.56V9a3 3 0 00-3-3H4.5zM15 9.75v4.5l2.25-1.125V8.625L15 9.75z" />
  </svg>
);

const PhotoIconPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-16 h-16"}>
    <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
  </svg>
);


interface FeatureCardProps {
  feature: FeatureInfo;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  const detailLinkPath = feature.linkPath;

  const displayDescription = feature.description.length > 100 ? `${feature.description.substring(0, 100)}...` : feature.description;
  const displayTitle = feature.title;
  const displayCategory = feature.category;

  return (
    <Card className="flex flex-col h-full dark:bg-slate-800">
      <div className="w-full h-48 bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
        {feature.imageUrl ? (
          <Link to={detailLinkPath} aria-label={`Read more about ${displayTitle}`} className="w-full h-full">
            <img
              src={feature.imageUrl}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          </Link>
        ) : (
          <Link to={detailLinkPath} aria-label={`Read more about ${displayTitle}`} className="w-full h-full flex items-center justify-center">
            {displayCategory === 'video' ? ( // Simple check, adjust if needed based on actual data
              <VideoCameraIconSolid className="w-16 h-16 text-slate-400 dark:text-slate-500" />
            ) : (
              <PhotoIconPlaceholder className="w-16 h-16 text-slate-400 dark:text-slate-500" />
            )}
          </Link>
        )}
      </div>
      <CardHeader className="dark:border-slate-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 flex items-center">
            <Link to={detailLinkPath} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              {displayTitle}
            </Link>
        </h3>
        {displayCategory && (
            <span className="mt-1 text-xs font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center">
              {displayCategory}
            </span>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {feature.date && (
          <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mb-2">
            <span>{formatDateADBS(feature.date)}</span>
          </div>
        )}
        <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed flex items-start">
          <span>
            {displayDescription}
          </span>
        </p>
      </CardContent>
      <CardFooter>
        <Button asLink to={detailLinkPath} variant="ghost" size="sm" className="dark:text-teal-400 dark:hover:bg-slate-600">
          Learn More
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeatureCard;