import React, { useMemo, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { formatTimestampADBS } from '../dateConverter';
import AdvancedMediaUploader from '../components/admin/AdvancedMediaUploader';
import { getCloudinaryFileSizeError, getCloudinaryUploadDetails } from '../utils/cloudinary';

const ProfilePage: React.FC = () => {
  const { currentUser, loadingAuthState, updateUserProfile } = useAuth();
  const { blogPosts, prayerRequests, testimonials } = useContent();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    profileImageUrl: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        profileImageUrl: currentUser.profileImageUrl || '',
      });
    }
  }, [currentUser]);

  const activityItems = useMemo(() => {
    if (!currentUser) return [];
    
     return [
      ...blogPosts
        .filter((post) => post.postedByAdminId === currentUser.id)
        .map((post) => ({
          id: post.id,
          title: post.title,
          type: 'Blog Post',
          timestamp: post.publishedAt || post.createdAt,
        })),
      ...prayerRequests
        .filter((request) => request.postedByAdminId === currentUser.id)
        .map((request) => ({
          id: request.id,
          title: request.title,
          type: 'Prayer Request',
          timestamp: request.submittedAt || request.createdAt,
        })),
      ...testimonials
        .filter((testimonial) => testimonial.userId === currentUser.id)
        .map((testimonial) => ({
          id: testimonial.id,
          title: testimonial.title || 'Testimonial',
          type: 'Testimonial',
          timestamp: testimonial.createdAt,
        })),
    ].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    }, [blogPosts, prayerRequests, testimonials, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, profileImageUrl: url }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploading(`Uploading ${file.name}...`);
    setFormError(null);
    setFormSuccess(null);

    const sizeError = getCloudinaryFileSizeError(file);
    if (sizeError) {
      setFormError(sizeError);
      setUploading(sizeError);
      setIsUploading(false);
      setTimeout(() => setUploading(null), 3000);
      return;
    }

    const uploadDetails = getCloudinaryUploadDetails('image');
    if ('error' in uploadDetails) {
      setFormError(uploadDetails.error);
      setUploading(uploadDetails.error);
      setIsUploading(false);
      setTimeout(() => setUploading(null), 3000);
      return;
    }

    const uploadFormDataBody = new FormData();
    uploadFormDataBody.append('file', file);
    uploadFormDataBody.append('upload_preset', uploadDetails.uploadPreset);

    try {
      const response = await fetch(uploadDetails.uploadUrl, {
        method: 'POST',
        body: uploadFormDataBody,
        mode: 'cors',
      });
      const data = await response.json();

      if (response.ok && data.secure_url) {
        setFormData((prev) => ({ ...prev, profileImageUrl: data.secure_url }));
        setUploading('Upload successful!');
      } else {
        throw new Error(data.error?.message || 'Unknown upload error');
      }
    } catch (error: any) {
      setFormError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploading(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !updateUserProfile) return;

    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    if (!formData.email.trim()) {
      setFormError('Email is required.');
      setIsSubmitting(false);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    const success = await updateUserProfile(currentUser.id, {
      email: formData.email,
      phone: formData.phone || undefined,
      profileImageUrl: formData.profileImageUrl || undefined,
    });

    if (success) {
      setFormSuccess('Profile updated successfully.');
    } else {
      setFormError('Failed to update profile. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (loadingAuthState) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-slate-600 dark:text-slate-300">Loading profile...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
 return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 bg-white dark:bg-white border-b">
          <div className="flex items-center space-x-4">
            {currentUser.profileImageUrl ? (
              <img
                src={currentUser.profileImageUrl}
                alt={currentUser.fullName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentUser.fullName}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">Member profile</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-white">
          <div className="md:col-span-2 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">About</h2>
              <p className="mt-2 text-slate-700 dark:text-slate-200 whitespace-pre-line">
                {currentUser.bio || 'No additional details provided yet.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white dark:bg-white border border-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{currentUser.email}</p>
              </div>
              <div className="p-4 rounded-lg bg-white dark:bg-white border border-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500">Contact Number</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{currentUser.phone || 'Not provided'}</p>
              </div>
            </div>
             </div>
          <div className="p-4 rounded-lg bg-white dark:bg-white border border-slate-200 space-y-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Profile Snapshot</h3>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Email</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-words">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Contact</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{currentUser.phone || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-white dark:bg-white">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Profile Settings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Update your profile image, email, and contact number. Your name cannot be changed.</p>
        </CardHeader>
        <CardContent className="bg-white dark:bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
                {formSuccess}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  value={currentUser.fullName}
                  disabled
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                />
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Profile Image</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Upload a new profile photo or paste an image URL.</p>
              <div className="mt-4">
                <AdvancedMediaUploader
                  label="Profile Picture"
                  mediaType="image"
                  currentUrl={formData.profileImageUrl}
                  onUrlChange={handleUrlChange}
                  onFileUpload={handleFileUpload}
                  uploadStatus={uploading}
                  isUploading={isUploading}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="inline-flex items-center justify-center rounded-md bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-400"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

        <Card>
        <CardHeader className="border-b bg-white dark:bg-white">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h2>
        </CardHeader>
        <CardContent className="space-y-4 bg-white dark:bg-white">
          {activityItems.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-300 py-6">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {activityItems.map((item) => (
                <li key={item.id} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.type}</p>
                  </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-4 whitespace-nowrap">
                    {item.timestamp ? formatTimestampADBS(item.timestamp) : 'No date'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage; 
