import React, { useState } from 'react';
import MediaViewerModal from '../ui/MediaViewerModal';

interface PostMediaDisplayProps {
  mediaUrls: string[];
  title: string;
}

const getMediaType = (url: string): 'image' | 'video' => {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  const videoExtensions = ['mp4', 'webm', 'mov', 'ogv'];
  return videoExtensions.includes(extension) ? 'video' : 'image';
};

const PostMediaDisplay: React.FC<PostMediaDisplayProps> = ({ mediaUrls, title }) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeMediaUrl, setActiveMediaUrl] = useState('');
  const [activeMediaType, setActiveMediaType] = useState<'image' | 'video' | 'audio'>('image');

  const openViewer = (url: string) => {
    setActiveMediaUrl(url);
    setActiveMediaType(getMediaType(url));
    setIsViewerOpen(true);
  };
  
  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  const gridClass = () => {
    switch (mediaUrls.length) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-2';
      case 4: return 'grid-cols-2';
      default: return 'grid-cols-2';
    }
  };
  
  const cellClass = (index: number) => {
    if (mediaUrls.length === 3 && index === 0) return 'col-span-2';
    return '';
  };

  return (
    <>
      <div className={`mt-3 grid gap-1 ${gridClass()}`}>
        {mediaUrls.slice(0, 4).map((url, index) => (
          <div
            key={url}
            onClick={() => openViewer(url)}
            className={`relative w-full rounded-md overflow-hidden cursor-pointer group ${cellClass(index)}`}
            style={{
              paddingTop: mediaUrls.length === 1 ? '56.25%' : '100%', // 16:9 for single, 1:1 for grid
            }}
          >
            {getMediaType(url) === 'image' ? (
              <img src={url} alt={`Attachment for ${title}`} className="absolute top-0 left-0 w-full h-full object-cover" />
            ) : (
              <video src={url} className="absolute top-0 left-0 w-full h-full object-cover" />
            )}
            {mediaUrls.length > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold">
                +{mediaUrls.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
      <MediaViewerModal 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        mediaUrl={activeMediaUrl}
        mediaType={activeMediaType}
        title={title}
      />
    </>
  );
};

export default PostMediaDisplay;
