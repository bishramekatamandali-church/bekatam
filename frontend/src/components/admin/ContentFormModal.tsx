import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

import {
  ContentType,
  GenericContentFormData,
  SermonFormData,
  EventFormData,
  MinistryFormData,
  BlogPostFormData,
  HomeSlideFormData,
  AboutSectionFormData,
  KeyPersonFormData,
  HistoryMilestoneFormData,
  BranchChurchFormData,
  DirectMediaFormData,
  ChurchMemberFormData,
  MeetingLogFormData,
  DecisionLogFormData,
  ExpenseRecordFormData,
  CollectionRecordFormData,
  collectionPurposeList,
  MonthlyThemeImageFormData,
  HistoryChapterFormData,
  NewsItemFormData,
  FellowshipRosterFormData,
  AdvertisementFormData,
  ContentItem,
  DirectMediaItem,
  sermonCategoriesList,
  eventCategoriesList,
  eventScheduleTypeList,
  eventTypeOptions,
  ministryCategoriesList,
  blogPostCategoriesList,
  newsCategoriesList,
  MeetingDecisionPoint,
  expenseCategoriesList,
  paymentMethodOptions,
  rosterTypeList,
  adPlacementList,
  meetingTypeList,
  meetingLogStatusList,
  decisionLogStatusList,
  DonorDetail,
  HistoryChapter,
  FellowshipRosterItem,
  Advertisement,
  AD_SIZES,
  AdSizeKey,
  PrayerRequestFormData,
  prayerRequestCategoriesList,
  prayerRequestVisibilityList,
  DonationRecordFormData,
  donationPurposeList,
  DonatePageContentFormData,
  TestimonialFormData,
  testimonialVisibilityList,
  Responsibility,
  decisionLogStatusList as decisionPointStatusList,
  expenseStatusList,
} from '../../types';

import { adToBs, formatBSDate } from '../../dateConverter';

import SelectMediaModal from './SelectMediaModal';
import AdvancedMediaUploader from './AdvancedMediaUploader';
import {
  XCircleIcon,
  PhotoIcon,
  CalendarIcon as CalendarOutlineIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import RichTextEditor from '../ui/RichTextEditor';
import DualNepaliCalendar from '../calendar/DualNepaliCalendar';
import { getCloudinaryFileSizeError, getCloudinaryResourceType, getCloudinaryUploadDetails } from '../../utils/cloudinary';
import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_BS_YEAR = adToBs(new Date()).year

const FormSection: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}> = ({ title, children, className, titleClassName }) => (
  <div
    className={`pt-5 mt-5 border-t border-slate-200 dark:border-slate-700 first:mt-0 first:pt-0 first:border-t-0 ${className}`}
  >
    <h3 className={`text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 ${titleClassName || ''}`}>
      {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
      {children}
    </div>
  </div>
);

const FullWidthField: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="sm:col-span-2">{children}</div>
);

const inputClasses =
  'w-full p-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-800';
const labelClasses = 'block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1';

