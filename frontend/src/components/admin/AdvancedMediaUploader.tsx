
import React, { useRef, useState, useCallback } from 'react';
import Button from '../ui/Button';
import { CameraIcon, FolderIcon, MicrophoneIcon, LinkIcon, XCircleIcon, StopCircleIcon, ArrowUpOnSquareIcon, PhotoIcon } from '@heroicons/react/24/outline';

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

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const target = event.target;
    if (!file) return;

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
      case 'any': return 'image/png, image/jpeg, image/gif, image/webp,video/mp4,video/webm,video/quicktime';
      default: return '*/*';
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

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
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      
      {currentUrl && (
        <div className="mt-2 relative p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700 min-h-[50px] flex items-center justify-center">
          {mediaType === 'image' && <img src={currentUrl} alt="Preview" className="max-h-40 w-auto rounded shadow-sm" />}
          {mediaType === 'video' && <video src={currentUrl} controls className="max-h-40 w-full rounded" />}
          {mediaType === 'audio' && <audio src={currentUrl} controls className="w-full" />}
        </div>
      )}

      <div className="mt-1 flex items-center space-x-2">
        <div className="relative flex-grow">
          <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="url"
            value={currentUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://... or choose an upload method"
            className="w-full pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            disabled={isUploading}
          />
        </div>
        {currentUrl && !isUploading && (
          <Button type="button" onClick={() => onUrlChange('')} variant="ghost" size="sm" className="!p-1.5" aria-label="Clear URL">
            <XCircleIcon className="w-5 h-5 text-slate-400 hover:text-red-500 dark:hover:text-red-400" />
          </Button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
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
        Max file size is determined by the server.
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
