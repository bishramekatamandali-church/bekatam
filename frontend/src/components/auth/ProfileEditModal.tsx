import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User, relationshipStatusList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import AdvancedMediaUploader from '../admin/AdvancedMediaUploader';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateSuccess: () => void;
  onUpdateFailure: (error: string) => void;
}

// Define types for Cloudinary API response (can be moved to a shared types file if used elsewhere)
interface CloudinaryError {
  message: string;
}
interface CloudinaryResponse {
  secure_url?: string;
  error?: CloudinaryError;
}

const CLOUDINARY_CLOUD_NAME = 'dl94nfxom'; 
const CLOUDINARY_UPLOAD_PRESET = 'bishram_ekata_mandali';

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  const { updateUserProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [uploading, setUploading] = useState<Record<string, string | null>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        profileImageUrl: user.profileImageUrl || '',
        coverPhotoUrl: user.coverPhotoUrl || '',
        bio: user.bio || '',
        work: user.work || '',
        education: user.education || '',
        hometown: user.hometown || '',
        currentCity: user.currentCity || '',
        relationshipStatus: user.relationshipStatus || 'Single',
        interests: user.interests || '',
        favoriteScripture: user.favoriteScripture || '',
      });
      setFormError(null);
      setUploading({});
      setIsUploading({});
      setIsSubmitting(false);
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUrlChange = (fieldName: keyof typeof formData, url: string) => {
    setFormData(prev => ({...prev, [fieldName]: url}));
  };

  const handleFileUpload = async (file: File, fieldName: 'profileImageUrl' | 'coverPhotoUrl') => {
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [fieldName]: true }));
    setUploading(prev => ({ ...prev, [fieldName]: `Uploading ${file.name}...`}));
    setFormError(null);

    const uploadFormDataBody = new FormData();
    uploadFormDataBody.append('file', file);
    uploadFormDataBody.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST', body: uploadFormDataBody, mode: 'cors'
      });
      const data = await response.json();

      if (response.ok && data.secure_url) {
        setFormData(prev => ({ ...prev, [fieldName]: data.secure_url }));
        setUploading(prev => ({...prev, [fieldName]: 'Upload successful!'}));
      } else {
        throw new Error(data.error?.message || 'Unknown upload error');
      }
    } catch (err: any) {
      setFormError(`Upload failed: ${err.message}`);
    } finally {
        setIsUploading(prev => ({ ...prev, [fieldName]: false }));
        setTimeout(() => setUploading(prev => ({...prev, [fieldName]: null})), 3000);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!formData.fullName?.trim() || !formData.email?.trim()) {
      setFormError("Full Name and Email are required.");
      setIsSubmitting(false);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setFormError("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (updateUserProfile) {
      const success = await updateUserProfile(user.id, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined, 
        profileImageUrl: formData.profileImageUrl || undefined,
        coverPhotoUrl: formData.coverPhotoUrl || undefined,
        bio: formData.bio || undefined,
        work: formData.work || undefined,
        education: formData.education || undefined,
        hometown: formData.hometown || undefined,
        currentCity: formData.currentCity || undefined,
        relationshipStatus: formData.relationshipStatus || undefined,
        interests: formData.interests || undefined,
        favoriteScripture: formData.favoriteScripture || undefined,
      });
      if (success) {
        onUpdateSuccess();
        onClose();
      } else {
        onUpdateFailure("Failed to update profile. Please try again.");
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Your Profile" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {formError && (
            <div className="p-3 rounded-md bg-red-100 text-red-700 text-sm" role="alert">
              {formError}
            </div>
          )}
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-slate-800 dark:text-slate-100">Core Information</h3>
            <div><label htmlFor="fullName" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Full Name</label><input type="text" id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} required className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200"/></div>
            <div className="mt-4"><label htmlFor="email" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Email Address</label><input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200"/><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Note: Email changes may require verification in a live system.</p></div>
            <div className="mt-4"><label htmlFor="phone" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Phone Number (Optional)</label><input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200"/></div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
             <h3 className="font-semibold text-lg mb-2 text-slate-800 dark:text-slate-100">About You</h3>
             <div><label htmlFor="bio" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Bio</label><textarea id="bio" name="bio" value={formData.bio || ''} onChange={handleChange} rows={3} placeholder="A short bio about yourself..." className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200"/></div>
             <div className="mt-4"><label htmlFor="favoriteScripture" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Favorite Scripture</label><input type="text" id="favoriteScripture" name="favoriteScripture" value={formData.favoriteScripture || ''} onChange={handleChange} placeholder="e.g., John 3:16" className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200"/></div>
          </div>

           <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
             <h3 className="font-semibold text-lg mb-2 text-slate-800 dark:text-slate-100">Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="work" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Work</label><input type="text" id="work" name="work" value={formData.work || ''} onChange={handleChange} placeholder="e.g., Software Engineer at BEM" className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"/></div>
                <div><label htmlFor="education" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Education</label><input type="text" id="education" name="education" value={formData.education || ''} onChange={handleChange} placeholder="e.g., Studied at TU" className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"/></div>
                <div><label htmlFor="hometown" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Hometown</label><input type="text" id="hometown" name="hometown" value={formData.hometown || ''} onChange={handleChange} placeholder="e.g., Kathmandu, Nepal" className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"/></div>
                <div><label htmlFor="currentCity" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Current City</label><input type="text" id="currentCity" name="currentCity" value={formData.currentCity || ''} onChange={handleChange} placeholder="e.g., Lalitpur, Nepal" className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"/></div>
                <div><label htmlFor="relationshipStatus" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Relationship Status</label><select id="relationshipStatus" name="relationshipStatus" value={formData.relationshipStatus || ''} onChange={handleChange} className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"><option value="">-- Select --</option>{relationshipStatusList.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label htmlFor="interests" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Interests</label><input type="text" id="interests" name="interests" value={formData.interests || ''} onChange={handleChange} placeholder="e.g., Reading, Hiking, Music" className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"/></div>
             </div>
           </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
             <h3 className="font-semibold text-lg mb-2 text-slate-800 dark:text-slate-100">Profile Images</h3>
             <AdvancedMediaUploader label="Profile Picture" mediaType="image" currentUrl={formData.profileImageUrl} onUrlChange={(url) => handleUrlChange('profileImageUrl', url)} onFileUpload={(file) => handleFileUpload(file, 'profileImageUrl')} uploadStatus={uploading['profileImageUrl']} isUploading={isUploading['profileImageUrl']} />
             <AdvancedMediaUploader label="Cover Photo" mediaType="image" currentUrl={formData.coverPhotoUrl} onUrlChange={(url) => handleUrlChange('coverPhotoUrl', url)} onFileUpload={(file) => handleFileUpload(file, 'coverPhotoUrl')} uploadStatus={uploading['coverPhotoUrl']} isUploading={isUploading['coverPhotoUrl']} />
          </div>

        </div> 
        
        <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || Object.values(isUploading).some(s => s)}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileEditModal;