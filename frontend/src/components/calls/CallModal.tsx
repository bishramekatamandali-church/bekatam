
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../../types';
import Button from '../ui/Button';
import { PhoneIcon, VideoCameraIcon, MicrophoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/solid';
import { VideoCameraSlashIcon, SpeakerXMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User;
  callType: 'audio' | 'video';
}

type CallStatus = 'calling' | 'connected' | 'ended' | 'denied' | 'error';

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, targetUser, callType }) => {
  const [status, setStatus] = useState<CallStatus>('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(callType === 'audio');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleConnect = useCallback(async () => {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatus('error');
            console.error("Media Devices API not supported in this browser.");
            return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
            video: callType === 'video',
            audio: true
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
        setStatus('connected');
    } catch (err: any) {
        console.error("Media device error:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setStatus('denied');
        } else {
            setStatus('error');
        }
    }
  }, [callType]);

  useEffect(() => {
    if (!isOpen) {
        // Cleanup on close
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStatus('calling'); // Reset status for next time
        return;
    }

    const timer = setTimeout(() => {
        // Simulate call being answered
        if (status === 'calling') {
            handleConnect();
        }
    }, 3000);

    return () => {
        clearTimeout(timer);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };
  }, [isOpen, status, handleConnect]);
  
  const handleEndCall = () => {
    setStatus('ended');
    setTimeout(() => {
        onClose();
    }, 1500);
  };
  
  const toggleMute = () => {
      if(streamRef.current) {
          streamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
          setIsMuted(prev => !prev);
      }
  };

  const toggleCamera = () => {
      if(callType === 'video' && streamRef.current) {
          streamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
          setIsCameraOff(prev => !prev);
      }
  };


  const renderStatusContent = () => {
    switch(status) {
        case 'calling':
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <img src={targetUser.profileImageUrl || ''} alt={targetUser.fullName} className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-300 animate-pulse"/>
                    <p className="mt-4 text-white text-xl font-semibold">Calling {targetUser.fullName}...</p>
                    <p className="text-purple-200 text-sm capitalize">{callType} call</p>
                </div>
            );
        case 'connected':
             return (
                <div className="relative w-full h-full">
                    {/* Remote user video (placeholder) */}
                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                        <img src={targetUser.profileImageUrl || ''} alt={targetUser.fullName} className="h-full w-full object-cover opacity-30" />
                        <p className="absolute text-white/50 text-lg">Connected with {targetUser.fullName}</p>
                    </div>

                    {/* Local user video */}
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`absolute bottom-4 right-4 w-32 h-44 sm:w-40 sm:h-56 bg-black rounded-lg shadow-lg border-2 border-white/50 object-cover ${isCameraOff ? 'hidden' : 'block'}`}
                    />
                    {isCameraOff && (
                         <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-40 sm:h-56 bg-slate-700 rounded-lg shadow-lg border-2 border-white/50 flex flex-col items-center justify-center text-white">
                            <VideoCameraSlashIcon className="w-10 h-10"/>
                            <span className="text-xs mt-2">Camera Off</span>
                         </div>
                    )}
                </div>
             );
        case 'denied':
        case 'error':
            return <div className="text-center text-white p-6">
                <h3 className="text-xl font-semibold mb-2">{status === 'denied' ? 'Permission Denied' : 'Call Error'}</h3>
                <p className="text-purple-200">{status === 'denied' ? 'You need to grant camera and microphone permissions in your browser to make calls.' : 'Could not start the call. Please check your devices and try again.'}</p>
            </div>
        case 'ended':
            return <div className="flex items-center justify-center h-full text-center text-white"><p className="text-xl">Call Ended.</p></div>
    }
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-80 z-[1000] flex items-center justify-center transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-900 w-full h-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
            <div className="flex-grow relative">
                {renderStatusContent()}
            </div>
            
            {/* Controls */}
            { status !== 'ended' &&
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-center items-center space-x-4">
                 <Button onClick={toggleMute} variant="secondary" className={`!rounded-full !p-3 ${isMuted ? '!bg-white !text-slate-800' : '!bg-white/20 !text-white hover:!bg-white/30'}`}>
                    {isMuted ? <SpeakerXMarkIcon className="w-6 h-6"/> : <MicrophoneIcon className="w-6 h-6"/>}
                 </Button>
                  <Button onClick={toggleCamera} variant="secondary" disabled={callType === 'audio'} className={`!rounded-full !p-3 ${isCameraOff ? '!bg-white !text-slate-800' : '!bg-white/20 !text-white hover:!bg-white/30'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {isCameraOff ? <VideoCameraSlashIcon className="w-6 h-6"/> : <VideoCameraIcon className="w-6 h-6"/>}
                 </Button>
                  <Button onClick={handleEndCall} className="!rounded-full !p-4 !bg-red-600 hover:!bg-red-700 !text-white">
                    <PhoneXMarkIcon className="w-7 h-7"/>
                 </Button>
            </div>
            }
        </div>
    </div>
  );
};

export default CallModal;
