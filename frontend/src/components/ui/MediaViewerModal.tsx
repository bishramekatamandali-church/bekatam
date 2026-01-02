import React from 'react';
import Modal from './Modal';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'video' | 'audio' | 'image';
  title: string;
}

const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="bg-black rounded-md flex justify-center items-center p-4">
        {mediaType === 'image' && (
          <img src={mediaUrl} alt={title} className="max-w-full max-h-[70vh] rounded" />
        )}
        {mediaType === 'video' && (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[70vh] rounded"
          >
            Your browser does not support the video tag.
          </video>
        )}
        {mediaType === 'audio' && (
          <audio
            src={mediaUrl}
            controls
            autoPlay
            className="w-full"
          >
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    </Modal>
  );
};

export default MediaViewerModal;
