
import React from 'react';
import { useContent } from '../contexts/ContentContext';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BranchChurch } from '../types';
import { Link } from "react-router-dom";
import { formatDateADBS, formatTimestampADBS } from '../dateConverter'; 

// Icons
const OfficeBuildingIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4.5 2.25a.75.75 0 000 1.5v16.5a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75V3.75a.75.75 0 000-1.5h-15z" />
    <path fillRule="evenodd" d="M5.25 3.75A.75.75 0 016 3h12a.75.75 0 01.75.75v16.5a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V3.75zM8.25 7.5a.75.75 0 01.75-.75h6a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-6a.75.75 0 01-.75-.75V7.5zM8.25 10.5a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v-.75zm3.75.75a.75.75 0 000-1.5h2.25a.75.75 0 000 1.5H12zm-3.75 3a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v-.75zm3.75.75a.75.75 0 000-1.5h2.25a.75.75 0 000 1.5H12zm-3.75 3a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v-.75zm3.75.75a.75.75 0 000-1.5h2.25a.75.75 0 000 1.5H12z" clipRule="evenodd" />
  </svg>
);
const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 5.159-4.502 16.975 16.975 0 0 0 2.243-7.53A9.75 9.75 0 0 0 12 2.25a9.75 9.75 0 0 0-9.75 9.75c0 4.11 2.086 7.917 5.234 10.35l.028.015.07.041Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5Z" clipRule="evenodd" />
  </svg>
);
const PhoneSolidIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.279-.086.43l2.893 5.028a1.875 1.875 0 00.63 1.084l6.164 4.624a1.875 1.875 0 002.282-.287l1.405-1.685a1.875 1.875 0 01 2.005-.556l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C6.55 22.5 1.5 17.45 1.5 10.5V8.25a3 3 0 013-3H6z" clipRule="evenodd" />
  </svg>
);
const EnvelopeSolidIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
</svg>
);
const CalendarDaysIconSmall: React.FC<{ className?: string }> = ({className}) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M5.75 2.25A.75.75 0 016.5 3v.75h11V3A.75.75 0 0118.25 3v.75h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5a3 3 0 01-3-3V7.5a3 3 0 013-3H5.75V3A.75.75 0 015.75 2.25ZM4.5 10.5V18A1.5 1.5 0 006 19.5h12A1.5 1.5 0 0019.5 18v-7.5H4.5Z" clipRule="evenodd" /></svg>
);
const UserCircleIconSmall: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.75a.75.75 0 00-1.5 0V7.5H9.75a.75.75 0 000 1.5H11V10.5a.75.75 0 001.5 0V9h.75a.75.75 0 000-1.5H12.5V6.25z" clipRule="evenodd" />
  </svg>
);

const BranchesPage: React.FC = () => {
  const { branchChurches, loadingContent } = useContent();

  if (loadingContent) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-slate-600">Loading church branches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {branchChurches.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <p className="text-xl text-slate-500 mb-6">No branch locations are currently listed. Please check back soon or contact our main office.</p>
            <Button asLink to="/contact" variant="primary">
              Contact Main Office
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {branchChurches.map((branch: BranchChurch) => (
              <Card key={branch.id} id={branch.id} className="w-full overflow-hidden md:flex bg-teal-50 border border-teal-200 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
                {branch.imageUrl && (
                  <div className="md:w-2/5 md:flex-shrink-0">
                    <img src={branch.imageUrl} alt={branch.name} className="w-full h-64 md:h-full object-cover" />
                  </div>
                )}
                <div className={`flex-grow p-6 ${branch.imageUrl ? 'md:w-3/5' : 'w-full'}`}>
                  <h2 className="text-2xl font-semibold text-slate-800 mb-3">{branch.name}</h2>
                  
                  <div className="space-y-3 text-slate-600 text-sm">
                    <p className="flex items-start">
                      <MapPinIcon className="w-5 h-5 mr-2.5 mt-0.5 text-slate-500 flex-shrink-0" />
                      <span>{branch.address}</span>
                    </p>
                    {branch.description && <p className="italic text-slate-500">{branch.description}</p>}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-teal-200 mt-3">
                        {branch.pastorName && (
                            <p><strong className="font-medium text-slate-700">Pastor:</strong> {branch.pastorName}</p>
                        )}
                        {branch.phone && (
                            <p className="flex items-center">
                                <PhoneSolidIcon className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0"/>
                                <a href={`tel:${branch.phone}`} className="hover:text-purple-600">{branch.phone}</a>
                            </p>
                        )}
                        {branch.email && (
                            <p className="flex items-center">
                                <EnvelopeSolidIcon className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0"/>
                                <a href={`mailto:${branch.email}`} className="hover:text-purple-600 truncate">{branch.email}</a>
                            </p>
                        )}
                         {branch.establishedDate && (
                            <p className="flex items-center">
                                <CalendarDaysIconSmall className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0"/>
                                Established: {formatDateADBS(branch.establishedDate)}
                            </p>
                        )}
                    </div>
                     <p><strong className="font-medium text-slate-700">Service Times:</strong> {branch.serviceTimes}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-teal-200">
                    {branch.mapEmbedUrl ? (
                        <Button 
                            asLink 
                            to={branch.mapEmbedUrl.startsWith('http') ? branch.mapEmbedUrl : `https://${branch.mapEmbedUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            variant="primary" 
                        >
                            View on Map
                        </Button>
                    ) : (
                        <Button 
                            asLink
                            to={`https://maps.google.com/?q=${encodeURIComponent(branch.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline"
                        >
                            Get Directions
                        </Button>
                    )}
                  </div>
                  
                  {(branch.updatedAt || branch.postedByOwnerName) && (
                    <div className="text-xs text-slate-400 mt-4 pt-3 border-t border-teal-200 space-y-0.5">
                        {branch.postedByOwnerName && (
                            <p className="flex items-center">
                               <UserCircleIconSmall className="w-3.5 h-3.5 mr-1" />
                               Info maintained by: {branch.postedByOwnerName}
                            </p>
                        )}
                        {branch.updatedAt && <p>Last updated: {formatTimestampADBS(branch.updatedAt)}</p>}
                    </div>
                   )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchesPage;