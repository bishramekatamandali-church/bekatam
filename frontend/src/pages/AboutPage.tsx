
import React, { useMemo, useEffect, useState } from 'react';
import { useContent } from '../contexts/ContentContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card'; 
import { AboutSection, KeyPerson, HistoryMilestone, CoreAboutSectionId, coreAboutSectionIds, HistoryChapter } from '../types';
import Button from '../components/ui/Button';
import { useLocation } from "react-router-dom";
import FullscreenImageModal from '../components/ui/FullscreenImageModal';


// --- Icons ---
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M11.25 4.533A9.709 9.709 0 0 0 3 12a9.709 9.709 0 0 0 8.25 7.467c.953.093 1.69.837 1.69 1.779V21.75a.75.75 0 0 0 1.5 0V21.25c0-.942.737-1.686 1.69-1.779A9.709 9.709 0 0 0 21 12a9.709 9.709 0 0 0-8.25-7.467V3.75a.75.75 0 0 0-1.5 0v.783Z" /><path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" /></svg>
);
// --- End Icons ---

const getMediaTypeFromUrl = (url: string) => {
  const lower = url.toLowerCase();
  if (/\.(mp3|wav|ogg|m4a|flac)$/i.test(lower)) {
    return 'audio';
  }
  if (/\.(mp4|webm|mov|m4v)$/i.test(lower) || lower.includes('/video/')) {
    return 'video';
  }
  return 'image';
};

const AboutMedia: React.FC<{
  url: string;
  alt: string;
  className?: string;
  mediaClassName?: string;
  rounded?: boolean;
}> = ({ url, alt, className, mediaClassName, rounded }) => {
  const mediaType = getMediaTypeFromUrl(url);
  const roundedClass = rounded ? 'rounded-full' : 'rounded-lg';

  if (mediaType === 'video') {
    return (
      <div className={className}>
        <video src={url} controls className={`${roundedClass} ${mediaClassName || ''}`} aria-label={alt} />
      </div>
    );
  }

  if (mediaType === 'audio') {
    return (
      <div className={className}>
        <audio src={url} controls className={mediaClassName || 'w-full'} aria-label={alt} />
      </div>
    );
  }

  return (
    <div className={className}>
      <img src={url} alt={alt} className={`${roundedClass} ${mediaClassName || ''}`} />
    </div>
  );
};

const KeyPersonCard: React.FC<{ person: KeyPerson }> = ({ person }) => {
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <>
      <Card className="text-center h-full flex flex-col">
        <CardContent className="flex-grow flex flex-col">
          {person.imageUrl && (
            <button
              type="button"
              onClick={() => setIsImageOpen(true)}
              className="h-full focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
              aria-label={`View ${person.name} portrait full screen`}
            >
              <AboutMedia
                url={person.imageUrl}
                alt={person.name}
                className="h-full"
                mediaClassName="w-full h-full object-cover"
              />
            </button>
          )}
          <h3 className="text-xl font-semibold text-slate-800">{person.name}</h3>
          <p className="text-purple-600 font-medium mb-2">{person.role}</p>
          <p className="text-sm text-slate-600 flex-grow">{person.bio}</p>
        </CardContent>
      </Card>
      {person.imageUrl && (
        <FullscreenImageModal
          isOpen={isImageOpen}
          onClose={() => setIsImageOpen(false)}
          imageUrl={person.imageUrl}
          alt={person.name}
        />
      )}
    </>
  );
};

