import React, { useEffect, useMemo, useState } from 'react';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AdvancedMediaUploader from '../../components/admin/AdvancedMediaUploader';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { DonatePageContent } from '../../types';
import {
  getCloudinaryFileSizeError,
  getCloudinaryResourceType,
  getCloudinaryUploadDetails,
} from '../../utils/cloudinary';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const ManageDonatePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { donatePageContent, loadingContent, updateContent } = useContent();

  const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);

  const [formData, setFormData] = useState<DonatePageContent>(() => donatePageContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Per-field upload state (so admin can see which upload is pending)
  const [isFieldUploading, setIsFieldUploading] = useState<Record<string, boolean>>({});
  const [uploadingStatus, setUploadingStatus] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setFormData(donatePageContent);
  }, [donatePageContent]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...(prev as any), [name]: value } as DonatePageContent));
  };

  const handleUrlChange = (fieldName: keyof DonatePageContent, url: string) => {
    setFormData((prev) => ({ ...(prev as any), [fieldName]: url } as DonatePageContent));
  };

  // ✅ Real Cloudinary upload (replaces base64 "Simulating upload")
  const handleFileUpload = async (file: File, fieldName: keyof DonatePageContent) => {
    if (!(file instanceof File)) {
      setUploadingStatus((prev) => ({ ...prev, [fieldName]: 'Upload error: invalid file.' }));
      return;
    }

    setIsFieldUploading((prev) => ({ ...prev, [fieldName]: true }));
    setUploadingStatus((prev) => ({ ...prev, [fieldName]: `Uploading ${file.name}...` }));

    const sizeError = getCloudinaryFileSizeError(file);
    if (sizeError) {
      setUploadingStatus((prev) => ({ ...prev, [fieldName]: sizeError }));
      setIsFieldUploading((prev) => ({ ...prev, [fieldName]: false }));
      return;
    }

    const resourceType = getCloudinaryResourceType(file);
    const uploadDetails = getCloudinaryUploadDetails(resourceType);

    if ('error' in uploadDetails) {
      setUploadingStatus((prev) => ({ ...prev, [fieldName]: uploadDetails.error }));
      setIsFieldUploading((prev) => ({ ...prev, [fieldName]: false }));
      return;
    }

    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', uploadDetails.uploadPreset);

    try {
      const resp = await fetch(uploadDetails.uploadUrl, {
        method: 'POST',
        body,
        mode: 'cors',
      });

      const data = await resp.json();

      if (resp.ok && data.secure_url) {
        setFormData((prev) => ({ ...(prev as any), [fieldName]: data.secure_url } as DonatePageContent));
        setUploadingStatus((prev) => ({ ...prev, [fieldName]: 'Upload successful!' }));
        setTimeout(() => {
          setUploadingStatus((prev) => ({ ...prev, [fieldName]: null }));
        }, 5000);
      } else {
        const msg = data?.error?.message || `Upload failed (HTTP ${resp.status}).`;
        setUploadingStatus((prev) => ({ ...prev, [fieldName]: `Error: ${msg}` }));
      }
    } catch (err: any) {
      setUploadingStatus((prev) => ({
        ...prev,
        [fieldName]: `Network error: ${err?.message || 'Unknown issue.'}`,
      }));
    } finally {
      setIsFieldUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    // Block save while any upload is running
    const stillUploading = Object.values(isFieldUploading).some(Boolean);
    if (stillUploading) {
      setFeedback({ type: 'error', message: 'Please wait until all uploads finish, then save again.' });
      setIsSubmitting(false);
      return;
    }

    const result = await updateContent('donatePageContent', 'singleton', formData);

    if (result.success) {
      setFeedback({ type: 'success', message: 'Donate page content updated successfully!' });
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Failed to update donate page content. Please try again later.',
      });
    }

    setIsSubmitting(false);
    setTimeout(() => setFeedback(null), 5000);
  };

  if (loadingContent) {
    return <p className="text-slate-500">Loading donate page content...</p>;
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent>
          <p className="text-slate-600 text-center py-8">You do not have permission to manage this page.</p>
        </CardContent>
      </Card>
    );
  }

  const UploadStatus: React.FC<{ field: keyof DonatePageContent }> = ({ field }) => {
    const msg = uploadingStatus[field as string];
    if (!msg) return null;
    return <p className="text-xs mt-2 text-slate-500">{msg}</p>;
  };

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Manage Donate Page Content</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Edit the information displayed on the public "Donate" page.</p>
      </header>

      {feedback && (
        <div
          className={`p-3 mb-4 rounded-md text-sm ${
            feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          <Card className="dark:bg-slate-800">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Header Section</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="headerTitle" className="block text-sm font-medium dark:text-slate-300">Header Title</label>
                <input
                  type="text"
                  name="headerTitle"
                  value={formData.headerTitle || ''}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label htmlFor="headerSubtitle" className="block text-sm font-medium dark:text-slate-300">Header Subtitle (Scripture)</label>
                <textarea
                  name="headerSubtitle"
                  value={formData.headerSubtitle || ''}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <AdvancedMediaUploader
                label="Header Background Image"
                mediaType="image"
                currentUrl={formData.headerImageUrl}
                onUrlChange={(url) => handleUrlChange('headerImageUrl', url)}
                onFileUpload={(file) => handleFileUpload(file, 'headerImageUrl')}
              />
              <UploadStatus field="headerImageUrl" />
            </CardContent>
          </Card>
     
          <Card className="dark:bg-slate-800">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Homepage Donation Card</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="homepageCardTitle" className="block text-sm font-medium dark:text-slate-300">Card Title</label>
                <input
                  type="text"
                  name="homepageCardTitle"
                  value={formData.homepageCardTitle || ''}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label htmlFor="homepageCardSubtitle" className="block text-sm font-medium dark:text-slate-300">Card Subtitle</label>
                <textarea
                  name="homepageCardSubtitle"
                  value={formData.homepageCardSubtitle || ''}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label htmlFor="homepageCardHighlight" className="block text-sm font-medium dark:text-slate-300">Highlight Line</label>
                <input
                  type="text"
                  name="homepageCardHighlight"
                  value={formData.homepageCardHighlight || ''}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label htmlFor="homepageCardCtaText" className="block text-sm font-medium dark:text-slate-300">CTA Button Text</label>
                <input
                  type="text"
                  name="homepageCardCtaText"
                  value={formData.homepageCardCtaText || ''}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <AdvancedMediaUploader
                label="Card Background Image"
                mediaType="image"
                currentUrl={formData.homepageCardImageUrl}
                onUrlChange={(url) => handleUrlChange('homepageCardImageUrl', url)}
                onFileUpload={(file) => handleFileUpload(file, 'homepageCardImageUrl')}
              />
              <UploadStatus field="homepageCardImageUrl" />
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Local Donations Section</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="localDonationsTitle" className="block text-sm font-medium dark:text-slate-300">Section Title</label>
                <input
                  type="text"
                  name="localDonationsTitle"
                  value={formData.localDonationsTitle || ''}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium dark:text-slate-300">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName || ''}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label htmlFor="accountName" className="block text-sm font-medium dark:text-slate-300">Account Name</label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName || ''}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium dark:text-slate-300">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber || ''}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label htmlFor="branch" className="block text-sm font-medium dark:text-slate-300">Branch</label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch || ''}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <AdvancedMediaUploader
                label="Bank Transfer QR Code (e.g., Fonepay)"
                mediaType="image"
                currentUrl={formData.bankQrImageUrl}
                onUrlChange={(url) => handleUrlChange('bankQrImageUrl', url)}
                onFileUpload={(file) => handleFileUpload(file, 'bankQrImageUrl')}
              />
              <UploadStatus field="bankQrImageUrl" />

              <hr className="dark:border-slate-600" />

              <div>
                <label htmlFor="eSewaId" className="block text-sm font-medium dark:text-slate-300">eSewa ID / Details</label>
                <input
                  type="text"
                  name="eSewaId"
                  value={formData.eSewaId || ''}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>

              <AdvancedMediaUploader
                label="eSewa QR Code Image"
                mediaType="image"
                currentUrl={formData.eSewaQrImageUrl}
                onUrlChange={(url) => handleUrlChange('eSewaQrImageUrl', url)}
                onFileUpload={(file) => handleFileUpload(file, 'eSewaQrImageUrl')}
              />
              <UploadStatus field="eSewaQrImageUrl" />

              <div>
                <label htmlFor="localDonationsNote" className="block text-sm font-medium dark:text-slate-300">Instruction Note</label>
                <input
                  type="text"
                  name="localDonationsNote"
                  value={formData.localDonationsNote || ''}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">International Donations Section</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="internationalDonationsTitle" className="block text-sm font-medium dark:text-slate-300">Section Title</label>
                <input
                  type="text"
                  name="internationalDonationsTitle"
                  value={formData.internationalDonationsTitle || ''}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label htmlFor="internationalDonationsContent" className="block text-sm font-medium dark:text-slate-300">Instructional Content</label>
                <textarea
                  name="internationalDonationsContent"
                  value={formData.internationalDonationsContent || ''}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label htmlFor="internationalDonationsContactEmail" className="block text-sm font-medium dark:text-slate-300">Contact Email</label>
                <input
                  type="email"
                  name="internationalDonationsContactEmail"
                  value={formData.internationalDonationsContactEmail || ''}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                />
              </div>

              <AdvancedMediaUploader
                label="International Transaction QR Code (e.g., Wise)"
                mediaType="image"
                currentUrl={formData.internationalQrImageUrl}
                onUrlChange={(url) => handleUrlChange('internationalQrImageUrl', url)}
                onFileUpload={(file) => handleFileUpload(file, 'internationalQrImageUrl')}
              />
              <UploadStatus field="internationalQrImageUrl" />
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-800">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Donation Receipt Verses</h2>
            </CardHeader>
            <CardContent>
              <div>
                <label htmlFor="receiptVerses" className="block text-sm font-medium dark:text-slate-300">Bible Verses for Receipts</label>
                <textarea
                  name="receiptVerses"
                  id="receiptVerses"
                  value={formData.receiptVerses || ''}
                  onChange={handleChange}
                  rows={6}
                  className="mt-1 w-full p-2 border dark:border-slate-600 rounded dark:bg-slate-700 dark:text-slate-200"
                  placeholder="Enter Bible verses here, separated by a new line. One will be chosen randomly for each receipt."
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter each verse on a new line.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end sticky bottom-0 bg-white dark:bg-slate-800 py-4 px-6 -mx-6 -mb-6 rounded-b-lg border-t dark:border-slate-700">
            <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ManageDonatePage;
