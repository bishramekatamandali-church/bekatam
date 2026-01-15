/*
import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { PrayerRequestFormData, PrayerRequestVisibility, TestimonialFormData, prayerRequestCategoriesList, prayerRequestVisibilityList, testimonialVisibilityList } from '../../types';
import AdvancedMediaUploader from '../admin/AdvancedMediaUploader';
import { PencilSquareIcon, CalendarDaysIcon, SpeakerWaveIcon, PhotoIcon, MapPinIcon, XCircleIcon, PaperClipIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { PrayerHandsIcon, TestimonyIcon } from '../icons/GenericIcons';
import { getCloudinaryFileSizeError, getCloudinaryResourceType, getCloudinaryUploadDetails } from '../../utils/cloudinary';

type PostType = 'prayer' | 'testimonial';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPostType: PostType;
}

const emojiCategories = {
  'Smileys & People': ['😀', '😂', '😍', '🤔', '😎', '😢', '😡', '👍', '👎', '🙌', '🙏', '❤️', '😊', '🥳', '😭', '😇', '💪', '🤗', '🤝'],
  'Animals & Nature': ['🐶', '🐱', '🦄', '🌍', '🌸', '☀️', '⭐', '🔥', '🌊', '🌳', '🕊️', '🦋'],
  'Food & Drink': ['🍕', '🍔', '🍎', '☕', '🎉', '🎂', '🎁', '🍇', '🍓', '🍰'],
  'Objects & Symbols': ['💡', '🎵', '✝️', '⛪', '📖', '💯', '✅', '❓', '❗', '💔', '🕊️'],
};


const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, initialPostType }) => {
    const { currentUser } = useAuth();
    const { addContent } = useContent();
    const [postType, setPostType] = useState<PostType>(initialPostType);
    
    // Form States
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [location, setLocation] = useState('');
    const [incidentAt, setIncidentAt] = useState('');
    
    // Specific States
    const [prayerVisibility, setPrayerVisibility] = useState<PrayerRequestVisibility>('public');
    const [prayerCategory, setPrayerCategory] = useState<typeof prayerRequestCategoriesList[number] | undefined>();
    const [testimonialVisibility, setTestimonialVisibility] = useState<typeof testimonialVisibilityList[number]>('public');

    // Control States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showExtraInputs, setShowExtraInputs] = useState<'location' | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    const resetFormState = () => {
        setContent(''); setTitle(''); setMediaUrls([]);
        setLocation(''); setIncidentAt('');
        setPrayerVisibility('public'); setPrayerCategory(undefined);
        setTestimonialVisibility('public');
        setError(''); setIsSubmitting(false); setShowExtraInputs(null);
        setIsUploading(false); setUploadStatus(null);
        setShowEmojiPicker(false);
    };

    useEffect(() => {
        if (isOpen) {
            setPostType(initialPostType);
        } else {
            setTimeout(resetFormState, 300);
        }
    }, [isOpen, initialPostType]);
    
    const handleFileAdd = (url: string) => setMediaUrls(prev => [...prev, url]);
    const handleFileRemove = (urlToRemove: string) => setMediaUrls(prev => prev.filter(url => url !== urlToRemove));
    
    const handleEmojiSelect = (emoji: string) => {
      if (contentTextareaRef.current) {
        const { selectionStart, selectionEnd } = contentTextareaRef.current;
        const newContent = content.substring(0, selectionStart) + emoji + content.substring(selectionEnd);
        setContent(newContent);
        // Focus and set cursor position after the inserted emoji
        setTimeout(() => {
          contentTextareaRef.current?.focus();
          contentTextareaRef.current!.selectionStart = contentTextareaRef.current!.selectionEnd = selectionStart + emoji.length;
        }, 0);
      }
    };

    const handleCloudinaryUpload = async (file: File) => {
        if (!file) return;

        setIsUploading(true);
        setUploadStatus(`Uploading ${file.name}...`);
        setError('');

        const sizeError = getCloudinaryFileSizeError(file);
        if (sizeError) {
            setError(sizeError);
            setUploadStatus(sizeError);
            setIsUploading(false);
            return;
        }

        const resourceType = getCloudinaryResourceType(file);
        const uploadDetails = getCloudinaryUploadDetails(resourceType);
        if ('error' in uploadDetails) {
            setError(uploadDetails.error);
            setUploadStatus(uploadDetails.error);
            setIsUploading(false);
            return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('upload_preset', uploadDetails.uploadPreset);

        try {
            const response = await fetch(uploadDetails.uploadUrl, { method: 'POST', body: uploadFormData, mode: 'cors' });
            const data = await response.json();

            if (response.ok && data.secure_url) {
                handleFileAdd(data.secure_url);
                setUploadStatus("Upload successful!");
                setTimeout(() => setUploadStatus(null), 2000);
            } else {
                throw new Error(data.error?.message || `Upload failed.`);
            }
        } catch (err: any) {
            setError(`Upload failed: ${err.message}`);
            setUploadStatus(`Error: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() && mediaUrls.length === 0) {
            setError('Post content or media is required.');
            return;
        }
        
        let finalTitle = title.trim();
        if (postType === 'prayer' && !finalTitle) {
            finalTitle = content.split(' ').slice(0, 7).join(' ') + (content.length > 50 ? '...' : '');
        } else if (!finalTitle) {
            setError('Title is required for this post type.');
            return;
        }

        setError('');
        setIsSubmitting(true);

        const commonData = {
            location: location || undefined,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
            incidentAt: incidentAt || undefined,
        };

        let formData: any;
        let contentType: 'prayerRequest' | 'testimonial' = 'prayerRequest';

        try {
            switch(postType) {
                case 'prayer':
                    contentType = 'prayerRequest';
                    formData = { ...commonData, title: finalTitle, requestText: content, visibility: prayerVisibility, category: prayerCategory } as PrayerRequestFormData;
                    break;
                case 'testimonial':
                    contentType = 'testimonial';
                    formData = { ...commonData, title: finalTitle, contentText: content, visibility: testimonialVisibility } as TestimonialFormData;
                    break;
            }

            const result = await addContent(contentType, formData);
            if (!result.success) throw new Error(result.message || `Failed to create ${postType}.`);
            onClose();

        } catch (err: any) {
            setError(`An error occurred: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const TypeButton = ({ type, label, icon }: { type: PostType, label: string, icon: React.ReactNode }) => (
        <button type="button" onClick={() => setPostType(type)} className={`flex items-center justify-center flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border-2 ${postType === type ? 'bg-purple-600 text-white border-purple-600' : 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'}`}>
            {icon}
            <span className="ml-1.5">{label}</span>
        </button>
    );

    const renderSpecificFields = () => {
        switch(postType) {
            case 'prayer': return <>
                 <select value={prayerVisibility} onChange={e => setPrayerVisibility(e.target.value as PrayerRequestVisibility)} className="w-full text-xs p-2 border rounded dark:bg-slate-700 dark:border-slate-600">
                    {prayerRequestVisibilityList.map(v => <option key={v} value={v} className="capitalize">{v.replace('_', ' ')}</option>)}
                </select>
                <select value={prayerCategory || ''} onChange={e => setPrayerCategory(e.target.value as any)} className="w-full text-xs p-2 border rounded dark:bg-slate-700 dark:border-slate-600">
                    <option value="">-- Select Category --</option>
                    {prayerRequestCategoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </>;
            case 'testimonial': return <>
                 <select value={testimonialVisibility} onChange={e => setTestimonialVisibility(e.target.value as any)} className="w-full text-xs p-2 border rounded dark:bg-slate-700 dark:border-slate-600">
                    {testimonialVisibilityList.map(v => <option key={v} value={v} className="capitalize">{v.replace('_', ' ')}</option>)}
                </select>
            </>;
            default: return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Create ${postType}`} size="lg">
             <div className="p-1 flex flex-col">
                <div className="flex-grow overflow-y-auto px-4 pt-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                   // User Header 
                    <div className="flex items-center space-x-3 mb-4">
                        <img src={currentUser?.profileImageUrl} alt="Your profile" className="w-10 h-10 rounded-full object-cover"/>
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{currentUser?.fullName}</p>
                            <div className="flex gap-2 mt-1">{renderSpecificFields()}</div>
                        </div>
                    </div>
                    
                    // Post Type Switcher 
                    <div className="flex gap-2 mb-4">
                         <TypeButton type="prayer" label="Prayer Request" icon={<PrayerHandsIcon className="w-4 h-4"/>} />
                         <TypeButton type="testimonial" label="Testimony" icon={<TestimonyIcon className="w-4 h-4"/>} />
                    </div>

                    // Content Area 
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder={postType === 'testimonial' ? "Testimony Title*" : "Title (Optional for prayers)"}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full text-lg font-semibold p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 dark:text-slate-200"
                        />
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                Incident date (optional)
                            </label>
                            <input
                                type="date"
                                value={incidentAt}
                                onChange={(e) => setIncidentAt(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 dark:text-slate-200"
                            />
                        </div>
                        <div className="relative">
                            <textarea
                                ref={contentTextareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full text-base p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-purple-500 focus:border-purple-500 resize-none min-h-[150px]"
                                rows={6}
                            />
                            <button type="button" onClick={() => setShowEmojiPicker(p => !p)} className="absolute bottom-2 right-2 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-500">
                                <FaceSmileIcon className="w-5 h-5 text-slate-500 dark:text-slate-300"/>
                            </button>
                        </div>
                    </div>
                    
                    {showEmojiPicker && (
                        <div className="p-2 border rounded-lg bg-white dark:bg-slate-700 shadow-lg mt-2">
                            {Object.entries(emojiCategories).map(([category, emojis]) => (
                                <div key={category} className="mb-2 last:mb-0">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{category}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {emojis.map(emoji => (
                                            <button type="button" key={emoji} onClick={() => handleEmojiSelect(emoji)} className="text-xl p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                     //Media Preview 
                    {mediaUrls.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {mediaUrls.map(url => (
                                <div key={url} className="relative group">
                                    <img src={url} className="w-full h-24 object-cover rounded" alt="media preview"/>
                                    <button onClick={() => handleFileRemove(url)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><XCircleIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                    )}
                    // Extra Inputs 
                    {showExtraInputs === 'location' && (
                      <input
                        type="text"
                        placeholder="Location"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full p-2 mt-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                      />
                    )}
                </div>

                // Action Tray 
                <div className="border rounded-lg p-2 mt-2 flex flex-wrap justify-around items-center dark:border-slate-600">
                    <AdvancedMediaUploader label="Photo/Video" mediaType="any" onUrlChange={handleFileAdd} onFileUpload={handleCloudinaryUpload} isUploading={isUploading} uploadStatus={uploadStatus} className="!p-0" childrenAsTrigger>
                         <button className="flex items-center text-sm p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"><PhotoIcon className="w-5 h-5 text-green-500"/> <span className="ml-1.5 hidden sm:inline">Photo/Video</span></button>
                    </AdvancedMediaUploader>
                    <button onClick={() => setShowExtraInputs(showExtraInputs === 'location' ? null : 'location')} className="flex items-center text-sm p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"><MapPinIcon className="w-5 h-5 text-red-500"/> <span className="ml-1.5 hidden sm:inline">Location</span></button>
                </div>

                //Footer and Submit 
                <div className="pt-3 mt-4">
                     {error && <p className="text-xs text-red-500 mb-2 text-center" role="alert">{error}</p>}
                    <Button onClick={handleSubmit} disabled={isSubmitting || isUploading} className="w-full">
                        {isSubmitting || isUploading ? 'Posting...' : 'Post'}
                    </Button>
                </div>
             </div>
        </Modal>
    );
};

export default CreatePostModal;
*/