// Unified media component for sermons/events/blog/news
const UnifiedMediaInputs: React.FC<{
  formData: SermonFormData | EventFormData | BlogPostFormData | NewsItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleCloudinaryUpload: (file: File, fieldName: string) => void;
  handleImageFieldSelect: (fieldName: string) => void;
  isFieldUploading: Record<string, boolean>;
  uploadingStatus: Record<string, string | null>;
  variant?: 'default' | 'compact';
  containerClassName?: string;
  titleClassName?: string;
  forceLightText?: boolean;
}> = ({
  formData,
  setFormData,
  handleCloudinaryUpload,
  handleImageFieldSelect,
  isFieldUploading,
  uploadingStatus,
  variant = 'default',
  containerClassName,
  titleClassName,
  forceLightText = false,
}) => {
  const anyMediaFieldUploading =
    isFieldUploading['imageUrl'] ||
    isFieldUploading['videoUrl'] ||
    isFieldUploading['audioUrl'];

  const unifiedMediaInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUnifiedMediaUploadFile = async (file: File) => {
    if (!file) return;

    if (file.type.startsWith('image/')) {
      await handleCloudinaryUpload(file, 'imageUrl');
    } else if (file.type.startsWith('video/')) {
      await handleCloudinaryUpload(file, 'videoUrl');
    } else if (file.type.startsWith('audio/')) {
      await handleCloudinaryUpload(file, 'audioUrl');
    } else {
      alert('Unsupported file type. Please upload an image, video, or audio file.');
    }
   };

  const handleUnifiedMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleUnifiedMediaUploadFile(file);

    if (event.target) event.target.value = '';
  };

  const MediaSlot = ({ type, url }: { type: 'image' | 'video' | 'audio'; url?: string }) => {
    const fieldName = type === 'image' ? 'imageUrl' : `${type}Url`;
    const Icon = PhotoIcon;

    return (
      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 min-h-[120px] flex flex-col justify-center items-center text-center">
        {url ? (
          <>
            {type === 'image' && (
              <img src={url} alt="Preview" className="max-h-28 w-auto rounded" />
            )}
            {type === 'video' && (
              <video src={url} controls className="max-h-28 w-full rounded" />
            )}
            {type === 'audio' && <audio src={url} controls className="w-full" />}
            <button
              type="button"
              onClick={() =>
                setFormData((p: any) => ({
                  ...p,
                  [fieldName]: '',
                }))
              }
              className="absolute -top-2 -right-2 bg-white dark:bg-slate-700 rounded-full p-0.5"
            >
              <XCircleIcon className="w-5 h-5 text-red-500" />
            </button>
          </>
        ) : (
          <div className={forceLightText ? 'text-black/60' : 'text-slate-400 dark:text-slate-500'}>
            <Icon className="w-8 h-8 mx-auto" />
            <p className="text-xs mt-1">No {type} uploaded</p>
          </div>
        )}
        {isFieldUploading[fieldName] && uploadingStatus[fieldName] && (
          <p className="absolute bottom-1 text-xs text-purple-600 dark:text-purple-400 animate-pulse">
            {uploadingStatus[fieldName]}
          </p>
        )}
      </div>
    );
  };

  const hasAnyMedia = (['image', 'video', 'audio'] as const).some((type) => {
    const fieldName = type === 'image' ? 'imageUrl' : `${type}Url`;
    return Boolean((formData as any)[fieldName]);
  });

  return (
    <div className={`rounded-lg space-y-4 sm:col-span-2 ${variant === 'compact' ? 'p-3' : 'p-4'} bg-slate-100 dark:bg-slate-800/50 ${containerClassName || ''}`}>
      <h3 className={`font-semibold text-slate-800 dark:text-slate-200 ${titleClassName || ''}`}>Media Attachments</h3>
      {variant === 'default' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MediaSlot type="image" url={(formData as any).imageUrl} />
          <MediaSlot type="video" url={(formData as any).videoUrl} />
          <MediaSlot type="audio" url={(formData as any).audioUrl} />
        </div>
      ) : (
        <div className={`flex flex-wrap gap-2 text-xs ${forceLightText ? 'text-black/70' : 'text-slate-600 dark:text-slate-300'}`}>
          {(['image', 'video', 'audio'] as const).map((type) => {
            const fieldName = type === 'image' ? 'imageUrl' : `${type}Url`;
            const currentUrl = (formData as any)[fieldName];
            if (!currentUrl) return null;
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 shadow-sm ${forceLightText ? 'bg-white text-black/80' : 'bg-white dark:bg-slate-700'}`}
              >
                {type.toUpperCase()} attached
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p: any) => ({
                      ...p,
                      [fieldName]: '',
                    }))
                  }
                  className="text-red-500 hover:text-red-600"
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </span>
            );
          })}
          {!hasAnyMedia && <span>No media attached yet.</span>}
        </div>
      )}
      <div className={`${variant === 'compact' ? '' : 'pt-2 border-t border-slate-200 dark:border-slate-700'} space-y-3`}>
        <input
          type="file"
          ref={unifiedMediaInputRef}
          onChange={handleUnifiedMediaUpload}
          className="hidden"
          accept="image/*,video/*,audio/*"
          capture="environment"
        />
        {variant === 'compact' ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => unifiedMediaInputRef.current?.click()}
              disabled={anyMediaFieldUploading}
              className={`inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 ${forceLightText ? 'text-black' : 'text-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'}`}
            >
              <PhotoIcon className="h-5 w-5" /> Add Media
            </button>
            <Button
              type="button"
              onClick={() => handleImageFieldSelect('imageUrl')}
              disabled={anyMediaFieldUploading}
              size="sm"
              variant="outline"
              className={`text-xs ${forceLightText ? 'text-black border-slate-300 hover:bg-slate-100' : 'dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600'}`}
            >
              <PhotoIcon className="w-4 h-4 mr-1.5" /> Select from Gallery
            </Button>
          </div>
        ) : (
          <>
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center transition ${
                isDragging
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-500/10'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/40'
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async (event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (!file) return;
                await handleUnifiedMediaUploadFile(file);
              }}
            >
              <button
                type="button"
                onClick={() => unifiedMediaInputRef.current?.click()}
                disabled={anyMediaFieldUploading}
              className={`inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 ${forceLightText ? 'text-black' : 'text-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'}`}
            >
              <PhotoIcon className="h-5 w-5" /> Add Media
            </button>
              <p className={forceLightText ? 'mt-2 text-xs text-black/70' : 'mt-2 text-xs text-slate-500 dark:text-slate-400'}>
                Upload images, videos, or audio from your device (drag & drop works too).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => handleImageFieldSelect('imageUrl')}
                disabled={anyMediaFieldUploading}
                size="sm"
                variant="outline"
                className={`text-xs ${forceLightText ? 'text-black border-slate-300 hover:bg-slate-100' : 'dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600'}`}
              >
                <PhotoIcon className="w-4 h-4 mr-1.5" /> Select from Gallery
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const defaultFormValues: Record<ContentType, GenericContentFormData> = {
  sermon: {
    title: '',
    description: '',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
    incidentAt: new Date().toISOString().split('T')[0],
    category: sermonCategoriesList[0],
    speaker: '',
    scripture: '',
    videoUrl: '',
    audioUrl: '',
    fullContent: '',
  } as SermonFormData,

  event: {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    incidentAt: new Date().toISOString().split('T')[0],
    category: eventCategoriesList[0],
    eventType: 'REGULAR',
    scheduleType: 'ONE_TIME',
    scheduleNotes: '',
    locations: [],
    conductedBy: [],
    speakers: [],
    location: '',
    mapEmbedUrl: '',
    time: '10:00',
    expectations: '',
    guests: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    registrationLink: '#',
    capacity: 0,
    isFeeRequired: false,
    feeAmount: '',
    videoUrl: '',
    audioUrl: '',
  } as EventFormData,

  ministry: {
    title: '',
    description: '',
    category: ministryCategoriesList[0],
    leader: '',
    meetingTime: '',
    imageUrl: '',
  } as MinistryFormData,

  blogPost: {
    title: '',
    description: '',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
    incidentAt: new Date().toISOString().split('T')[0],
    category: blogPostCategoriesList[0],
    enableAutoNarration: true,
    videoUrl: '',
    audioUrl: '',
  } as BlogPostFormData,

  news: {
    title: '',
    description: '',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
    incidentAt: new Date().toISOString().split('T')[0],
    category: newsCategoriesList[0],
    enableAutoNarration: true,
    videoUrl: '',
    audioUrl: '',
  } as NewsItemFormData,

  homeSlide: {
    title: '',
    description: '',
    imageUrl: '',
    ctaText: 'Learn More',
    linkPath: '/',
    order: 0,
    isActive: true,
  } as HomeSlideFormData,

  aboutSection: {
    title: '',
    content: '',
    imageUrl: '',
    displayOrder: 0,
  } as AboutSectionFormData,

  keyPerson: {
    name: '',
    role: '',
    bio: '',
    imageUrl: '',
  } as KeyPersonFormData,

  historyMilestone: {
    year: new Date().getFullYear().toString(),
    title: '',
    description: '',
    imageUrl: '',
  } as HistoryMilestoneFormData,

  historyChapter: {
    chapterNumber: 1,
    title: '',
    content: '',
    status: 'draft',
    imageUrl: '',
    summary: '',
  } as HistoryChapterFormData,

  branchChurch: {
    name: '',
    address: '',
    serviceTimes: 'Saturdays at 11 AM',
  } as BranchChurchFormData,

  directMedia: {
    title: '',
    url: '',
    mediaType: 'image',
    uploadCategory: '',
    tagsString: '',
  } as DirectMediaFormData,

  churchMember: {
    fullName: '',
    memberSince: new Date().toISOString().split('T')[0],
    isActiveMember: true,
    dateOfBirth: '',
    baptismDate: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    familyMembers: '',
    notes: '',
    profileImageUrl: '',
  } as ChurchMemberFormData,

  meetingLog: {
    meetingDate: new Date().toISOString().split('T')[0],
    title: '',
    attendees: '',
    agenda: '',
    minutes: '',
    decisionPoints: [],
    meetingType: meetingTypeList[0],
    actionItems: [],
    status: meetingLogStatusList[0],
    imageUrl: '',
  } as MeetingLogFormData,

  decisionLog: {
    decisionDate: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    madeBy: '',
    status: decisionLogStatusList[0],
    followUpActions: [],
  } as DecisionLogFormData,

  expenseRecord: {
    expenseDate: new Date().toISOString().split('T')[0],
    category: expenseCategoriesList[0],
    description: '',
    amount: '',
    status: expenseStatusList[0],
  } as ExpenseRecordFormData,

  collectionRecord: {
    collectorName: '',
    collectionDate: new Date().toISOString().split('T')[0],
    amount: '',
    purpose: collectionPurposeList[0],
    donors: [],
    isDeposited: false,
  } as CollectionRecordFormData,

  monthlyThemeImage: {
    year: DEFAULT_BS_YEAR,
    month: adToBs(new Date()).month,
    imageUrlsString: '',
    quoteOrCaption: '',
  } as MonthlyThemeImageFormData,

  fellowshipRoster: {
    rosterType: rosterTypeList[0],
    groupNameOrEventTitle: '',
    assignedDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 11:00 AM',
    responsibilities: [],
    isTemplate: false,
  } as FellowshipRosterFormData,

  advertisement: {
    name: '',
    adType: 'image_banner',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
    altText: '',
    placements: [],
    startDate: '',
    endDate: '',
    isActive: true,
    displayOrder: 0,
    adSizeKey: Object.keys(AD_SIZES)[0] as AdSizeKey,
  } as AdvertisementFormData,

  prayerRequest: {
    title: '',
    requestText: '',
    visibility: 'public',
    category: prayerRequestCategoriesList[0],
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
  } as PrayerRequestFormData,

  testimonial: {
    title: '',
    contentText: '',
    visibility: 'public',
  } as TestimonialFormData,

  donation: {
    donorName: '',
    donorEmail: '',
    amount: '',
    purpose: donationPurposeList[0],
    donationDate: new Date().toISOString().split('T')[0],
    isReceiptSent: false,
  } as DonationRecordFormData,

  donatePageContent: {
    headerTitle: '',
    headerSubtitle: '',
    headerImageUrl: '',
    localDonationsTitle: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    eSewaId: '',
    localDonationsNote: '',
    internationalDonationsTitle: '',
    internationalDonationsContent: '',
    internationalDonationsContactEmail: '',
  } as DonatePageContentFormData,

  contactMessage: {} as any,
  ministryJoinRequest: {} as any,
  mediaItem: {} as DirectMediaItem,
  generatedSchedule: {} as any,
};

interface ContentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GenericContentFormData) => Promise<void>;
  contentType: ContentType;
  initialData?: ContentItem | null;
  isLoading?: boolean;
  isCoreSectionEditing?: boolean;
  createDefaults?: Partial<GenericContentFormData>;
  enableAutoNarration?: boolean;
}

const ContentFormModal: React.FC<ContentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  contentType,
  initialData,
  isLoading = false,
  isCoreSectionEditing = false,
  createDefaults,
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<GenericContentFormData>(
    defaultFormValues[contentType]
  );
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [targetImageField, setTargetImageField] = useState<string | null>(null);
  const [bsDateDisplays, setBsDateDisplays] = useState<Record<string, string>>({});
  const [pickerVisibleFor, setPickerVisibleFor] = useState<string | null>(null);

  const [uploadingStatus, setUploadingStatus] = useState<Record<string, string | null>>({});
  const [isFieldUploading, setIsFieldUploading] = useState<Record<string, boolean>>({});
  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);
  const [locationLookupStatus, setLocationLookupStatus] = useState<string | null>(null);
  const isSermonForm = contentType === 'sermon';
  const resolvedLabelClasses = isSermonForm
    ? 'block text-xs font-medium text-black mb-1'
    : labelClasses;
  const resolvedInputClasses = isSermonForm
    ? 'w-full p-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white text-black placeholder:text-slate-400 disabled:bg-slate-100'
    : inputClasses;
  const resolvedSectionTitleClasses = isSermonForm ? 'text-black dark:text-black' : '';

  const dateFieldsConfig: Record<string, string[]> = {
    sermon: ['incidentAt'],
    event: ['incidentAt'],
    blogPost: ['incidentAt'],
    news: ['incidentAt'],
    branchChurch: ['establishedDate'],
    churchMember: ['memberSince', 'dateOfBirth', 'baptismDate'],
    meetingLog: ['meetingDate'],
    decisionLog: ['decisionDate'],
    expenseRecord: ['expenseDate'],
    collectionRecord: ['collectionDate', 'depositDate'],
    fellowshipRoster: ['assignedDate'],
    advertisement: ['startDate', 'endDate'],
    donation: ['donationDate'],
  };

  const bsYearOptions = useMemo(() => {
    const currentBsYear = adToBs(new Date()).year;
    return Array.from({ length: 25 }, (_, i) => currentBsYear - 15 + i).sort(
      (a, b) => b - a
    );
  }, []);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const handleUseCurrentLocation = useCallback((mode: 'single' | 'event-list' = 'single') => {
    if (!navigator.geolocation) {
      setLocationLookupStatus('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLookupStatus('Fetching location from Google Maps...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        let resolvedLocation = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        if (googleMapsApiKey) {
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsApiKey}`
            );
            const data = await response.json();
            if (data.status === 'OK' && data.results?.[0]?.formatted_address) {
              resolvedLocation = data.results[0].formatted_address;
              setLocationLookupStatus('Location updated from Google Maps.');
            } else {
              setLocationLookupStatus('Google Maps could not resolve the address. Using coordinates.');
            }
          } catch (error) {
            setLocationLookupStatus('Unable to reach Google Maps. Using coordinates.');
          }
        } else {
          setLocationLookupStatus('Coordinates captured. Add a Google Maps API key to auto-resolve the address.');
        }

        setFormData((prev) => {
          if (mode === 'event-list') {
            const currentLocations = Array.isArray((prev as EventFormData).locations)
              ? ((prev as EventFormData).locations as string[])
              : [];
            const nextLocations = currentLocations.includes(resolvedLocation)
              ? currentLocations
              : [...currentLocations, resolvedLocation];
            return {
              ...(prev as EventFormData),
              locations: nextLocations,
              location: (prev as EventFormData).location || resolvedLocation,
            };
          }

          return {
            ...prev,
            location: resolvedLocation,
          };
        });
      },
      () => {
        setLocationLookupStatus('Unable to access your location. Check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (isOpen) {
      setLocationLookupStatus(null);
      const mergedDefaults = createDefaults && !initialData
        ? { ...(defaultFormValues[contentType] as GenericContentFormData), ...createDefaults }
        : defaultFormValues[contentType];

      let dataToSet: GenericContentFormData = initialData
        ? ({ ...defaultFormValues[contentType], ...initialData } as GenericContentFormData)
        : ({ ...mergedDefaults } as GenericContentFormData);

      if ((dataToSet as any).date && !(dataToSet as any).incidentAt) {
        (dataToSet as any).incidentAt = (dataToSet as any).date;
      }
      if ((dataToSet as any).incidentAt && !(dataToSet as any).date) {
        (dataToSet as any).date = (dataToSet as any).incidentAt;
      }

      const newBsDateDisplays: Record<string, string> = {};
      const fieldsForType = dateFieldsConfig[contentType] || [];

      fieldsForType.forEach((fieldName) => {
        let adDateString = (dataToSet as any)[fieldName];

        if (adDateString && typeof adDateString === 'string') {
          try {
            const adDateObj = new Date(adDateString);
            if (!isNaN(adDateObj.getTime())) {
              (dataToSet as any)[fieldName] = adDateObj.toISOString().split('T')[0];
              const bs = adToBs(adDateObj);
              newBsDateDisplays[fieldName] = formatBSDate(bs);
            } else {
              (dataToSet as any)[fieldName] = '';
              newBsDateDisplays[fieldName] = 'N/A';
            }
          } catch (e) {
            (dataToSet as any)[fieldName] = '';
            newBsDateDisplays[fieldName] = 'Error';
          }
        } else if ((dataToSet as any).hasOwnProperty(fieldName)) {
          (dataToSet as any)[fieldName] = '';
          newBsDateDisplays[fieldName] = 'N/A';
        }
      });

      if (['expenseRecord', 'collectionRecord', 'donation'].includes(contentType)) {
        if ((dataToSet as any).amount) {
          (dataToSet as any).amount = String((dataToSet as any).amount);
        }
      }

      if (
        contentType === 'monthlyThemeImage' &&
        initialData &&
        (initialData as MonthlyThemeImage).imageUrls
      ) {
        (dataToSet as MonthlyThemeImageFormData).imageUrlsString = Array.isArray(
          (initialData as MonthlyThemeImage).imageUrls
        )
          ? (initialData as MonthlyThemeImage).imageUrls.join(', ')
          : '';
      }

      if (
        contentType === 'fellowshipRoster' &&
        !(dataToSet as FellowshipRosterFormData).responsibilities
      ) {
        (dataToSet as FellowshipRosterFormData).responsibilities = [];
      }
      
      if (contentType === 'event') {
        const eventData = dataToSet as EventFormData;
        eventData.eventType = eventData.eventType || 'REGULAR';
        eventData.scheduleType = eventData.scheduleType || 'ONE_TIME';
        eventData.scheduleNotes = eventData.scheduleNotes || '';
        eventData.locations = Array.isArray(eventData.locations)
          ? eventData.locations
          : eventData.location
          ? [eventData.location]
          : [];
        eventData.conductedBy = Array.isArray(eventData.conductedBy)
          ? eventData.conductedBy
          : [];
        eventData.speakers = Array.isArray(eventData.speakers) ? eventData.speakers : [];
      }

      setFormData(dataToSet);
      setBsDateDisplays(newBsDateDisplays);
      setIsFieldUploading({});
      setUploadingStatus({});
    }
  }, [isOpen, initialData, contentType, createDefaults]);

  useEffect(() => {
    if (contentType === 'collectionRecord') {
      const total = (formData as CollectionRecordFormData).donors.reduce(
        (sum, donor) => sum + (Number(donor.amount) || 0),
        0
      );
      if (String(total) !== (formData as CollectionRecordFormData).amount) {
        setFormData((prev) => ({
          ...prev,
          amount: String(total),
        }));
      }
    }
  }, [formData, contentType]);

  const handleCloudinaryUpload = async (file: File, fieldName: string) => {
    if (!(file instanceof File)) {
      setUploadingStatus((prev) => ({
        ...prev,
        [fieldName]: 'Upload error: Invalid file data.',
      }));
      return;
    }

    setIsFieldUploading((prev) => ({ ...prev, [fieldName]: true }));
    setUploadingStatus((prev) => ({
      ...prev,
      [fieldName]: `Uploading ${file.name}...`,
    }));

    const sizeError = getCloudinaryFileSizeError(file);
    if (sizeError) {
      setUploadingStatus((prev) => ({
        ...prev,
        [fieldName]: sizeError,
      }));
      setIsFieldUploading((prev) => ({ ...prev, [fieldName]: false }));
      return;
    }

    const resourceType = getCloudinaryResourceType(file);
    const uploadDetails = getCloudinaryUploadDetails(resourceType);
    if ('error' in uploadDetails) {
      setUploadingStatus((prev) => ({
        ...prev,
        [fieldName]: uploadDetails.error,
      }));
      setIsFieldUploading((prev) => ({ ...prev, [fieldName]: false }));
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
        setFormData((prev) => ({
          ...prev,
          [fieldName]: data.secure_url,
        }));
        setUploadingStatus((prev) => ({
          ...prev,
          [fieldName]: 'Upload successful!',
        }));
        setTimeout(
          () =>
            setUploadingStatus((prev) => ({
              ...prev,
              [fieldName]: null,
            })),
          5000
        );
      } else {
        const errorMsg = data.error?.message || `Upload failed (HTTP ${response.status}).`;
        setUploadingStatus((prev) => ({
          ...prev,
          [fieldName]: `Error: ${errorMsg}`,
        }));
      }
    } catch (error: any) {
      setUploadingStatus((prev) => ({
        ...prev,
        [fieldName]: `Network error: ${error.message || 'Unknown issue.'}`,
      }));
    } finally {
      setIsFieldUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;

      if (name === 'placements' && 'placements' in formData) {
        const placementValue = value as (typeof adPlacementList)[number];
        const currentPlacements = (formData as AdvertisementFormData).placements || [];
        const newPlacements = checked
          ? [...currentPlacements, placementValue]
          : currentPlacements.filter((p) => p !== placementValue);

        setFormData((prev) => ({
          ...prev,
          placements: newPlacements,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
        }));
      }
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value),
      }));
    } else if (type === 'date') {
      setFormData((prev) => {
        const next: any = {
          ...prev,
          [name]: value,
        };
        if (name === 'incidentAt') {
          next.date = value;
        }
        if (name === 'date') {
          next.incidentAt = value;
        }
        return next;
      });

      if (value) {
        const bs = adToBs(new Date(value));
        setBsDateDisplays((prev) => ({
          ...prev,
          [name]: formatBSDate(bs),
        }));
      } else {
        setBsDateDisplays((prev) => ({
          ...prev,
          [name]: 'N/A',
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleBsDateSelect = (
    fieldName: string,
    payload: { bs: { year: number; month: number; day: number }; ad: { iso: string } }
  ) => {

    setFormData((prev) => {
      const next: any = {
        ...prev,
        [fieldName]: payload.ad.iso,
      };
      if (fieldName === 'incidentAt') {
        next.date = payload.ad.iso;
      }
      if (fieldName === 'date') {
        next.incidentAt = payload.ad.iso;
      }
      return next;
    });

    setBsDateDisplays((prev) => ({
      ...prev,
      [fieldName]: formatBSDate({
        year: payload.bs.year,
        month: payload.bs.month,
        day: payload.bs.day,
        monthName: '',
      }),
    }));

    setPickerVisibleFor(null);
  };

  const handleImageFieldSelect = (fieldName: string) => {
    setTargetImageField(fieldName);
    setIsMediaModalOpen(true);
  };

  const handleMediaConfirm = (selectedUrls: string[]) => {
    if (targetImageField && selectedUrls.length > 0) {
      if (contentType === 'monthlyThemeImage' && targetImageField === 'imageUrlsString') {
        setFormData((prev) => ({
          ...prev,
          [targetImageField]: selectedUrls.join(', '),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [targetImageField]: selectedUrls[0],
        }));
      }
    }

    setIsMediaModalOpen(false);
    setTargetImageField(null);
  };

  const handleDonorChange = (
    index: number,
    field: keyof DonorDetail,
    value: string | number
  ) => {
    const updatedDonors = [...((formData as CollectionRecordFormData).donors || [])];

    if (!updatedDonors[index]) {
      updatedDonors[index] = {
        id: `new-${Date.now()}`,
        donorName: '',
        amount: 0,
      };
    }

    (updatedDonors[index] as any)[field] =
      field === 'amount' ? Number(value) || 0 : value;

    setFormData((prev) => ({
      ...(prev as CollectionRecordFormData),
      donors: updatedDonors,
    }));
  };

  const addDonorField = () => {
    const newDonor: DonorDetail = {
      id: `new-${Date.now()}-${Math.random()}`,
      donorName: '',
      amount: 0,
    };

    setFormData((prev) => ({
      ...(prev as CollectionRecordFormData),
      donors: [...((prev as CollectionRecordFormData).donors || []), newDonor],
    }));
  };

  const removeDonorField = (index: number) => {
    const updatedDonors = ((formData as CollectionRecordFormData).donors || []).filter(
      (_, i) => i !== index
    );

    setFormData((prev) => ({
      ...(prev as CollectionRecordFormData),
      donors: updatedDonors,
    }));
  };

  // Fellowship responsibilities
  const handleResponsibilityChange = (
    index: number,
    field: 'role' | 'assignedTo',
    value: string
  ) => {
    const updatedResponsibilities = [
      ...(formData as FellowshipRosterFormData).responsibilities,
    ];
    updatedResponsibilities[index][field] = value;

    setFormData((prev) => ({
      ...(prev as FellowshipRosterFormData),
      responsibilities: updatedResponsibilities,
    }));
  };

  const addResponsibilityRow = () => {
    const newResponsibility: Responsibility = {
      id: `new-${Date.now()}`,
      role: '',
      assignedTo: '',
    };

    const currentResponsibilities =
      (formData as FellowshipRosterFormData).responsibilities || [];

    setFormData((prev) => ({
      ...(prev as FellowshipRosterFormData),
      responsibilities: [...currentResponsibilities, newResponsibility],
    }));
  };

  const removeResponsibilityRow = (id: string) => {
    const updatedResponsibilities = (
      formData as FellowshipRosterFormData
    ).responsibilities.filter((r) => r.id !== id);

    setFormData((prev) => ({
      ...(prev as FellowshipRosterFormData),
      responsibilities: updatedResponsibilities,
    }));
  };

  // Meeting decision points
  const handleDecisionPointChange = (
    index: number,
    field: keyof MeetingDecisionPoint,
    value: string
  ) => {
    const updatedPoints = [...((formData as MeetingLogFormData).decisionPoints || [])];
    (updatedPoints[index] as any)[field] = value;

    setFormData((prev) => ({
      ...(prev as MeetingLogFormData),
      decisionPoints: updatedPoints,
    }));
  };

  const addDecisionPoint = () => {
    const newPoint: MeetingDecisionPoint = {
      id: `new-dp-${Date.now()}`,
      description: '',
      status: 'Proposed',
    };

    const currentPoints = (formData as MeetingLogFormData).decisionPoints || [];

    setFormData((prev) => ({
      ...(prev as MeetingLogFormData),
      decisionPoints: [...currentPoints, newPoint],
    }));
  };

  const removeDecisionPoint = (id: string) => {
    const updatedPoints = (
      formData as MeetingLogFormData
    ).decisionPoints?.filter((dp) => dp.id !== id);

    setFormData((prev) => ({
      ...(prev as MeetingLogFormData),
      decisionPoints: updatedPoints || [],
    }));
  };
 
 const updateEventStringArrayField = (
    field: 'locations' | 'conductedBy' | 'speakers',
    index: number,
    value: string
  ) => {
    const current = Array.isArray((formData as EventFormData)[field])
      ? ([...(formData as EventFormData)[field]!] as string[])
      : [];
    current[index] = value;
    setFormData((prev) => ({
      ...(prev as EventFormData),
      [field]: current,
    }));
  };

  const addEventStringArrayField = (field: 'locations' | 'conductedBy' | 'speakers') => {
    const current = Array.isArray((formData as EventFormData)[field])
      ? ([...(formData as EventFormData)[field]!] as string[])
      : [];
    setFormData((prev) => ({
      ...(prev as EventFormData),
      [field]: [...current, ''],
    }));
  };

  const removeEventStringArrayField = (
    field: 'locations' | 'conductedBy' | 'speakers',
    index: number
  ) => {
    const current = Array.isArray((formData as EventFormData)[field])
      ? ([...(formData as EventFormData)[field]!] as string[])
      : [];
    const updated = current.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...(prev as EventFormData),
      [field]: updated,
    }));
  };

  // Simplified local "AI" helper that just suggests a name + alt text from URL (no network, no env)
  const handleGenerateAdCopy = () => {
    const adData = formData as AdvertisementFormData;

    if (!adData.linkUrl) {
      alert('Please provide a Link URL for suggestion.');
      return;
    }

    setIsGeneratingAiContent(true);

    try {
      const cleanUrl = adData.linkUrl
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');
      const domainPart = cleanUrl.split('/')[0] || 'our-ministry';
      const baseName = domainPart.split('.')[0] || 'Ministry';

      const suggestedName =
        adData.name && adData.name.trim().length > 0
          ? adData.name
          : `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} Highlight`;

      const suggestedAlt =
        adData.altText && adData.altText.trim().length > 0
          ? adData.altText
          : `Promotional banner linking to ${domainPart}`;

      setFormData((prev) => ({
        ...(prev as AdvertisementFormData),
        name: suggestedName,
        altText: suggestedAlt,
      }));
    } finally {
      setIsGeneratingAiContent(false);
    }
  };

  const speakText = useCallback((text?: string) => {
    if (!text) return;
    const trimmed = text.replace(/<[^>]+>/g, '').trim();
    if (!trimmed) return;
    const utterance = new SpeechSynthesisUtterance(trimmed);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const finalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let dataToSubmit: any = { ...formData };

    if (['expenseRecord', 'collectionRecord', 'donation'].includes(contentType)) {
      dataToSubmit.amount = parseFloat(dataToSubmit.amount) || 0;
    }

    if (contentType === 'collectionRecord') {
      dataToSubmit.donors = (dataToSubmit.donors || []).map((d: DonorDetail) => ({
        ...d,
        amount: Number(d.amount) || 0,
      }));
    }

    if (dataToSubmit.incidentAt && !dataToSubmit.date) {
      dataToSubmit.date = dataToSubmit.incidentAt;
    }
    if (dataToSubmit.date && !dataToSubmit.incidentAt) {
      dataToSubmit.incidentAt = dataToSubmit.date;
    }

  if (contentType === 'event') {
      const eventData = dataToSubmit as EventFormData;
      eventData.eventType = eventData.eventType || 'REGULAR';
      eventData.locations = (eventData.locations || []).map((entry) => entry.trim()).filter(Boolean);
      eventData.conductedBy = (eventData.conductedBy || []).map((entry) => entry.trim()).filter(Boolean);
      eventData.speakers = (eventData.speakers || []).map((entry) => entry.trim()).filter(Boolean);
      if (!eventData.location && eventData.locations.length > 0) {
        eventData.location = eventData.locations[0];
      }
    }

    onSubmit(dataToSubmit);
  };

  const anyFieldUploading = Object.values(isFieldUploading).some((status) => status === true);

  const renderDateFieldWithBSPicker = (fieldName: string, label: string) => (
    <div className="relative">
      <label htmlFor={fieldName} className={resolvedLabelClasses}>
        {label}{' '}
        <span className="font-normal text-purple-600 dark:text-purple-400 text-xs ml-2">
          {bsDateDisplays[fieldName] || 'Select a date'}
        </span>
      </label>
      <div className="flex items-center">
        <input
          type="date"
          id={fieldName}
          name={fieldName}
          value={(formData as any)[fieldName] || ''}
          onChange={handleChange}
          className={resolvedInputClasses}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setPickerVisibleFor(pickerVisibleFor === fieldName ? null : fieldName)
          }
          className={`!p-1.5 ml-1 ${isSermonForm ? 'text-black hover:bg-slate-100' : 'dark:text-slate-300 dark:hover:bg-slate-600'}`}
        >
          <CalendarOutlineIcon className="w-5 h-5" />
        </Button>
      </div>
      {pickerVisibleFor === fieldName && (
        <div className="absolute z-10 mt-1 bg-white dark:bg-slate-800 shadow-lg rounded-lg border dark:border-slate-600">
          <DualNepaliCalendar
            initialAdDate={(formData as any)[fieldName]}
            onDateSelect={(payload) => handleBsDateSelect(fieldName, payload)}
          />
        </div>
      )}
    </div>
  );

  const renderEmbeddedVideoField = (idSuffix: string) => (
    <FullWidthField>
      <label htmlFor={`videoUrl-${idSuffix}`} className={resolvedLabelClasses}>
        Social Media Embed URL (Optional)
      </label>
      <input
        type="url"
        id={`videoUrl-${idSuffix}`}
        name="videoUrl"
        value={(formData as any).videoUrl || ''}
        onChange={handleChange}
        placeholder="Paste a YouTube, Facebook, X, Instagram, Threads, or other embed/share URL"
        className={resolvedInputClasses}
      />
      <p className={isSermonForm ? 'mt-1 text-xs text-black/70' : 'mt-1 text-xs text-slate-500 dark:text-slate-400'}>
        Use this for embedded videos from YouTube, Facebook, X, Instagram, Threads, or similar sources. Leave it
        blank if you upload media above.
      </p>
    </FullWidthField>
  );

  const renderSpecificFields = () => {
    switch (contentType) {
      case 'sermon': {
        const data = formData as SermonFormData;

        return (
          <>
            <FormSection title="Core Information" titleClassName={resolvedSectionTitleClasses}>
              <FullWidthField>
                <label htmlFor="title" className={resolvedLabelClasses}>
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={data.title}
                  onChange={handleChange}
                  required
                  className={resolvedInputClasses}
                  placeholder="Enter the sermon title"
                />
              </FullWidthField>

              <div>
                <label htmlFor="speaker" className={resolvedLabelClasses}>
                  Speaker
                </label>
                <input
                  id="speaker"
                  type="text"
                  name="speaker"
                  value={data.speaker || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                  placeholder="Enter the speaker name"
                />
              </div>
        
              <div>
                <label htmlFor="category" className={resolvedLabelClasses}>
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={data.category}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                >
                  {sermonCategoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {renderDateFieldWithBSPicker('incidentAt', 'Sermon Date')}

              <div>
                <label htmlFor="scripture" className={resolvedLabelClasses}>
                  Scripture
                </label>
                <input
                  id="scripture"
                  type="text"
                  name="scripture"
                  value={data.scripture || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                  placeholder="Add key scripture reference"
                />
              </div>
            </FormSection>

            <FormSection title="Content & Media" titleClassName={resolvedSectionTitleClasses}>
              <FullWidthField>
                <label htmlFor="description" className={resolvedLabelClasses}>
                  Description / Overview
                </label>
                <RichTextEditor
                    value={data.description}
                    onChange={(html) =>
                      setFormData((p) => ({
                        ...p,
                        description: html,
                      }))
                    }
                    placeholder="Share the sermon overview."
                    toolbarOptions={{ bold: false, italic: false, unorderedList: false, orderedList: false }}
                    containerClassName="bg-white"
                    toolbarClassName="bg-white text-slate-700"
                    editorClassName="bg-white text-slate-800"
                  />
              </FullWidthField>

              <FullWidthField>
                <label htmlFor="fullContent" className={resolvedLabelClasses}>
                  Full Content/Transcript (Optional)
                </label>
                <RichTextEditor
                    value={data.fullContent || ''}
                    onChange={(html) =>
                      setFormData((p) => ({
                        ...p,
                        fullContent: html,
                      }))
                    }
                    placeholder="Add the full sermon transcript (plain text formatting only)."
                    toolbarOptions={{ bold: false, italic: false, unorderedList: false, orderedList: false }}
                    containerClassName="bg-white"
                    toolbarClassName="bg-white text-slate-700"
                    editorClassName="bg-white text-slate-800"
                  />
              </FullWidthField>

              <UnifiedMediaInputs
                formData={data}
                setFormData={setFormData}
                handleCloudinaryUpload={handleCloudinaryUpload}
                handleImageFieldSelect={handleImageFieldSelect}
                isFieldUploading={isFieldUploading}
                uploadingStatus={uploadingStatus}
                variant="compact"
                containerClassName={isSermonForm ? 'bg-white text-black border border-slate-200' : undefined}
                titleClassName={isSermonForm ? 'text-black' : undefined}
                forceLightText={isSermonForm}
              />
              {renderEmbeddedVideoField('sermon')}
            </FormSection>
          </>
        );
      }

      case 'event': {
        const data = formData as EventFormData;
        const resolvedEventType = data.eventType || 'REGULAR';
        const isRegularEvent = resolvedEventType === 'REGULAR';

        const scheduleTypeLabels: Record<string, string> = {
          ONE_TIME: 'One-time (single date)',
          SATURDAY_SERVICE: 'Saturday Service',
          WEDNESDAY_SERVICE: 'Wednesday Service',
          MONTHLY_15TH: '15th Day of Each Month',
          FIRST_WEEKEND_LORDS_SUPPER: "First Weekend: Lord's Supper",
          SECOND_WEEKEND_BIBLE_STUDY: 'Second Weekend: Bible Study',
          FOURTH_WEEKEND_LEADERS_MEETING: 'Fourth Weekend: Leaders Meeting',
          LAST_SUNDAY_PRAYER_TEAM_VISIT: 'Last Sunday: Prayer Team Visit',
          OTHER: 'Other / Custom',
        };

        const renderStringListField = (
          label: string,
          field: 'locations' | 'conductedBy' | 'speakers',
          placeholder: string
        ) => {
          const values = Array.isArray(data[field]) && data[field]!.length > 0 ? data[field]! : [''];
          return (
            <FullWidthField>
              <label className={resolvedLabelClasses}>{label}</label>
              <div className="space-y-2">
                {values.map((value, index) => (
                  <div key={`${field}-${index}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(event) => updateEventStringArrayField(field, index, event.target.value)}
                      placeholder={placeholder}
                      className={resolvedInputClasses}
                    />
                    {values.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEventStringArrayField(field, index)}
                        className="text-red-500 hover:text-red-600"
                        aria-label={`Remove ${label}`}
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addEventStringArrayField(field)}
                  className="text-xs"
                >
                  Add another
                </Button>
              </div>
            </FullWidthField>
          );
        };

        return (
          <>
          <FormSection title="Event Information">
              <FullWidthField>
                <label htmlFor="title" className={resolvedLabelClasses}>
                  Event Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={data.title}
                  onChange={handleChange}
                  required
                  className={resolvedInputClasses}
                />
              </FullWidthField>

              <FullWidthField>
                <label htmlFor="description" className={resolvedLabelClasses}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={data.description || ''}
                  onChange={handleChange}
                  rows={4}
                  className={resolvedInputClasses}
                  placeholder="Share the event overview in plain text."
                />
              </FullWidthField>

              <div>
                <label htmlFor="eventType" className={resolvedLabelClasses}>
                  Event Type
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={resolvedEventType}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                >
                  {eventTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type === 'REGULAR' ? 'Regular' : 'Special'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className={resolvedLabelClasses}>
                  Category
                </label>
                <select
                  name="category"
                  value={data.category}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                >
                  {eventCategoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </FormSection>
             
            {isRegularEvent && (
              <FormSection title="Schedule Pattern">
                <FullWidthField>
                  <label htmlFor="scheduleType" className={resolvedLabelClasses}>
                    Schedule Type
                  </label>
                  <select
                    name="scheduleType"
                    value={data.scheduleType || 'ONE_TIME'}
                    onChange={handleChange}
                    className={resolvedInputClasses}
                  >
                    {eventScheduleTypeList.map((type) => (
                      <option key={type} value={type}>
                        {scheduleTypeLabels[type]}
                      </option>
                    ))}
                  </select>
                </FullWidthField>

                <FullWidthField>
                  <label htmlFor="scheduleNotes" className={resolvedLabelClasses}>
                    Recurrence Notes (optional)
                  </label>
                  <textarea
                    name="scheduleNotes"
                    value={data.scheduleNotes || ''}
                    onChange={handleChange}
                    rows={2}
                    className={resolvedInputClasses}
                    placeholder="Add any additional recurrence details or notes."
                  />
                </FullWidthField>
              </FormSection>
            )}

            <FormSection title="Date, Time & Location">
              {renderDateFieldWithBSPicker('incidentAt', 'Event Date')}

              <div>
                <label htmlFor="time" className={resolvedLabelClasses}>
                  Time
                </label>
                <input
                  type="text"
                  name="time"
                  value={data.time || ''}
                  onChange={handleChange}
                  placeholder="e.g., 10:00 AM"
                  className={resolvedInputClasses}
                />
              </div>
                
              {isRegularEvent ? (
                <>
                  {renderStringListField('Locations', 'locations', 'Add a location')}
                  <FullWidthField>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseCurrentLocation('event-list')}
                        className="text-xs"
                      >
                        Use Current Location
                      </Button>
                      {locationLookupStatus && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {locationLookupStatus}
                        </span>
                      )}
                    </div>
                  </FullWidthField>
                </>
              ) : (
                <FullWidthField>
                  <label htmlFor="location" className={resolvedLabelClasses}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={data.location || ''}
                    onChange={handleChange}
                    className={resolvedInputClasses}
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseCurrentLocation('single')}
                      className="text-xs"
                    >
                      Use Current Location
                    </Button>
                    {locationLookupStatus && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {locationLookupStatus}
                      </span>
                    )}
                  </div>
                </FullWidthField>
              )}
              <FullWidthField>
                <label htmlFor="mapEmbedUrl" className={resolvedLabelClasses}>
                  Map Embed / Share Link (optional)
                </label>
                <input
                  type="url"
                  name="mapEmbedUrl"
                  value={(data as any).mapEmbedUrl || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                  placeholder="Google Maps share or embed link"
                />
              </FullWidthField>
            </FormSection>

            {isRegularEvent && (
              <FormSection title="Event Details">
                {renderStringListField('Conducted By', 'conductedBy', 'Add a host/team')}
                {renderStringListField('Speakers', 'speakers', 'Add a speaker')}
             
            <FullWidthField>
                  <label htmlFor="expectations" className={resolvedLabelClasses}>
                    What to Expect
                  </label>
                  <textarea
                    name="expectations"
                    value={data.expectations || ''}
                    onChange={handleChange}
                    rows={2}
                    className={resolvedInputClasses}
                  />
                </FullWidthField>

               <FullWidthField>
                  <label htmlFor="guests" className={resolvedLabelClasses}>
                    Special Guests (optional)
                  </label>
                  <input
                    type="text"
                  name="guests"
                    value={data.guests || ''}
                    onChange={handleChange}
                    className={resolvedInputClasses}
                  />
                </FullWidthField>

                <div>
                  <label htmlFor="capacity" className={resolvedLabelClasses}>
                    Capacity (0 for unlimited)
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={data.capacity || 0}
                    onChange={handleChange}
                    className={resolvedInputClasses}
                  />
                </div>

                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="isFeeRequired"
                    name="isFeeRequired"
                    checked={data.isFeeRequired || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <label
                    htmlFor="isFeeRequired"
                    className="ml-2 text-sm font-medium dark:text-slate-300"
                  >
                    Fee Required?
                  </label>
                </div>

                {data.isFeeRequired && (
                  <FullWidthField>
                    <label htmlFor="feeAmount" className={resolvedLabelClasses}>
                      Fee Amount/Details
                    </label>
                    <input
                      type="text"
                      name="feeAmount"
                      value={data.feeAmount || ''}
                      onChange={handleChange}
                      className={resolvedInputClasses}
                    />
                  </FullWidthField>
                )}
              </FormSection>
            )}

            <FormSection title="Contact & Registration">
              <div>
                <label htmlFor="contactPerson" className={resolvedLabelClasses}>
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={data.contactPerson || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className={resolvedLabelClasses}>
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={data.contactEmail || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className={resolvedLabelClasses}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={data.contactPhone || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                />
              </div>

              <div>
                <label htmlFor="registrationLink" className={resolvedLabelClasses}>
                  Registration Link
                </label>
                <input
                  type="url"
                  name="registrationLink"
                  value={data.registrationLink || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                  required={!!data.isFeeRequired}
                  placeholder={data.isFeeRequired ? 'Required when fee is enabled' : 'Optional unless fee required'}
                />
              </div>
            </FormSection>

            <FormSection title="Media">
              <UnifiedMediaInputs
                formData={data}
                setFormData={setFormData}
                handleCloudinaryUpload={handleCloudinaryUpload}
                handleImageFieldSelect={handleImageFieldSelect}
                isFieldUploading={isFieldUploading}
                uploadingStatus={uploadingStatus}
                variant="compact"
              />
            </FormSection>
          </>
        );
      }

      case 'ministry': {
        const data = formData as MinistryFormData;

        return (
          <>
            <FormSection title="Ministry Details">
              <div>
                <label htmlFor="title" className={resolvedLabelClasses}>
                  Ministry Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={data.title}
                  onChange={handleChange}
                  required
                  className={resolvedInputClasses}
                />
              </div>

              <div>
                <label htmlFor="category" className={resolvedLabelClasses}>
                  Category
                </label>
                <select
                  name="category"
                  value={data.category}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                >
                  {ministryCategoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="leader" className={resolvedLabelClasses}>
                  Leader
                </label>
                <input
                  type="text"
                  name="leader"
                  value={data.leader || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                />
              </div>

              <div>
                <label htmlFor="meetingTime" className={resolvedLabelClasses}>
                  Meeting Time
                </label>
                <input
                  type="text"
                  name="meetingTime"
                  value={data.meetingTime || ''}
                  onChange={handleChange}
                  placeholder="e.g., Every Saturday after service"
                  className={resolvedInputClasses}
                />
              </div>

              <FullWidthField>
                <label htmlFor="description" className={resolvedLabelClasses}>
                  Description / Guidelines
                </label>
                <RichTextEditor
                  value={data.description}
                  onChange={(html) =>
                    setFormData((p) => ({
                      ...p,
                      description: html,
                    }))
                  }
                />
              </FullWidthField>

              <FullWidthField>
                <AdvancedMediaUploader
                  label="Featured Image"
                  mediaType="image"
                  currentUrl={data.imageUrl}
                  onUrlChange={(url) =>
                    setFormData((prev) => ({
                      ...(prev as MinistryFormData),
                      imageUrl: url,
                    }))
                  }
                  onFileUpload={(file) => handleCloudinaryUpload(file, 'imageUrl')}
                  isUploading={isFieldUploading['imageUrl']}
                  uploadStatus={uploadingStatus['imageUrl']}
                  onSelectFromLibrary={() => handleImageFieldSelect('imageUrl')}
                />
              </FullWidthField>
            </FormSection>
          </>
        );
      }

      case 'blogPost': {
        const data = formData as BlogPostFormData;

        return (
          <>
            <FormSection title="Core Information">
              <FullWidthField>
                <label htmlFor="title" className={resolvedLabelClasses}>
                  Blog Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={data.title}
                  onChange={handleChange}
                  required
                  className={resolvedInputClasses}
                />
              </FullWidthField>

              <div>
                <label htmlFor="category" className={resolvedLabelClasses}>
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={data.category || blogPostCategoriesList[0]}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                >
                  {blogPostCategoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {renderDateFieldWithBSPicker('incidentAt', 'Publish / Post Date')}

              <FullWidthField>
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                  <input
                    type="checkbox"
                    id="enableAutoNarration"
                    name="enableAutoNarration"
                    checked={Boolean(data.enableAutoNarration)}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded text-purple-600"
                  />
                  <div>
                    <label htmlFor="enableAutoNarration" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Narration
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enable auto narration for this blog post (if supported). You can also upload an audio file below.
                    </p>
                  </div>
                </div>
              </FullWidthField>
            </FormSection>

            <FormSection title="Content & Media">
              <FullWidthField>
                <label htmlFor="description" className={resolvedLabelClasses}>
                  Blog Content
                </label>
                <RichTextEditor
                  value={data.description}
                  onChange={(html) =>
                    setFormData((p) => ({
                      ...p,
                      description: html,
                    }))
                  }
                />
              </FullWidthField>

              <UnifiedMediaInputs
                formData={data}
                setFormData={setFormData}
                handleCloudinaryUpload={handleCloudinaryUpload}
                handleImageFieldSelect={handleImageFieldSelect}
                isFieldUploading={isFieldUploading}
                uploadingStatus={uploadingStatus}
              />
            </FormSection>
          </>
        );
      }

      case 'news': {
        const data = formData as NewsItemFormData;

        return (
          <>
            <FormSection title="Core Information">
              <FullWidthField>
                <label htmlFor="title" className={resolvedLabelClasses}>
                  News Headline
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={data.title}
                  onChange={handleChange}
                  required
                  className={resolvedInputClasses}
                />
              </FullWidthField>

              <div>
                <label htmlFor="category" className={resolvedLabelClasses}>
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={data.category || newsCategoriesList[0]}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                >
                  {newsCategoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {renderDateFieldWithBSPicker('incidentAt', 'Publish / Post Date')}

              <FullWidthField>
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                  <input
                    type="checkbox"
                    id="enableAutoNarration"
                    name="enableAutoNarration"
                    checked={Boolean(data.enableAutoNarration)}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded text-purple-600"
                  />
                  <div>
                    <label htmlFor="enableAutoNarration" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Narration
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enable auto narration for this news item (if supported). You can also upload an audio file below.
                    </p>
                  </div>
                </div>
              </FullWidthField>
            </FormSection>

            <FormSection title="Content & Media">
              <FullWidthField>
                <label htmlFor="description" className={resolvedLabelClasses}>
                  News Content
                </label>
                <RichTextEditor
                  value={data.description}
                  onChange={(html) =>
                    setFormData((p) => ({
                      ...p,
                      description: html,
                    }))
                  }
                />
              </FullWidthField>

              <UnifiedMediaInputs
                formData={data}
                setFormData={setFormData}
                handleCloudinaryUpload={handleCloudinaryUpload}
                handleImageFieldSelect={handleImageFieldSelect}
                isFieldUploading={isFieldUploading}
                uploadingStatus={uploadingStatus}
              />
            </FormSection>
          </>
        );
      }

      case 'branchChurch': {
        const data = formData as BranchChurchFormData;

        return (
          <>
            <FormSection title="Branch Information">
              <FullWidthField>
                <label htmlFor="name" className={resolvedLabelClasses}>
                  Branch Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={data.name}
                  onChange={handleChange}
                  required
                  className={resolvedInputClasses}
                />
              </FullWidthField>

              <FullWidthField>
                <label htmlFor="address" className={resolvedLabelClasses}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={data.address}
                  onChange={handleChange}
                  required
                  className={resolvedInputClasses}
                />
              </FullWidthField>

              <FullWidthField>
                <label htmlFor="description" className={resolvedLabelClasses}>
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={data.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className={resolvedInputClasses}
                />
              </FullWidthField>

              <div>
                <label htmlFor="pastorName" className={resolvedLabelClasses}>
                  Pastor Name
                </label>
                <input
                  type="text"
                  name="pastorName"
                  value={data.pastorName || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                />
              </div>

              {renderDateFieldWithBSPicker('establishedDate', 'Established Date')}
            </FormSection>

            <FormSection title="Contact & Schedule">
              <div>
                <label htmlFor="phone" className={resolvedLabelClasses}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={data.phone || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                />
              </div>

              <div>
                <label htmlFor="email" className={resolvedLabelClasses}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={data.email || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                />
              </div>

              <FullWidthField>
                <label htmlFor="serviceTimes" className={resolvedLabelClasses}>
                  Service Times
                </label>
                <input
                  type="text"
                  name="serviceTimes"
                  value={data.serviceTimes}
                  onChange={handleChange}
                  required
                  className={resolvedInputClasses}
                />
              </FullWidthField>
            </FormSection>

            <FormSection title="Media">
              <FullWidthField>
                <label htmlFor="mapEmbedUrl" className={resolvedLabelClasses}>
                  Map Embed URL (Optional)
                </label>
                <input
                  type="url"
                  name="mapEmbedUrl"
                  value={data.mapEmbedUrl || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                  placeholder="e.g., https://www.google.com/maps/embed?..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Go to Google Maps, find the location, click Share, then &quot;Embed a map&quot;,
                  and copy the SRC value from the HTML.
                </p>
              </FullWidthField>

              <FullWidthField>
                <AdvancedMediaUploader
                  label="Branch Image"
                  mediaType="image"
                  currentUrl={data.imageUrl}
                  onUrlChange={(url) =>
                    setFormData((prev) => ({
                      ...(prev as BranchChurchFormData),
                      imageUrl: url,
                    }))
                  }
                  onFileUpload={(file) => handleCloudinaryUpload(file, 'imageUrl')}
                  isUploading={isFieldUploading['imageUrl']}
                  uploadStatus={uploadingStatus['imageUrl']}
                  onSelectFromLibrary={() => handleImageFieldSelect('imageUrl')}
                />
              </FullWidthField>
            </FormSection>
          </>
        );
      }

      case 'advertisement': {
        const data = formData as AdvertisementFormData;

        return (
          <>
            <FormSection title="Ad Details">
              <FullWidthField>
                <label htmlFor="name" className={resolvedLabelClasses}>
                  Ad Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={data.name}
                  onChange={handleChange}
                  required
                  className={resolvedInputClasses}
                />
              </FullWidthField>

              <div>
                <label htmlFor="adType" className={resolvedLabelClasses}>
                  Ad Type
                </label>
                <select
                  name="adType"
                  value={data.adType}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                >
                  <option value="image_banner">Image Banner</option>
                  <option value="video_banner">Video Banner</option>
                </select>
              </div>

              <div>
                <label htmlFor="linkUrl" className={resolvedLabelClasses}>
                  Link URL*
                </label>
                <input
                  type="url"
                  name="linkUrl"
                  value={data.linkUrl || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/page"
                  required
                  className={resolvedInputClasses}
                />
              </div>

              <FullWidthField>
                <label htmlFor="altText" className={resolvedLabelClasses}>
                  Alt Text (for accessibility)
                </label>
                <input
                  type="text"
                  name="altText"
                  value={data.altText || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                />
              </FullWidthField>
            </FormSection>

            <FormSection title="AI Content Generation">
              <FullWidthField>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Use a local helper to quickly suggest an ad name and alt text based on the Link
                  URL.
                </p>
                <Button
                  type="button"
                  onClick={handleGenerateAdCopy}
                  disabled={isGeneratingAiContent || !data.linkUrl}
                  size="sm"
                  variant="secondary"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  {isGeneratingAiContent ? 'Generating...' : 'Generate Name & Alt Text'}
                </Button>
                {!data.linkUrl && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Please enter a Link URL first to enable generation.
                  </p>
                )}
              </FullWidthField>
            </FormSection>

            <FormSection title="Media">
              {data.adType === 'image_banner' && (
                <FullWidthField>
                  <AdvancedMediaUploader
                    label="Image"
                    mediaType="image"
                    currentUrl={data.imageUrl}
                    onUrlChange={(url) =>
                      setFormData((prev) => ({
                        ...(prev as AdvertisementFormData),
                        imageUrl: url,
                      }))
                    }
                    onFileUpload={(file) => handleCloudinaryUpload(file, 'imageUrl')}
                    isUploading={isFieldUploading['imageUrl']}
                    uploadStatus={uploadingStatus['imageUrl']}
                    onSelectFromLibrary={() => handleImageFieldSelect('imageUrl')}
                  />
                </FullWidthField>
              )}

              {data.adType === 'video_banner' && (
                <FullWidthField>
                  <AdvancedMediaUploader
                    label="Video"
                    mediaType="video"
                    currentUrl={data.videoUrl}
                    onUrlChange={(url) =>
                      setFormData((prev) => ({
                        ...(prev as AdvertisementFormData),
                        videoUrl: url,
                      }))
                    }
                    onFileUpload={(file) => handleCloudinaryUpload(file, 'videoUrl')}
                    isUploading={isFieldUploading['videoUrl']}
                    uploadStatus={uploadingStatus['videoUrl']}
                  />
                </FullWidthField>
              )}
            </FormSection>

            <FormSection title="Scheduling & Placement">
              {renderDateFieldWithBSPicker('startDate', 'Start Date (Optional)')}
              {renderDateFieldWithBSPicker('endDate', 'End Date (Optional)')}

              <div>
                <label htmlFor="displayOrder" className={resolvedLabelClasses}>
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={data.displayOrder || 0}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                />
              </div>

              <div>
                <label htmlFor="adSizeKey" className={resolvedLabelClasses}>
                  Ad Size
                </label>
                <select
                  name="adSizeKey"
                  value={data.adSizeKey || ''}
                  onChange={handleChange}
                  className={resolvedInputClasses}
                >
                  {Object.entries(AD_SIZES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {key.replace(/_/g, ' ')} ({value})
                    </option>
                  ))}
                </select>
              </div>

              <FullWidthField>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={data.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm font-medium dark:text-slate-300"
                  >
                    Active
                  </label>
                </div>
              </FullWidthField>

              <FullWidthField>
                <label className={resolvedLabelClasses}>Placements</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1 border p-3 rounded-lg dark:border-slate-600">
                  {adPlacementList.map((p) => (
                    <div key={p} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`placement-${p}`}
                        name="placements"
                        value={p}
                        checked={data.placements.includes(p)}
                        onChange={handleChange}
                        className="h-4 w-4 text-purple-600 rounded"
                      />
                      <label
                        htmlFor={`placement-${p}`}
                        className="ml-2 text-xs dark:text-slate-300"
                      >
                        {p.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </FullWidthField>
            </FormSection>
          </>
        );
      }

      default:
        const dateFields = new Set(dateFieldsConfig[contentType] || []);
        return (
          <>
            {Object.keys(formData).map((key) => {
              const label = key === 'incidentAt' ? 'Incident Date' : key.replace(/([A-Z])/g, ' $1');
              if (key === 'publishedAt') {
                return null;
              }
              if (key === 'date' && dateFields.has('incidentAt')) {
                return null;
              }
              if (dateFields.has(key)) {
                return (
                  <React.Fragment key={key}>
                    {renderDateFieldWithBSPicker(key, label)}
                  </React.Fragment>
                );
              }
              return (
                <div key={key}>
                  <label htmlFor={key} className={resolvedLabelClasses}>
                    {label}
                  </label>
                  <input
                    type="text"
                    name={key}
                    value={(formData as any)[key] ?? ''}
                    onChange={handleChange}
                    className={resolvedInputClasses}
                  />
                </div>
              );
            })}
          </>
        );
    }
  };

  const getModalTitle = () => {
    const action = initialData ? 'Edit' : 'Add New';
    const formattedContentType = contentType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());

    if (formattedContentType === 'Donate Page Content') {
      return 'Edit Donate Page Content';
    }

    return `${action} ${formattedContentType}`;
  };

 const useFullscreen = ['sermon', 'blogPost', 'news'].includes(contentType);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size={useFullscreen ? 'full' : 'lg'}
      overlayClassName={isSermonForm ? 'items-start pt-20 sm:pt-10 pb-6' : undefined}
      panelClassName={isSermonForm ? 'text-black' : undefined}
    >
      <form onSubmit={finalSubmit} className={`flex flex-col min-h-full ${isSermonForm ? 'text-black' : ''}`}>
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span className="font-medium">Admin:</span>{' '}
            <span>{currentUser?.fullName || 'Admin'}</span>
          </div>
          {renderSpecificFields()}
        </div>

        <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading || anyFieldUploading}
            className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading || anyFieldUploading}>
            {isLoading ? 'Saving...' : initialData ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </form>

      {isMediaModalOpen && (
        <SelectMediaModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onConfirmSelection={handleMediaConfirm}
          initialSelectedUrls={
            targetImageField && (formData as any)[targetImageField]
              ? typeof (formData as any)[targetImageField] === 'string'
                ? (formData as any)[targetImageField]
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : []
              : []
          }
        />
      )}
    </Modal>
  );
};

export default ContentFormModal;  
