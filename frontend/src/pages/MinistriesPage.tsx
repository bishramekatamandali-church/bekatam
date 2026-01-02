

import React from 'react';
import { Link } from "react-router-dom";
import { useContent } from '../contexts/ContentContext'; 
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Ministry } from '../types';

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63L12.5 21.75l-.435.145a.75.75 0 0 1-.63 0l-2.955-.985a.75.75 0 0 1-.363-.63l-.001-.122v-.002ZM17.25 19.128l-.001.121a.75.75 0 0 1-.363.63l-2.955.985a.75.75 0 0 1-.63 0l-.435-.145L10 21.75a.75.75 0 0 1-.363-.63l-.001-.119v-.004a5.625 5.625 0 0 1 11.25 0Z" />
  </svg>
);

const MinistriesPage: React.FC = () => {
  const { ministries, loadingContent } = useContent(); 

  if (loadingContent) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-gray-600">Loading ministries...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
    <div className="container mx-auto px-4 pb-12">
      {ministries.length === 0 ? (
        <p className="text-center text-gray-500 text-lg py-10 bg-white rounded-lg shadow">No ministries available at this time. Please check back later.</p>
      ) : (
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
          {ministries.map((ministry: Ministry) => ( 
            <Card key={ministry.id} className="flex flex-col md:flex-row shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
              {ministry.imageUrl && (
                 <div className="md:w-1/3 relative group">
                    <Link to={`/ministries/${ministry.id}`} aria-label={`Learn more about ${ministry.title}`} className="block h-56 md:h-full">
                        <img src={ministry.imageUrl} alt={ministry.title} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-200"/>
                    </Link>
                 </div>
              )}
              <div className={`flex flex-col flex-grow ${ministry.imageUrl ? 'md:w-2/3' : 'w-full'}`}>
                <CardHeader className="pb-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">
                     <Link to={`/ministries/${ministry.id}`} className="hover:text-purple-600 transition-colors">{ministry.title}</Link>
                  </h2>
                  {ministry.category && <span className="text-xs font-medium uppercase tracking-wider text-purple-600">{ministry.category}</span>}
                </CardHeader>
                <CardContent className="flex-grow py-3">
                  <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-4 md:line-clamp-none">{ministry.description}</p>
                  {ministry.leader && <p className="text-sm text-gray-500"><strong className="text-gray-700">Leader:</strong> {ministry.leader}</p>}
                  {ministry.meetingTime && <p className="text-sm text-gray-500"><strong className="text-gray-700">Meets:</strong> {ministry.meetingTime}</p>}
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button asLink to={`/ministries/${ministry.id}`} variant="primary" size="sm" className="w-full sm:w-auto">
                    <UsersIcon className="mr-1.5 w-4 h-4" /> Learn More & Join
                  </Button>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default MinistriesPage;