import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { PrayerRequestFormData, TestimonialFormData, prayerRequestCategoriesList } from '../../types';
import AdvancedMediaUploader from '../admin/AdvancedMediaUploader';
import { PhotoIcon, XCircleIcon, FaceSmileIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { PrayerHandsIcon, TestimonyIcon } from '../icons/GenericIcons';
import { getCloudinaryFileSizeError, getCloudinaryResourceType, getCloudinaryUploadDetails } from '../../utils/cloudinary';

type PostType = 'prayer' | 'testimonial';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPostType: PostType;
}

const emojiCategories = {
  '😊 Smileys': ['😀', '😂', '😍', '🤔', '😎', '😢', '😡', '😊', '🥳', '😭', '😇', '🤗', '🥹', '😌', '😅', '😴', '😮', '😬'],
  '🙏 Faith': ['🙏', '✝️', '⛪', '📖', '🕊️', '❤️', '🤍', '💛', '✨', '🌟', '🧎‍♂️', '🧎‍♀️', '🙌', '🤲', '🔥'],
  '💪 Support': ['👍', '🤝', '💪', '👏', '✅', '💯', '🫶', '🧡', '💜', '🤍', '🌈', '🎯'],
  '🌿 Nature': ['🌍', '🌸', '☀️', '⭐', '🌊', '🌳', '🦋', '🌿', '🍃', '🌻', '🌧️'],
  '🎉 Celebrations': ['🎉', '🎂', '🎁', '🥳', '🎊', '🍰', '🎈'],
  '🎵 Media': ['🎵', '🎧', '🎤', '📷', '🎬', '🎥', '🎙️'],
  '🔖 Symbols': ['💡', '❓', '❗', '📝', '📌', '🧷', '🔗'],
};


