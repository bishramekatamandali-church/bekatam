
import React, { useRef, useState, useCallback } from 'react';
import Button from '../ui/Button';
import { CameraIcon, FolderIcon, MicrophoneIcon, XCircleIcon, StopCircleIcon, ArrowUpOnSquareIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { getCloudinaryFileSizeError, getCloudinaryLimitLabel } from '../../utils/cloudinary';
import { getMediaKindFromUrl } from '../../utils/media';

interface AdvancedMediaUploaderProps {
  label: string;
  mediaType: 'image' | 'video' | 'audio' | 'any';
  currentUrl?: string;
  onUrlChange: (newUrl: string) => void;
  onFileUpload: (file: File) => void;
  onSelectFromLibrary?: () => void;
  uploadStatus?: string | null;
  isUploading?: boolean;
  className?: string;
  children?: React.ReactNode;
  childrenAsTrigger?: boolean;
}

const AdvancedMediaUploader: React.FC<AdvancedMediaUploaderProps> = ({
  label,
  mediaType,
  currentUrl = '',
  onUrlChange,
  onFileUpload,
  onSelectFromLibrary,
  uploadStatus,
  isUploading,
  className = '',
  children,
  childrenAsTrigger
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const target = event.target;
    if (!file) return;
  
    const sizeError = getCloudinaryFileSizeError(file);
    if (sizeError) {
      setLocalError(sizeError);
      if (target) {
        target.value = '';
      }
      return;
    }

    setLocalError(null);
    onFileUpload(file);
    
    if (target) {
      target.value = '';
    }
  }, [onFileUpload]);

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Media Devices API not supported in this browser.");
        return;
      }
      setLocalError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      const options = { mimeType: 'audio/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: options.mimeType });
        onFileUpload(audioFile);
        audioChunksRef.current = [];
        streamRef.current?.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check browser permissions.");
      setIsRecording(false);
    }
  }, [onFileUpload]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleRecordButtonClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const getAcceptType = () => {
    switch (mediaType) {
      case 'image': return 'image/png, image/jpeg, image/gif, image/webp';
      case 'video': return 'video/mp4,video/webm,video/quicktime';
      case 'audio': return 'audio/mpeg,audio/wav,audio/webm,audio/mp3';
      case 'any': return '*/*';
      default: return '*/*';
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const sizeError = getCloudinaryFileSizeError(file);
      if (sizeError) {
        setLocalError(sizeError);
        return;
      }
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false); 
  const resolvedPreviewKind = mediaType === 'any' ? getMediaKindFromUrl(currentUrl) : mediaType;

  if (childrenAsTrigger) {
    const childElement = React.Children.only(children);
    if (!React.isValidElement(childElement)) return null;

    return (
      <div className={className}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={getAcceptType()} className="hidden" />
        {React.cloneElement(childElement as React.ReactElement<any>, { onClick: triggerUpload, disabled: isUploading })}
      </div>
    );
  }


  return (
    <div className={className}>
      
     <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>

        {currentUrl && !isUploading && (
          <Button type="button" onClick={() => onUrlChange('')} variant="ghost" size="sm" className="!p-1.5" aria-label="Clear selected media">
            <XCircleIcon className="w-5 h-5 text-slate-400 hover:text-red-500 dark:hover:text-red-400" />
          </Button>
        )}
      </div>

      <div
        className={`mt-3 border-2 border-dashed rounded-xl p-4 transition-colors duration-200 ${isDragOver ? 'border-purple-500 bg-purple-50 dark:bg-slate-800/60' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40'} cursor-pointer`}
        onClick={triggerUpload}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentUrl ? (
          <div className="flex flex-col md:flex-row items-center gap-3">
            {resolvedPreviewKind === 'image' && (
              <img src={currentUrl} alt="Preview" className="max-h-36 w-auto rounded shadow-sm" />
            )}
            {resolvedPreviewKind === 'video' && (
              <video src={currentUrl} controls className="max-h-36 w-full rounded" />
            )}
            {resolvedPreviewKind === 'audio' && (
              <audio src={currentUrl} controls className="w-full" />
            )}
            {mediaType === 'any' && resolvedPreviewKind === 'other' && (
              <a href={currentUrl} target="_blank" rel="noreferrer" className="text-sm text-purple-600 underline">
                View uploaded file
              </a>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">Drop a new file to replace or tap to upload.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center text-slate-500 dark:text-slate-400">
            <PhotoIcon className="w-8 h-8 text-purple-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Drag & drop or click to upload</p>
            <p className="text-xs">Files are automatically attached, no need to paste URLs.</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={getAcceptType()} className="hidden" />
        <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} size="sm" variant="outline" className="text-xs dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">
          <FolderIcon className="w-4 h-4 mr-1.5" /> Browse File
        </Button>

        {mediaType !== 'audio' && (
          <>
            <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept={getAcceptType()} capture="user" className="hidden" />
            <Button type="button" onClick={() => cameraInputRef.current?.click()} disabled={isUploading} size="sm" variant="outline" className="text-xs dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">
              <CameraIcon className="w-4 h-4 mr-1.5" /> Use Camera
            </Button>
          </>
        )}

        {mediaType === 'audio' && (
          <Button type="button" onClick={handleRecordButtonClick} disabled={isUploading} size="sm" variant={isRecording ? "secondary" : "outline"} className={`text-xs ${isRecording ? '!bg-red-600 hover:!bg-red-700 text-white' : 'dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600'}`}>
            {isRecording ? <StopCircleIcon className="w-4 h-4 mr-1.5 animate-pulse" /> : <MicrophoneIcon className="w-4 h-4 mr-1.5" />}
            {isRecording ? "Stop Recording" : "Record Audio"}
          </Button>
        )}

        {onSelectFromLibrary && (
          <Button type="button" onClick={onSelectFromLibrary} disabled={isUploading} size="sm" variant="outline" className="text-xs dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">
            <PhotoIcon className="w-4 h-4 mr-1.5" /> Media Library
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        {getCloudinaryLimitLabel(mediaType)}
      </p>

      {isRecording && <p className="text-xs text-red-500 dark:text-red-400 mt-2 animate-pulse">Recording audio...</p>}
      
      {(uploadStatus || localError) && (
        <div className="mt-2 text-xs flex items-center gap-1.5">
          <ArrowUpOnSquareIcon className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''} ${localError ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
          <span className={localError ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-500 dark:text-slate-400'}>
            {localError || uploadStatus}
          </span>
        </div>
      )}
    </div>
  );
};

export default AdvancedMediaUploader;