const AboutPage: React.FC = () => {
  const { aboutSections, keyPersons, historyMilestones, loadingContent, historyChapters } = useContent();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        // Timeout to allow potential layout shifts to settle
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash, loadingContent]); 

  const sortedSections = useMemo(() => {
    return [...aboutSections].sort((a, b) => {
      if (a.isCoreSection && !b.isCoreSection) return -1;
      if (!a.isCoreSection && b.isCoreSection) return 1;
      if (a.isCoreSection && b.isCoreSection) {
        return (coreAboutSectionIds.indexOf(a.id as CoreAboutSectionId) || 99) - (coreAboutSectionIds.indexOf(b.id as CoreAboutSectionId) || 99);
      }
      return (a.displayOrder || 999) - (b.displayOrder || 999);
    });
  }, [aboutSections]);

  const sortedMilestones = useMemo(() => 
    [...historyMilestones].sort((a,b) => parseInt(a.year) - parseInt(b.year)), 
  [historyMilestones]);
  
  const latestPublishedChapter = useMemo(() => 
    historyChapters
        .filter(c => c.status === 'published')
        .sort((a,b) => new Date(b.lastPublishedAt || b.createdAt).getTime() - new Date(a.lastPublishedAt || a.createdAt).getTime())
        [0],
  [historyChapters]);

  if (loadingContent) {
    return <div className="container mx-auto px-4 py-12 text-center text-slate-600">Loading about us information...</div>;
  }
  

  return (
    <div className="bg-slate-50">

      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {sortedSections.map((section, index) => {
            const isImageRight = index % 2 !== 0;
            return (
              <Card id={section.id} key={section.id}>
                <div className={`grid md:grid-cols-2 gap-6 items-center`}>
                  <div className={`p-6 ${isImageRight ? 'md:order-2' : ''}`}>
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">{section.title}</h2>
                    <div className="prose max-w-none text-slate-600 whitespace-pre-line">{section.content}</div>
                  </div>
                  {section.imageUrl && (
                    <div className={`h-64 md:h-full ${isImageRight ? 'md:order-1' : ''}`}>
                      <AboutMedia
                        url={section.imageUrl}
                        alt={section.title}
                        className="h-full"
                        mediaClassName="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
        
        {keyPersons.length > 0 && (
          <section id="our-team" className="scroll-mt-20 text-center py-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Our Team</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-10">Meet the dedicated leaders serving our church community.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {keyPersons.map(person => <KeyPersonCard key={person.id} person={person} />)}
            </div>
          </section>
        )}

        {sortedMilestones.length > 0 && (
          <section id="our-history" className="scroll-mt-20 py-16">
             <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Our History</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  A brief look at the key milestones in the journey of our church.
                </p>
            </div>
            <div className="relative max-w-2xl mx-auto">
              <div className="border-l-2 border-slate-300 absolute h-full top-0 left-4 sm:left-1/2 sm:-translate-x-1/2"></div>
              {sortedMilestones.map(milestone => (
                <div key={milestone.id} className="relative pl-8 sm:pl-0 sm:grid sm:grid-cols-2 sm:gap-x-12 py-4">
                    <div className="sm:text-right">
                        <div className="flex items-center mb-1 sm:justify-end">
                            <time className="text-xs font-semibold uppercase text-purple-600 bg-purple-100 rounded-full px-3 py-1">{milestone.year}</time>
                            <div className="sm:hidden w-2.5 h-2.5 bg-purple-600 rounded-full ml-4 -mr-1"></div>
                        </div>
                        <div className="text-xl font-bold text-slate-900">{milestone.title}</div>
                        <div className="text-slate-500 mt-1">{milestone.description}</div>
                    </div>
                    <div className="hidden sm:block absolute w-3 h-3 bg-purple-600 rounded-full left-1/2 -translate-y-4 -translate-x-1/2 top-1/2"></div>
                </div>
              ))}
            </div>
            {latestPublishedChapter && (
                <div className="mt-12 text-center">
                    <Card className="max-w-2xl mx-auto bg-purple-50 border-purple-200">
                        <CardHeader className="flex items-center justify-center gap-3">
                            <BookOpenIcon className="w-6 h-6 text-purple-600"/>
                            <h3 className="text-xl font-semibold text-purple-800">Continue the Story</h3>
                        </CardHeader>
                        <CardContent>
                             <p className="text-slate-600 mb-4">
                                For a more detailed account, explore our full church history. Our latest chapter, <strong>"{latestPublishedChapter.title}"</strong>, is now available.
                            </p>
                            <Button asLink to="/church-history" variant="primary">Read Full History</Button>
                        </CardContent>
                    </Card>
                </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AboutPage;