const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, initialPostType }) => {
    const { currentUser } = useAuth();
    const { addContent } = useContent();
    const [postType, setPostType] = useState<PostType>(initialPostType);
    
    // Form States
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [incidentAt, setIncidentAt] = useState('');
    
    // Specific States
    const [prayerCategory, setPrayerCategory] = useState<typeof prayerRequestCategoriesList[number] | undefined>();

    // Control States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    const resetFormState = () => {
        setContent(''); setTitle(''); setMediaUrls([]);
        setIncidentAt('');
        setPrayerCategory(undefined);
        setError(''); setIsSubmitting(false);
        setIsUploading(false); setUploadStatus(null);
        setShowEmojiPicker(false);
    };

    useEffect(() => {
        if (isOpen) {
            setPostType(initialPostType);
        } else {
            setTimeout(resetFormState, 300);
        }
    }, [isOpen, initialPostType]);
    
    const handleFileAdd = (url: string) => setMediaUrls(prev => [...prev, url]);
    const handleFileRemove = (urlToRemove: string) => setMediaUrls(prev => prev.filter(url => url !== urlToRemove));
    
    const handleEmojiSelect = (emoji: string) => {
      if (contentTextareaRef.current) {
        const { selectionStart, selectionEnd } = contentTextareaRef.current;
        const newContent = content.substring(0, selectionStart) + emoji + content.substring(selectionEnd);
        setContent(newContent);
        // Focus and set cursor position after the inserted emoji
        setTimeout(() => {
          contentTextareaRef.current?.focus();
          contentTextareaRef.current!.selectionStart = contentTextareaRef.current!.selectionEnd = selectionStart + emoji.length;
        }, 0);
      }
    };

    const handleCloudinaryUpload = async (file: File) => {
        if (!file) return;

        setIsUploading(true);
        setUploadStatus(`Uploading ${file.name}...`);
        setError('');

        const sizeError = getCloudinaryFileSizeError(file);
        if (sizeError) {
            setError(sizeError);
            setUploadStatus(sizeError);
            setIsUploading(false);
            return;
        }

        const resourceType = getCloudinaryResourceType(file);
        const uploadDetails = getCloudinaryUploadDetails(resourceType);
        if ('error' in uploadDetails) {
            setError(uploadDetails.error);
            setUploadStatus(uploadDetails.error);
            setIsUploading(false);
            return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('upload_preset', uploadDetails.uploadPreset);

        try {
            const response = await fetch(uploadDetails.uploadUrl, { method: 'POST', body: uploadFormData, mode: 'cors' });
            const data = await response.json();

            if (response.ok && data.secure_url) {
                handleFileAdd(data.secure_url);
                setUploadStatus("Upload successful!");
                setTimeout(() => setUploadStatus(null), 2000);
            } else {
                throw new Error(data.error?.message || `Upload failed.`);
            }
        } catch (err: any) {
            setError(`Upload failed: ${err.message}`);
            setUploadStatus(`Error: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() && mediaUrls.length === 0) {
            setError('Post content or media is required.');
            return;
        }
        
        let finalTitle = title.trim();
        if (postType === 'prayer' && !finalTitle) {
            finalTitle = content.split(' ').slice(0, 7).join(' ') + (content.length > 50 ? '...' : '');
        } else if (!finalTitle) {
            setError('Title is required for this post type.');
            return;
        }

        setError('');
        setIsSubmitting(true);

        const commonData = {
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
            incidentAt: incidentAt || undefined,
        };

        let formData: any;
        let contentType: 'prayerRequest' | 'testimonial' = 'prayerRequest';

        try {
            switch(postType) {
                case 'prayer':
                    contentType = 'prayerRequest';
                    formData = {
                      ...commonData,
                      title: finalTitle,
                      requestText: content,
                      // Visibility selection removed from UI; always save as public.
                      visibility: 'public',
                      category: prayerCategory || prayerRequestCategoriesList[0],
                    } as PrayerRequestFormData;
                    break;
                case 'testimonial':
                    contentType = 'testimonial';
                    formData = {
                      ...commonData,
                      title: finalTitle,
                      contentText: content,
                      // Visibility selection removed from UI; always save as public.
                      visibility: 'public',
                    } as TestimonialFormData;
                    break;
            }

            const result = await addContent(contentType, formData);
            if (!result.success) throw new Error(result.message || `Failed to create ${postType}.`);
            onClose();

        } catch (err: any) {
            setError(`An error occurred: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const TypeButton = ({ type, label, icon }: { type: PostType, label: string, icon: React.ReactNode }) => (
        <button
          type="button"
          onClick={() => setPostType(type)}
          className={`flex items-center justify-center flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors border ${postType === type ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
        >
            {icon}
            <span className="ml-1.5">{label}</span>
        </button>
    );

    const renderSpecificFields = () => {
        switch(postType) {
            case 'prayer':
              return (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">🙏</span>
                  <select
                    aria-label="Prayer request category"
                    value={prayerCategory || prayerRequestCategoriesList[0]}
                    onChange={e => setPrayerCategory(e.target.value as any)}
                    className="text-xs px-2 py-1.5 border rounded-lg bg-white text-slate-700 border-slate-200"
                  >
                    {prayerRequestCategoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              );
            case 'testimonial':
              return (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">✨</span>
                  <span className="text-xs text-slate-600">Share your testimony</span>
                </div>
              );
            default:
              return null;
        }
    };

    const isLikelyVideoUrl = (url: string) => /\/video\//.test(url) || /\.(mp4|webm|mov)(\?|$)/i.test(url);
    const isLikelyAudioUrl = (url: string) => /\.(mp3|wav|m4a|aac|ogg)(\?|$)/i.test(url);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Create ${postType}`} size="lg">
             <div className="p-1 flex flex-col bg-white">
                <div className="flex-grow overflow-y-auto px-4 pt-4 scrollbar-thin scrollbar-thumb-slate-300 bg-white">
                   {/* User Header */}
                    <div className="flex items-center space-x-3 mb-4">
                        <img src={currentUser?.profileImageUrl} alt="Your profile" className="w-10 h-10 rounded-full object-cover"/>
                        <div>
                            <p className="font-semibold text-slate-900">{currentUser?.fullName}</p>
                            <div className="mt-1">{renderSpecificFields()}</div>
                        </div>
                    </div>
                    
                    {/* Post Type Switcher */}
                    <div className="flex gap-2 mb-4">
                         <TypeButton type="prayer" label="Prayer Request" icon={<PrayerHandsIcon className="w-4 h-4"/>} />
                         <TypeButton type="testimonial" label="Testimony" icon={<TestimonyIcon className="w-4 h-4"/>} />
                    </div>

                    {/* Content Area */}
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder={postType === 'testimonial' ? "✨ Testimony title*" : "🙏 Prayer title (optional)"}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full text-base font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900"
                        />
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                📅 Incident date (optional)
                            </label>
                            <input
                                type="date"
                                value={incidentAt}
                                onChange={(e) => setIncidentAt(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900"
                            />
                        </div>
                        <div className="relative">
                            <textarea
                                ref={contentTextareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={postType === 'testimonial' ? "✨ Share what God has done..." : "🙏 Share your prayer request..."}
                                className="w-full text-sm px-3 py-3 border border-slate-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-none min-h-[130px] bg-white text-slate-900"
                                rows={6}
                            />
                            <button type="button" onClick={() => setShowEmojiPicker(p => !p)} className="absolute bottom-2 right-2 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200">
                                <FaceSmileIcon className="w-5 h-5 text-slate-600"/>
                            </button>
                        </div>
                    </div>
                    
                    {showEmojiPicker && (
                        <div className="p-2 border rounded-lg bg-white shadow-lg mt-2">
                            {Object.entries(emojiCategories).map(([category, emojis]) => (
                                <div key={category} className="mb-2 last:mb-0">
                                    <p className="text-xs font-semibold text-slate-500 mb-1">{category}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {emojis.map(emoji => (
                                            <button type="button" key={emoji} onClick={() => handleEmojiSelect(emoji)} className="text-xl p-1 rounded-md hover:bg-slate-200">
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                     {/* Media Preview */}
                    {mediaUrls.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {mediaUrls.map(url => (
                                <div key={url} className="relative group border border-slate-200 rounded-lg overflow-hidden bg-white">
                                  {isLikelyVideoUrl(url) ? (
                                    <video src={url} className="w-full h-24 object-cover" controls />
                                  ) : isLikelyAudioUrl(url) ? (
                                    <div className="w-full h-24 flex items-center justify-center p-2">
                                      <audio src={url} className="w-full" controls />
                                    </div>
                                  ) : (
                                    <img src={url} className="w-full h-24 object-cover" alt="media preview"/>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleFileRemove(url)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                                    aria-label="Remove media"
                                  >
                                    <XCircleIcon className="w-4 h-4"/>
                                  </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Tray */}
                <div className="border border-slate-200 rounded-lg p-2 mt-2 flex flex-wrap justify-around items-center bg-white">
                    <AdvancedMediaUploader
                      label="Media"
                      mediaType="any"
                      onUrlChange={handleFileAdd}
                      onFileUpload={handleCloudinaryUpload}
                      isUploading={isUploading}
                      uploadStatus={uploadStatus}
                      className="!p-0"
                      childrenAsTrigger
                    >
                         <button type="button" className="flex items-center text-sm p-2 rounded-md hover:bg-slate-50 text-slate-700">
                           <PhotoIcon className="w-5 h-5"/>
                           <span className="ml-1.5">📎 Add media</span>
                         </button>
                    </AdvancedMediaUploader>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(true)}
                      className="flex items-center text-sm p-2 rounded-md hover:bg-slate-50 text-slate-700"
                    >
                      <SparklesIcon className="w-5 h-5"/>
                      <span className="ml-1.5">😊 Emojis</span>
                    </button>
                </div>

                {/* Footer and Submit */}
                <div className="pt-3 mt-4">
                     {error && <p className="text-xs text-red-500 mb-2 text-center" role="alert">{error}</p>}
                    <Button onClick={handleSubmit} disabled={isSubmitting || isUploading} className="w-full">
                        {isSubmitting || isUploading ? 'Posting...' : 'Post'}
                    </Button>
                </div>
             </div>
        </Modal>
    );
};

export default CreatePostModal;






