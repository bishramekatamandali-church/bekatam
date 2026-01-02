import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  GroupFormData,
  sermonCategoriesList,
  eventCategoriesList,
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
  MonthlyThemeImage,
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

import {
  adToBsSimulated,
  BS_MONTH_NAMES_EN,
  bsToAdSimulated,
} from '../../dateConverter';

import SelectMediaModal from './SelectMediaModal';
import AdvancedMediaUploader from './AdvancedMediaUploader';
import {
  XCircleIcon,
  PhotoIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  ArrowUpOnSquareIcon,
  CalendarIcon as CalendarOutlineIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import RichTextEditor from '../ui/RichTextEditor';
import BSCalendarPicker from './BSCalendarPicker';

const DEFAULT_BS_YEAR = adToBsSimulated(new Date()).year;

const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({
  title,
  children,
  className,
}) => (
  <div
    className={`pt-5 mt-5 border-t border-slate-200 dark:border-slate-700 first:mt-0 first:pt-0 first:border-t-0 ${className}`}
  >
    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
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
}> = ({
  formData,
  setFormData,
  handleCloudinaryUpload,
  handleImageFieldSelect,
  isFieldUploading,
  uploadingStatus,
}) => {
  const anyMediaFieldUploading =
    isFieldUploading['imageUrl'] ||
    isFieldUploading['videoUrl'] ||
    isFieldUploading['audioUrl'];

  const unifiedMediaInputRef = useRef<HTMLInputElement>(null);

  const handleUnifiedMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      handleCloudinaryUpload(file, 'imageUrl');
    } else if (file.type.startsWith('video/')) {
      handleCloudinaryUpload(file, 'videoUrl');
    } else if (file.type.startsWith('audio/')) {
      handleCloudinaryUpload(file, 'audioUrl');
    } else {
      alert('Unsupported file type. Please upload an image, video, or audio file.');
    }

    if (event.target) event.target.value = '';
  };

  const MediaSlot = ({ type, url }: { type: 'image' | 'video' | 'audio'; url?: string }) => {
    const fieldName = type === 'image' ? 'imageUrl' : `${type}Url`;
    const Icon = type === 'image' ? PhotoIcon : type === 'video' ? VideoCameraIcon : MicrophoneIcon;

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
          <div className="text-slate-400 dark:text-slate-500">
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

  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg space-y-4 sm:col-span-2">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200">Media Attachments</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MediaSlot type="image" url={(formData as any).imageUrl} />
        <MediaSlot type="video" url={(formData as any).videoUrl} />
        <MediaSlot type="audio" url={(formData as any).audioUrl} />
      </div>
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-200 dark:border-slate-700">
        <input
          type="file"
          ref={unifiedMediaInputRef}
          onChange={handleUnifiedMediaUpload}
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => unifiedMediaInputRef.current?.click()}
          disabled={anyMediaFieldUploading}
          size="sm"
          variant="outline"
          className="text-xs dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600"
        >
          <ArrowUpOnSquareIcon className="w-4 h-4 mr-1.5" /> Upload File (Auto-detects type)
        </Button>
        <Button
          type="button"
          onClick={() => handleImageFieldSelect('imageUrl')}
          disabled={anyMediaFieldUploading}
          size="sm"
          variant="outline"
          className="text-xs dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600"
        >
          <PhotoIcon className="w-4 h-4 mr-1.5" /> Select Image from Library
        </Button>
      </div>
    </div>
  );
};

const defaultFormValues: Record<ContentType, GenericContentFormData> = {
  sermon: {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
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
    category: eventCategoriesList[0],
    location: '',
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
    date: new Date().toISOString().split('T')[0],
    category: blogPostCategoriesList[0],
    videoUrl: '',
    audioUrl: '',
  } as BlogPostFormData,

  news: {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: newsCategoriesList[0],
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
    month: adToBsSimulated(new Date()).month,
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

  group: {
    name: '',
    groupImageUrl: '',
    memberIds: [],
    permissions: {
      editSettings: 'admins_only',
      sendMessage: 'all_members',
      addMembers: 'admins_only',
      approveMembers: 'admins_only',
    },
  } as GroupFormData,

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
}

const ContentFormModal: React.FC<ContentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  contentType,
  initialData,
  isLoading = false,
  isCoreSectionEditing = false,
}) => {
  const [formData, setFormData] = useState<GenericContentFormData>(
    defaultFormValues[contentType]
  );
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [targetImageField, setTargetImageField] = useState<string | null>(null);
  const [bsDateDisplays, setBsDateDisplays] = useState<Record<string, string>>({});
  const [pickerVisibleFor, setPickerVisibleFor] = useState<string | null>(null);

  const CLOUDINARY_CLOUD_NAME = 'dl94nfxom';
  const CLOUDINARY_UPLOAD_PRESET = 'bishram_ekata_mandali';
  const [uploadingStatus, setUploadingStatus] = useState<Record<string, string | null>>({});
  const [isFieldUploading, setIsFieldUploading] = useState<Record<string, boolean>>({});
  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);

  const dateFieldsConfig: Record<string, string[]> = {
    sermon: ['date'],
    event: ['date'],
    blogPost: ['date'],
    news: ['date'],
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
    const currentBsYear = adToBsSimulated(new Date()).year;
    return Array.from({ length: 25 }, (_, i) => currentBsYear - 15 + i).sort(
      (a, b) => b - a
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      let dataToSet: GenericContentFormData = initialData
        ? ({ ...defaultFormValues[contentType], ...initialData } as GenericContentFormData)
        : ({ ...defaultFormValues[contentType] } as GenericContentFormData);

      const newBsDateDisplays: Record<string, string> = {};
      const fieldsForType = dateFieldsConfig[contentType] || [];

      fieldsForType.forEach((fieldName) => {
        let adDateString = (dataToSet as any)[fieldName];

        if (adDateString && typeof adDateString === 'string') {
          try {
            const adDateObj = new Date(adDateString);
            if (!isNaN(adDateObj.getTime())) {
              (dataToSet as any)[fieldName] = adDateObj.toISOString().split('T')[0];
              const bs = adToBsSimulated(adDateObj);
              newBsDateDisplays[fieldName] = `${
                BS_MONTH_NAMES_EN[bs.month - 1]
              } ${bs.day}, ${bs.year} BS`;
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

      setFormData(dataToSet);
      setBsDateDisplays(newBsDateDisplays);
      setIsFieldUploading({});
      setUploadingStatus({});
    }
  }, [isOpen, initialData, contentType]);

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

    const uploadFormDataBody = new FormData();
    uploadFormDataBody.append('file', file);
    uploadFormDataBody.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    let resourceType: 'image' | 'video' | 'raw' = 'image';
    if (file.type.startsWith('video/')) resourceType = 'video';
    else if (file.type.startsWith('audio/')) resourceType = 'raw';

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    try {
      const response = await fetch(uploadUrl, {
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
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (value) {
        const bs = adToBsSimulated(new Date(value));
        setBsDateDisplays((prev) => ({
          ...prev,
          [name]: `${BS_MONTH_NAMES_EN[bs.month - 1]} ${bs.day}, ${bs.year} BS`,
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

  const handleBsDateSelect = (fieldName: string, bsDay: number, bsMonth: number, bsYear: number) => {
    const adDate = bsToAdSimulated(bsDay, bsMonth, bsYear);
    const adDateString = adDate.toISOString().split('T')[0];

    setFormData((prev) => ({
      ...prev,
      [fieldName]: adDateString,
    }));

    setBsDateDisplays((prev) => ({
      ...prev,
      [fieldName]: `${BS_MONTH_NAMES_EN[bsMonth - 1]} ${bsDay}, ${bsYear} BS`,
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

    onSubmit(dataToSubmit);
  };

  const anyFieldUploading = Object.values(isFieldUploading).some((status) => status === true);

  const renderDateFieldWithBSPicker = (fieldName: string, label: string) => (
    <div className="relative">
      <label htmlFor={fieldName} className={labelClasses}>
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
          className={inputClasses}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setPickerVisibleFor(pickerVisibleFor === fieldName ? null : fieldName)
          }
          className="!p-1.5 ml-1 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          <CalendarOutlineIcon className="w-5 h-5" />
        </Button>
      </div>
      {pickerVisibleFor === fieldName && (
        <div className="absolute z-10 mt-1 bg-white dark:bg-slate-800 shadow-lg rounded-lg border dark:border-slate-600">
          <BSCalendarPicker
            initialAdDate={(formData as any)[fieldName]}
            onDateSelect={(d, m, y) => handleBsDateSelect(fieldName, d, m, y)}
          />
        </div>
      )}
    </div>
  );

  const renderSpecificFields = () => {
    switch (contentType) {
      case 'sermon': {
        const data = formData as SermonFormData;

        return (
          <>
            <FormSection title="Core Information">
              <FullWidthField>
                <label htmlFor="title" className={labelClasses}>
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={data.title}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                />
              </FullWidthField>

              <div>
                <label htmlFor="speaker" className={labelClasses}>
                  Speaker
                </label>
                <input
                  id="speaker"
                  type="text"
                  name="speaker"
                  value={data.speaker || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="category" className={labelClasses}>
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={data.category}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  {sermonCategoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {renderDateFieldWithBSPicker('date', 'Sermon Date')}

              <div>
                <label htmlFor="scripture" className={labelClasses}>
                  Scripture
                </label>
                <input
                  id="scripture"
                  type="text"
                  name="scripture"
                  value={data.scripture || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
            </FormSection>

            <FormSection title="Content & Media">
              <FullWidthField>
                <label htmlFor="description" className={labelClasses}>
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
                />
              </FullWidthField>

              <FullWidthField>
                <label htmlFor="fullContent" className={labelClasses}>
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

      case 'event': {
        const data = formData as EventFormData;

        return (
          <>
            <FormSection title="Basic Info">
              <FullWidthField>
                <label htmlFor="title" className={labelClasses}>
                  Event Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={data.title}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                />
              </FullWidthField>

              <FullWidthField>
                <label htmlFor="description" className={labelClasses}>
                  Description
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

              <div>
                <label htmlFor="category" className={labelClasses}>
                  Category
                </label>
                <select
                  name="category"
                  value={data.category}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  {eventCategoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </FormSection>

            <FormSection title="Date, Time & Location">
              {renderDateFieldWithBSPicker('date', 'Event Date')}

              <div>
                <label htmlFor="time" className={labelClasses}>
                  Time
                </label>
                <input
                  type="text"
                  name="time"
                  value={data.time || ''}
                  onChange={handleChange}
                  placeholder="e.g., 10:00 AM"
                  className={inputClasses}
                />
              </div>

              <FullWidthField>
                <label htmlFor="location" className={labelClasses}>
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={data.location || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </FullWidthField>
            </FormSection>

            <FormSection title="Event Details">
              <FullWidthField>
                <label htmlFor="expectations" className={labelClasses}>
                  What to Expect
                </label>
                <textarea
                  name="expectations"
                  value={data.expectations || ''}
                  onChange={handleChange}
                  rows={2}
                  className={inputClasses}
                />
              </FullWidthField>

              <FullWidthField>
                <label htmlFor="guests" className={labelClasses}>
                  Special Guests
                </label>
                <input
                  type="text"
                  name="guests"
                  value={data.guests || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </FullWidthField>

              <div>
                <label htmlFor="capacity" className={labelClasses}>
                  Capacity (0 for unlimited)
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={data.capacity || 0}
                  onChange={handleChange}
                  className={inputClasses}
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
                  <label htmlFor="feeAmount" className={labelClasses}>
                    Fee Amount/Details
                  </label>
                  <input
                    type="text"
                    name="feeAmount"
                    value={data.feeAmount || ''}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </FullWidthField>
              )}
            </FormSection>

            <FormSection title="Contact & Registration">
              <div>
                <label htmlFor="contactPerson" className={labelClasses}>
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={data.contactPerson || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className={labelClasses}>
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={data.contactEmail || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className={labelClasses}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={data.contactPhone || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="registrationLink" className={labelClasses}>
                  Registration Link
                </label>
                <input
                  type="url"
                  name="registrationLink"
                  value={data.registrationLink || ''}
                  onChange={handleChange}
                  className={inputClasses}
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
                <label htmlFor="title" className={labelClasses}>
                  Ministry Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={data.title}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="category" className={labelClasses}>
                  Category
                </label>
                <select
                  name="category"
                  value={data.category}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  {ministryCategoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="leader" className={labelClasses}>
                  Leader
                </label>
                <input
                  type="text"
                  name="leader"
                  value={data.leader || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="meetingTime" className={labelClasses}>
                  Meeting Time
                </label>
                <input
                  type="text"
                  name="meetingTime"
                  value={data.meetingTime || ''}
                  onChange={handleChange}
                  placeholder="e.g., Every Saturday after service"
                  className={inputClasses}
                />
              </div>

              <FullWidthField>
                <label htmlFor="description" className={labelClasses}>
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

      case 'branchChurch': {
        const data = formData as BranchChurchFormData;

        return (
          <>
            <FormSection title="Branch Information">
              <FullWidthField>
                <label htmlFor="name" className={labelClasses}>
                  Branch Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={data.name}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                />
              </FullWidthField>

              <FullWidthField>
                <label htmlFor="address" className={labelClasses}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={data.address}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                />
              </FullWidthField>

              <FullWidthField>
                <label htmlFor="description" className={labelClasses}>
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={data.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className={inputClasses}
                />
              </FullWidthField>

              <div>
                <label htmlFor="pastorName" className={labelClasses}>
                  Pastor Name
                </label>
                <input
                  type="text"
                  name="pastorName"
                  value={data.pastorName || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              {renderDateFieldWithBSPicker('establishedDate', 'Established Date')}
            </FormSection>

            <FormSection title="Contact & Schedule">
              <div>
                <label htmlFor="phone" className={labelClasses}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={data.phone || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClasses}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={data.email || ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <FullWidthField>
                <label htmlFor="serviceTimes" className={labelClasses}>
                  Service Times
                </label>
                <input
                  type="text"
                  name="serviceTimes"
                  value={data.serviceTimes}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                />
              </FullWidthField>
            </FormSection>

            <FormSection title="Media">
              <FullWidthField>
                <label htmlFor="mapEmbedUrl" className={labelClasses}>
                  Map Embed URL (Optional)
                </label>
                <input
                  type="url"
                  name="mapEmbedUrl"
                  value={data.mapEmbedUrl || ''}
                  onChange={handleChange}
                  className={inputClasses}
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
                <label htmlFor="name" className={labelClasses}>
                  Ad Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={data.name}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                />
              </FullWidthField>

              <div>
                <label htmlFor="adType" className={labelClasses}>
                  Ad Type
                </label>
                <select
                  name="adType"
                  value={data.adType}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="image_banner">Image Banner</option>
                  <option value="video_banner">Video Banner</option>
                </select>
              </div>

              <div>
                <label htmlFor="linkUrl" className={labelClasses}>
                  Link URL*
                </label>
                <input
                  type="url"
                  name="linkUrl"
                  value={data.linkUrl || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/page"
                  required
                  className={inputClasses}
                />
              </div>

              <FullWidthField>
                <label htmlFor="altText" className={labelClasses}>
                  Alt Text (for accessibility)
                </label>
                <input
                  type="text"
                  name="altText"
                  value={data.altText || ''}
                  onChange={handleChange}
                  className={inputClasses}
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
                <label htmlFor="displayOrder" className={labelClasses}>
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={data.displayOrder || 0}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="adSizeKey" className={labelClasses}>
                  Ad Size
                </label>
                <select
                  name="adSizeKey"
                  value={data.adSizeKey || ''}
                  onChange={handleChange}
                  className={inputClasses}
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
                <label className={labelClasses}>Placements</label>
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
        return (
          <>
            {Object.keys(formData).map((key) => (
              <div key={key}>
                <label htmlFor={key} className={labelClasses}>
                  {key}
                </label>
                <input
                  type="text"
                  name={key}
                  value={(formData as any)[key] ?? ''}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
            ))}
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} size="lg">
      <form onSubmit={finalSubmit}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
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








/*
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

import {
  ContentType, GenericContentFormData, SermonFormData, EventFormData, MinistryFormData, BlogPostFormData, HomeSlideFormData, AboutSectionFormData, KeyPersonFormData, HistoryMilestoneFormData, BranchChurchFormData, DirectMediaFormData, ChurchMemberFormData, MeetingLogFormData, DecisionLogFormData, ExpenseRecordFormData, CollectionRecordFormData, collectionPurposeList, MonthlyThemeImageFormData, HistoryChapterFormData, NewsItemFormData, FellowshipRosterFormData, AdvertisementFormData, ContentItem, DirectMediaItem, GroupFormData,
  sermonCategoriesList, eventCategoriesList, ministryCategoriesList, blogPostCategoriesList, newsCategoriesList, MeetingDecisionPoint, expenseCategoriesList, paymentMethodOptions, rosterTypeList, adPlacementList, meetingTypeList, meetingLogStatusList, decisionLogStatusList, DonorDetail, MonthlyThemeImage,
  HistoryChapter, FellowshipRosterItem, Advertisement, AD_SIZES, AdSizeKey,
  PrayerRequestFormData, prayerRequestCategoriesList, prayerRequestVisibilityList,
  DonationRecordFormData, donationPurposeList, DonatePageContentFormData, TestimonialFormData, testimonialVisibilityList, Responsibility, decisionLogStatusList as decisionPointStatusList, expenseStatusList
} from '../../types';
import { formatDateADBS, adToBsSimulated, BS_MONTH_NAMES_EN, bsToAdSimulated, getDaysInBsMonthSimulated, AD_BS_YEAR_DIFF } from '../../dateConverter';
import SelectMediaModal from './SelectMediaModal';
import AdvancedMediaUploader from './AdvancedMediaUploader';
import { XCircleIcon, PhotoIcon, VideoCameraIcon, MicrophoneIcon, ArrowUpOnSquareIcon, CameraIcon, CalendarIcon as CalendarOutlineIcon, PlusCircleIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import RichTextEditor from '../ui/RichTextEditor';
import BSCalendarPicker from './BSCalendarPicker';

const DEFAULT_BS_YEAR = adToBsSimulated(new Date()).year;

const FormSection: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
  <div className={`pt-5 mt-5 border-t border-slate-200 dark:border-slate-700 first:mt-0 first:pt-0 first:border-t-0 ${className}`}>
    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
      {children}
    </div>
  </div>
);

const FullWidthField: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="sm:col-span-2">{children}</div>
);

const inputClasses = "w-full p-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-800";
const labelClasses = "block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1";


// This helper component consolidates the new media management UI
const UnifiedMediaInputs: React.FC<{
  formData: SermonFormData | EventFormData | BlogPostFormData | NewsItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleCloudinaryUpload: (file: File, fieldName: string) => void;
  handleImageFieldSelect: (fieldName: string) => void;
  isFieldUploading: Record<string, boolean>;
  uploadingStatus: Record<string, string | null>;
}> = ({ formData, setFormData, handleCloudinaryUpload, handleImageFieldSelect, isFieldUploading, uploadingStatus }) => {
    const anyMediaFieldUploading = isFieldUploading['imageUrl'] || isFieldUploading['videoUrl'] || isFieldUploading['audioUrl'];
    const unifiedMediaInputRef = useRef<HTMLInputElement>(null);

    const handleUnifiedMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            handleCloudinaryUpload(file, 'imageUrl');
        } else if (file.type.startsWith('video/')) {
            handleCloudinaryUpload(file, 'videoUrl');
        } else if (file.type.startsWith('audio/')) {
            handleCloudinaryUpload(file, 'audioUrl');
        } else {
            alert('Unsupported file type. Please upload an image, video, or audio file.');
        }
        if (event.target) event.target.value = '';
    };
    
    const MediaSlot = ({ type, url }: { type: 'image' | 'video' | 'audio', url?: string }) => {
        const fieldName = type === 'image' ? 'imageUrl' : `${type}Url`;
        const Icon = type === 'image' ? PhotoIcon : type === 'video' ? VideoCameraIcon : MicrophoneIcon;
        return (
          <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 min-h-[120px] flex flex-col justify-center items-center text-center">
              {url ? (
                  <>
                    {type === 'image' && <img src={url} alt="Preview" className="max-h-28 w-auto rounded"/>}
                    {type === 'video' && <video src={url} controls className="max-h-28 w-full rounded"/>}
                    {type === 'audio' && <audio src={url} controls className="w-full"/>}
                    <button type="button" onClick={() => setFormData((p: any) => ({...p, [fieldName]: ''}))} className="absolute -top-2 -right-2 bg-white dark:bg-slate-700 rounded-full p-0.5">
                        <XCircleIcon className="w-5 h-5 text-red-500"/>
                    </button>
                  </>
              ) : (
                 <div className="text-slate-400 dark:text-slate-500">
                     <Icon className="w-8 h-8 mx-auto"/>
                     <p className="text-xs mt-1">No {type} uploaded</p>
                 </div>
              )}
              {isFieldUploading[fieldName] && uploadingStatus[fieldName] && <p className="absolute bottom-1 text-xs text-purple-600 dark:text-purple-400 animate-pulse">{uploadingStatus[fieldName]}</p>}
          </div>
        );
    };

    return (
        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg space-y-4 sm:col-span-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Media Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MediaSlot type="image" url={(formData as any).imageUrl} />
                <MediaSlot type="video" url={(formData as any).videoUrl} />
                <MediaSlot type="audio" url={(formData as any).audioUrl} />
            </div>
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <input type="file" ref={unifiedMediaInputRef} onChange={handleUnifiedMediaUpload} className="hidden" />
                <Button type="button" onClick={() => unifiedMediaInputRef.current?.click()} disabled={anyMediaFieldUploading} size="sm" variant="outline" className="text-xs dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">
                    <ArrowUpOnSquareIcon className="w-4 h-4 mr-1.5" /> Upload File (Auto-detects type)
                </Button>
                 <Button type="button" onClick={() => handleImageFieldSelect('imageUrl')} disabled={anyMediaFieldUploading} size="sm" variant="outline" className="text-xs dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">
                    <PhotoIcon className="w-4 h-4 mr-1.5" /> Select Image from Library
                </Button>
             </div>
        </div>
    );
};


const defaultFormValues: Record<ContentType, GenericContentFormData> = {
    sermon: { title: '', description: '', date: new Date().toISOString().split('T')[0], category: sermonCategoriesList[0], speaker: '', scripture: '', videoUrl: '', audioUrl: '', fullContent: '' } as SermonFormData,
    event: { title: '', description: '', date: new Date().toISOString().split('T')[0], category: eventCategoriesList[0], location: '', time: '10:00', expectations: '', guests: '', contactPerson: '', contactEmail: '', contactPhone: '', registrationLink: '#', capacity: 0, isFeeRequired: false, feeAmount: '', videoUrl: '', audioUrl: '' } as EventFormData,
    ministry: { title: '', description: '', category: ministryCategoriesList[0], leader: '', meetingTime: '', imageUrl: '' } as MinistryFormData,
    blogPost: { title: '', description: '', date: new Date().toISOString().split('T')[0], category: blogPostCategoriesList[0], videoUrl: '', audioUrl: '' } as BlogPostFormData,
    news: { title: '', description: '', date: new Date().toISOString().split('T')[0], category: newsCategoriesList[0], videoUrl: '', audioUrl: '' } as NewsItemFormData,
    homeSlide: { title: '', description: '', imageUrl: '', ctaText: 'Learn More', linkPath: '/', order: 0, isActive: true } as HomeSlideFormData,
    aboutSection: { title: '', content: '', imageUrl: '', displayOrder: 0 } as AboutSectionFormData,
    keyPerson: { name: '', role: '', bio: '', imageUrl: '' } as KeyPersonFormData,
    historyMilestone: { year: new Date().getFullYear().toString(), title: '', description: '', imageUrl: '' } as HistoryMilestoneFormData,
    historyChapter: { chapterNumber: 1, title: '', content: '', status: 'draft', imageUrl: '', summary: '' } as HistoryChapterFormData,
    branchChurch: { name: '', address: '', serviceTimes: 'Saturdays at 11 AM' } as BranchChurchFormData,
    directMedia: { title: '', url: '', mediaType: 'image', uploadCategory: '', tagsString: '' } as DirectMediaFormData,
    churchMember: { fullName: '', memberSince: new Date().toISOString().split('T')[0], isActiveMember: true, dateOfBirth: '', baptismDate: '', contactEmail: '', contactPhone: '', address: '', familyMembers: '', notes: '', profileImageUrl: '' } as ChurchMemberFormData,
    meetingLog: { meetingDate: new Date().toISOString().split('T')[0], title: '', attendees: '', agenda: '', minutes: '', decisionPoints: [], meetingType: meetingTypeList[0], actionItems: '', status: meetingLogStatusList[0], imageUrl: '' } as MeetingLogFormData,
    decisionLog: { decisionDate: new Date().toISOString().split('T')[0], title: '', description: '', madeBy: '', status: decisionLogStatusList[0], followUpActions: '' } as DecisionLogFormData,
    expenseRecord: { expenseDate: new Date().toISOString().split('T')[0], category: expenseCategoriesList[0], description: '', amount: '', status: 'paid' } as ExpenseRecordFormData,
    collectionRecord: { collectorName: '', collectionDate: new Date().toISOString().split('T')[0], amount: '', purpose: collectionPurposeList[0], donors: [], isDeposited: false } as CollectionRecordFormData,
    monthlyThemeImage: { year: DEFAULT_BS_YEAR, month: adToBsSimulated(new Date()).month, imageUrlsString: '', quoteOrCaption: '' } as MonthlyThemeImageFormData,
    fellowshipRoster: { rosterType: rosterTypeList[0], groupNameOrEventTitle: '', assignedDate: new Date().toISOString().split('T')[0], timeSlot: '10:00 AM - 11:00 AM', responsibilities: [], isTemplate: false } as FellowshipRosterFormData,
    advertisement: { name: '', adType: 'image_banner', imageUrl: '', videoUrl: '', linkUrl: '', altText: '', placements: [], startDate: '', endDate: '', isActive: true, displayOrder: 0, adSizeKey: Object.keys(AD_SIZES)[0] as AdSizeKey } as AdvertisementFormData,
    prayerRequest: { title: '', requestText: '', visibility: 'public', category: prayerRequestCategoriesList[0], imageUrl: '', videoUrl: '', audioUrl: '' } as PrayerRequestFormData,
    testimonial: { title: '', contentText: '', visibility: 'public' } as TestimonialFormData,
    group: { name: '', groupImageUrl: '', memberIds: [], permissions: { editSettings: 'admins_only', sendMessage: 'all_members', addMembers: 'admins_only', approveMembers: 'admins_only'} } as GroupFormData,
    donation: { donorName: '', donorEmail: '', amount: '', purpose: donationPurposeList[0], donationDate: new Date().toISOString().split('T')[0], isReceiptSent: false } as DonationRecordFormData,
    donatePageContent: { headerTitle: '', headerSubtitle: '', headerImageUrl: '', localDonationsTitle: '', bankName: '', accountName: '', accountNumber: '', branch: '', eSewaId: '', localDonationsNote: '', internationalDonationsTitle: '', internationalDonationsContent: '', internationalDonationsContactEmail: '' } as DonatePageContentFormData,
    contactMessage: {} as any, ministryJoinRequest: {} as any, mediaItem: {} as any, generatedSchedule: {} as any, 
  };
  
interface ContentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GenericContentFormData) => Promise<void>;
  contentType: ContentType;
  initialData?: ContentItem | null;
  isLoading?: boolean;
  isCoreSectionEditing?: boolean;
}

const ContentFormModal: React.FC<ContentFormModalProps> = ({ isOpen, onClose, onSubmit, contentType, initialData, isLoading = false, isCoreSectionEditing = false }) => {
  const [formData, setFormData] = useState<GenericContentFormData>(defaultFormValues[contentType]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [targetImageField, setTargetImageField] = useState<string | null>(null);
  const [bsDateDisplays, setBsDateDisplays] = useState<Record<string, string>>({});
  const [pickerVisibleFor, setPickerVisibleFor] = useState<string | null>(null);

  const CLOUDINARY_CLOUD_NAME = 'dl94nfxom';
  const CLOUDINARY_UPLOAD_PRESET = 'bishram_ekata_mandali';
  const [uploadingStatus, setUploadingStatus] = useState<Record<string, string | null>>({});
  const [isFieldUploading, setIsFieldUploading] = useState<Record<string, boolean>>({});
  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);

  const dateFieldsConfig: Record<string, string[]> = {
    sermon: ['date'], event: ['date'], blogPost: ['date'], news: ['date'], branchChurch: ['establishedDate'],
    churchMember: ['memberSince', 'dateOfBirth', 'baptismDate'], meetingLog: ['meetingDate'], decisionLog: ['decisionDate'],
    expenseRecord: ['expenseDate'], collectionRecord: ['collectionDate', 'depositDate'], fellowshipRoster: ['assignedDate'],
    advertisement: ['startDate', 'endDate'], donation: ['donationDate'],
  };

  const bsYearOptions = useMemo(() => {
    const currentBsYear = adToBsSimulated(new Date()).year;
    return Array.from({ length: 25 }, (_, i) => currentBsYear - 15 + i).sort((a,b) => b-a);
  }, []);
  
    useEffect(() => {
        if (isOpen) {
          let dataToSet: GenericContentFormData = initialData ? { ...defaultFormValues[contentType], ...initialData } as GenericContentFormData : { ...defaultFormValues[contentType] };
          const newBsDateDisplays: Record<string, string> = {};
          const fieldsForType = dateFieldsConfig[contentType] || [];
          fieldsForType.forEach(fieldName => {
            let adDateString = (dataToSet as any)[fieldName];
            if (adDateString && typeof adDateString === 'string') {
              try {
                const adDateObj = new Date(adDateString);
                if (!isNaN(adDateObj.getTime())) {
                  (dataToSet as any)[fieldName] = adDateObj.toISOString().split('T')[0];
                  const bs = adToBsSimulated(adDateObj);
                  newBsDateDisplays[fieldName] = `${BS_MONTH_NAMES_EN[bs.month - 1]} ${bs.day}, ${bs.year} BS`;
                } else {
                  (dataToSet as any)[fieldName] = ''; newBsDateDisplays[fieldName] = 'N/A';
                }
              } catch (e) { (dataToSet as any)[fieldName] = ''; newBsDateDisplays[fieldName] = 'Error'; }
            } else if ((dataToSet as any).hasOwnProperty(fieldName)) {
                 (dataToSet as any)[fieldName] = ''; newBsDateDisplays[fieldName] = 'N/A';
            }
          });
          if (['expenseRecord', 'collectionRecord', 'donation'].includes(contentType) && (dataToSet as any).amount) {
            (dataToSet as any).amount = String((dataToSet as any).amount);
          }
          if (contentType === 'monthlyThemeImage' && initialData && (initialData as MonthlyThemeImage).imageUrls) {
            (dataToSet as MonthlyThemeImageFormData).imageUrlsString = Array.isArray((initialData as MonthlyThemeImage).imageUrls) ? (initialData as MonthlyThemeImage).imageUrls.join(', ') : '';
          }
          if(contentType === 'fellowshipRoster' && !dataToSet.hasOwnProperty('responsibilities')) {
            (dataToSet as FellowshipRosterFormData).responsibilities = [];
          }

          setFormData(dataToSet); setBsDateDisplays(newBsDateDisplays); setIsFieldUploading({}); setUploadingStatus({});
        }
      }, [isOpen, initialData, contentType]);

     useEffect(() => {
        if (contentType === 'collectionRecord') {
            const total = (formData as CollectionRecordFormData).donors.reduce((sum, donor) => sum + (Number(donor.amount) || 0), 0);
            if (String(total) !== (formData as CollectionRecordFormData).amount) {
                setFormData(prev => ({ ...prev, amount: String(total) }));
            }
        }
     }, [formData, contentType]);
    
    const handleCloudinaryUpload = async (file: File, fieldName: string) => {
        if (!(file instanceof File)) { setUploadingStatus(prev => ({ ...prev, [fieldName]: "Upload error: Invalid file data."})); return; }
        setIsFieldUploading(prev => ({ ...prev, [fieldName]: true }));
        setUploadingStatus(prev => ({ ...prev, [fieldName]: `Uploading ${file.name}...` }));
        const uploadFormDataBody = new FormData();
        uploadFormDataBody.append('file', file); uploadFormDataBody.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        let resourceType = 'image'; if (file.type.startsWith('video/')) resourceType = 'video'; else if (file.type.startsWith('audio/')) resourceType = 'raw'; 
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
        try {
          const response = await fetch(uploadUrl, { method: 'POST', body: uploadFormDataBody, mode: 'cors' });
          const data = await response.json();
          if (response.ok && data.secure_url) {
            setFormData(prev => ({ ...prev, [fieldName]: data.secure_url }));
            setUploadingStatus(prev => ({ ...prev, [fieldName]: "Upload successful!" })); setTimeout(() => setUploadingStatus(prev => ({ ...prev, [fieldName]: null })), 5000);
          } else {
            const errorMsg = data.error?.message || `Upload failed (HTTP ${response.status}).`;
            setUploadingStatus(prev => ({ ...prev, [fieldName]: `Error: ${errorMsg}` }));
          }
        } catch (error: any) { setUploadingStatus(prev => ({ ...prev, [fieldName]: `Network error: ${error.message || 'Unknown issue.'}` }));
        } finally { setIsFieldUploading(prev => ({ ...prev, [fieldName]: false })); }
      };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
          const checked = (e.target as HTMLInputElement).checked;
          if (name === 'placements' && 'placements' in formData) {
              const placementValue = value as typeof adPlacementList[number];
              const currentPlacements = (formData as AdvertisementFormData).placements || [];
              const newPlacements = checked ? [...currentPlacements, placementValue] : currentPlacements.filter(p => p !== placementValue);
              setFormData(prev => ({ ...prev, placements: newPlacements }));
          } else { setFormData(prev => ({ ...prev, [name]: checked })); }
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
        } else if (type === 'date') {
            setFormData(prev => ({ ...prev, [name]: value }));
            if(value) {
                const bs = adToBsSimulated(new Date(value));
                setBsDateDisplays(prev => ({ ...prev, [name]: `${BS_MONTH_NAMES_EN[bs.month - 1]} ${bs.day}, ${bs.year} BS` }));
            } else {
                setBsDateDisplays(prev => ({ ...prev, [name]: 'N/A' }));
            }
        } else { setFormData(prev => ({ ...prev, [name]: value })); }
      };

    const handleBsDateSelect = (fieldName: string, bsDay: number, bsMonth: number, bsYear: number) => {
        const adDate = bsToAdSimulated(bsDay, bsMonth, bsYear);
        const adDateString = adDate.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, [fieldName]: adDateString }));
        setBsDateDisplays(prev => ({ ...prev, [fieldName]: `${BS_MONTH_NAMES_EN[bsMonth - 1]} ${bsDay}, ${bsYear} BS` }));
        setPickerVisibleFor(null);
    };

    const handleImageFieldSelect = (fieldName: string) => { setTargetImageField(fieldName); setIsMediaModalOpen(true); };
    const handleMediaConfirm = (selectedUrls: string[]) => {
      if (targetImageField && selectedUrls.length > 0) {
        if (contentType === 'monthlyThemeImage' && targetImageField === 'imageUrlsString') {
            setFormData(prev => ({ ...prev, [targetImageField]: selectedUrls.join(', ') }));
        } else {
            setFormData(prev => ({ ...prev, [targetImageField]: selectedUrls[0] }));
        }
      }
      setIsMediaModalOpen(false); setTargetImageField(null);
    };
    const handleDonorChange = (index: number, field: keyof DonorDetail, value: string | number) => {
      const updatedDonors = [...((formData as CollectionRecordFormData).donors || [])];
      if (!updatedDonors[index]) updatedDonors[index] = { id: `new-${Date.now()}`, donorName: '', amount: 0 };
      (updatedDonors[index] as any)[field] = field === 'amount' ? Number(value) || 0 : value;
      // No need to calculate total here, useEffect handles it
      setFormData(prev => ({ ...prev, donors: updatedDonors }) as CollectionRecordFormData);
    };
    const addDonorField = () => {
      const newDonor: DonorDetail = { id: `new-${Date.now()}-${Math.random()}`, donorName: '', amount: 0 };
      setFormData(prev => ({ ...prev, donors: [...((prev as CollectionRecordFormData).donors || []), newDonor] }) as CollectionRecordFormData);
    };
    const removeDonorField = (index: number) => {
      const updatedDonors = ((formData as CollectionRecordFormData).donors || []).filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, donors: updatedDonors }) as CollectionRecordFormData);
    };
    
    // Handlers for dynamic responsibilities
    const handleResponsibilityChange = (index: number, field: 'role' | 'assignedTo', value: string) => {
        const updatedResponsibilities = [...(formData as FellowshipRosterFormData).responsibilities];
        updatedResponsibilities[index][field] = value;
        setFormData(prev => ({...prev, responsibilities: updatedResponsibilities}));
    };
    
    const addResponsibilityRow = () => {
        const newResponsibility: Responsibility = { id: `new-${Date.now()}`, role: '', assignedTo: '' };
        const currentResponsibilities = (formData as FellowshipRosterFormData).responsibilities || [];
        setFormData(prev => ({...prev, responsibilities: [...currentResponsibilities, newResponsibility]}));
    };
    
    const removeResponsibilityRow = (id: string) => {
        const updatedResponsibilities = (formData as FellowshipRosterFormData).responsibilities.filter(r => r.id !== id);
        setFormData(prev => ({...prev, responsibilities: updatedResponsibilities}));
    };
    
    const handleDecisionPointChange = (index: number, field: keyof MeetingDecisionPoint, value: string) => {
        const updatedPoints = [...((formData as MeetingLogFormData).decisionPoints || [])];
        (updatedPoints[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, decisionPoints: updatedPoints }));
    };

    const addDecisionPoint = () => {
        const newPoint: MeetingDecisionPoint = { id: `new-dp-${Date.now()}`, description: '', status: 'Proposed' };
        const currentPoints = (formData as MeetingLogFormData).decisionPoints || [];
        setFormData(prev => ({ ...prev, decisionPoints: [...currentPoints, newPoint] }));
    };

    const removeDecisionPoint = (id: string) => {
        const updatedPoints = ((formData as MeetingLogFormData).decisionPoints || []).filter(dp => dp.id !== id);
        setFormData(prev => ({ ...prev, decisionPoints: updatedPoints }));
    };
    
    const handleGenerateAdCopy = async () => {
        const adData = formData as AdvertisementFormData;
        if (!adData.linkUrl) {
          alert("Please provide a Link URL for the AI to analyze.");
          return;
        }

        setIsGeneratingAiContent(true);
        try {
          if (!process.env.API_KEY) throw new Error("API_KEY is not configured.");
          const ai = new GoogleGenerativeAI({ apiKey: process.env.API_KEY });
          const prompt = `Analyze the content of a webpage to generate advertising copy.
            Webpage URL: ${adData.linkUrl}
            Task: Generate a very concise ad name (under 5 words) and a descriptive alt text for an image (under 15 words) for an advertisement on a church website that links to this URL.
            Format: Return a single, minified JSON object with two keys: "name" and "altText". Example: {"name":"Youth Summer Camp","altText":"Joyful teenagers singing around a campfire at summer camp."}`;
          
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        altText: { type: Type.STRING }
                    }
                }
            }
          });
          
          const jsonString = response.text;
          const parsed = JSON.parse(jsonString);

          if (parsed.name && parsed.altText) {
            setFormData(prev => ({
              ...(prev as AdvertisementFormData),
              name: parsed.name,
              altText: parsed.altText,
            }));
          } else {
            throw new Error("AI did not return the expected JSON format.");
          }
        } catch (err) {
          console.error("Error generating ad copy:", err);
          alert(`Failed to generate ad copy with AI. Error: ${(err as Error).message}`);
        } finally {
          setIsGeneratingAiContent(false);
        }
    };


    const finalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let dataToSubmit = { ...formData };
        if (['expenseRecord', 'collectionRecord', 'donation'].includes(contentType)) {
          (dataToSubmit as any).amount = parseFloat((dataToSubmit as any).amount) || 0;
        }
        if (contentType === 'collectionRecord') {
           (dataToSubmit as CollectionRecordFormData).donors = ((dataToSubmit as CollectionRecordFormData).donors || []).map(d => ({...d, amount: Number(d.amount) || 0}));
        }
        onSubmit(dataToSubmit);
      };

  const anyFieldUploading = Object.values(isFieldUploading).some(status => status === true);

  const renderDateFieldWithBSPicker = (fieldName: string, label: string) => (
    <div className="relative">
        <label htmlFor={fieldName} className={labelClasses}>
            {label} <span className="font-normal text-purple-600 dark:text-purple-400 text-xs ml-2">({bsDateDisplays[fieldName] || 'Select a date'})</span>
        </label>
        <div className="flex items-center">
            <input
                type="date"
                id={fieldName}
                name={fieldName}
                value={(formData as any)[fieldName] || ''}
                onChange={handleChange}
                className={inputClasses}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => setPickerVisibleFor(pickerVisibleFor === fieldName ? null : fieldName)} className="!p-1.5 ml-1 dark:text-slate-300 dark:hover:bg-slate-600">
                <CalendarOutlineIcon className="w-5 h-5"/>
            </Button>
        </div>
        {pickerVisibleFor === fieldName && (
            <div className="absolute z-10 mt-1 bg-white dark:bg-slate-800 shadow-lg rounded-lg border dark:border-slate-600">
                <BSCalendarPicker
                    initialAdDate={(formData as any)[fieldName]}
                    onDateSelect={(d, m, y) => handleBsDateSelect(fieldName, d, m, y)}
                />
            </div>
        )}
    </div>
  );

  const renderSpecificFields = () => {
    switch (contentType) {
      case 'sermon': {
        const data = formData as SermonFormData;
        return <>
          <FormSection title="Core Information">
            <FullWidthField>
                <label htmlFor="title" className={labelClasses}>Title</label>
                <input type="text" id="title" name="title" value={data.title} onChange={handleChange} required className={inputClasses}/>
            </FullWidthField>
            <div>
                <label htmlFor="speaker" className={labelClasses}>Speaker</label>
                <input id="speaker" type="text" name="speaker" value={data.speaker || ''} onChange={handleChange} className={inputClasses}/>
            </div>
            <div>
                <label htmlFor="category" className={labelClasses}>Category</label>
                <select id="category" name="category" value={data.category} onChange={handleChange} className={inputClasses}>{sermonCategoriesList.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
             {renderDateFieldWithBSPicker('date', 'Sermon Date')}
             <div>
                <label htmlFor="scripture" className={labelClasses}>Scripture</label>
                <input id="scripture" type="text" name="scripture" value={data.scripture || ''} onChange={handleChange} className={inputClasses}/>
            </div>
          </FormSection>
          <FormSection title="Content & Media">
            <FullWidthField>
                <label htmlFor="description" className={labelClasses}>Description / Overview</label>
                <RichTextEditor value={data.description} onChange={(html) => setFormData(p => ({...p, description: html}))} />
            </FullWidthField>
            <FullWidthField>
                <label htmlFor="fullContent" className={labelClasses}>Full Content/Transcript (Optional)</label>
                <RichTextEditor value={data.fullContent || ''} onChange={(html) => setFormData(p => ({...p, fullContent: html}))} />
            </FullWidthField>
            <UnifiedMediaInputs formData={data} setFormData={setFormData} handleCloudinaryUpload={handleCloudinaryUpload} handleImageFieldSelect={handleImageFieldSelect} isFieldUploading={isFieldUploading} uploadingStatus={uploadingStatus} />
          </FormSection>
        </>;
      }
       case 'event': {
        const data = formData as EventFormData;
        return <>
           <FormSection title="Basic Info">
                <FullWidthField>
                    <label htmlFor="title" className={labelClasses}>Event Title</label>
                    <input type="text" name="title" value={data.title} onChange={handleChange} required className={inputClasses}/>
                </FullWidthField>
                 <FullWidthField>
                    <label htmlFor="description" className={labelClasses}>Description</label>
                    <RichTextEditor value={data.description} onChange={(html) => setFormData(p => ({...p, description: html}))} />
                </FullWidthField>
                <div>
                    <label htmlFor="category" className={labelClasses}>Category</label>
                    <select name="category" value={data.category} onChange={handleChange} className={inputClasses}>{eventCategoriesList.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
           </FormSection>
           <FormSection title="Date, Time & Location">
                {renderDateFieldWithBSPicker('date', 'Event Date')}
                <div>
                    <label htmlFor="time" className={labelClasses}>Time</label>
                    <input type="text" name="time" value={data.time || ''} onChange={handleChange} placeholder="e.g., 10:00 AM" className={inputClasses}/>
                </div>
                <FullWidthField>
                    <label htmlFor="location" className={labelClasses}>Location</label>
                    <input type="text" name="location" value={data.location || ''} onChange={handleChange} className={inputClasses}/>
                </FullWidthField>
           </FormSection>
            <FormSection title="Event Details">
                 <FullWidthField>
                    <label htmlFor="expectations" className={labelClasses}>What to Expect</label>
                    <textarea name="expectations" value={data.expectations || ''} onChange={handleChange} rows={2} className={inputClasses}/>
                </FullWidthField>
                <FullWidthField>
                    <label htmlFor="guests" className={labelClasses}>Special Guests</label>
                    <input type="text" name="guests" value={data.guests || ''} onChange={handleChange} className={inputClasses}/>
                </FullWidthField>
                <div>
                    <label htmlFor="capacity" className={labelClasses}>Capacity (0 for unlimited)</label>
                    <input type="number" name="capacity" value={data.capacity || 0} onChange={handleChange} className={inputClasses}/>
                </div>
                <div className="flex items-center mt-6">
                    <input type="checkbox" name="isFeeRequired" checked={data.isFeeRequired || false} onChange={handleChange} className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"/>
                    <label htmlFor="isFeeRequired" className="ml-2 text-sm font-medium dark:text-slate-300">Fee Required?</label>
                </div>
                {data.isFeeRequired && 
                    <FullWidthField>
                        <label htmlFor="feeAmount" className={labelClasses}>Fee Amount/Details</label>
                        <input type="text" name="feeAmount" value={data.feeAmount || ''} onChange={handleChange} className={inputClasses}/>
                    </FullWidthField>
                }
            </FormSection>
            <FormSection title="Contact & Registration">
                <div><label htmlFor="contactPerson" className={labelClasses}>Contact Person</label><input type="text" name="contactPerson" value={data.contactPerson || ''} onChange={handleChange} className={inputClasses}/></div>
                <div><label htmlFor="contactEmail" className={labelClasses}>Contact Email</label><input type="email" name="contactEmail" value={data.contactEmail || ''} onChange={handleChange} className={inputClasses}/></div>
                <div><label htmlFor="contactPhone" className={labelClasses}>Contact Phone</label><input type="tel" name="contactPhone" value={data.contactPhone || ''} onChange={handleChange} className={inputClasses}/></div>
                <div><label htmlFor="registrationLink" className={labelClasses}>Registration Link</label><input type="url" name="registrationLink" value={data.registrationLink || ''} onChange={handleChange} className={inputClasses}/></div>
           </FormSection>
           <FormSection title="Media">
                <UnifiedMediaInputs formData={data} setFormData={setFormData} handleCloudinaryUpload={handleCloudinaryUpload} handleImageFieldSelect={handleImageFieldSelect} isFieldUploading={isFieldUploading} uploadingStatus={uploadingStatus} />
           </FormSection>
        </>;
      }
      case 'ministry': {
        const data = formData as MinistryFormData;
        return <>
            <FormSection title="Ministry Details">
                <div><label htmlFor="title" className={labelClasses}>Ministry Title</label><input type="text" name="title" value={data.title} onChange={handleChange} required className={inputClasses}/></div>
                <div><label htmlFor="category" className={labelClasses}>Category</label><select name="category" value={data.category} onChange={handleChange} className={inputClasses}>{ministryCategoriesList.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label htmlFor="leader" className={labelClasses}>Leader</label><input type="text" name="leader" value={data.leader || ''} onChange={handleChange} className={inputClasses}/></div>
                <div><label htmlFor="meetingTime" className={labelClasses}>Meeting Time</label><input type="text" name="meetingTime" value={data.meetingTime || ''} onChange={handleChange} placeholder="e.g., Every Saturday after service" className={inputClasses}/></div>
                 <FullWidthField>
                    <label htmlFor="description" className={labelClasses}>Description / Guidelines</label>
                    <RichTextEditor value={data.description} onChange={(html) => setFormData(p => ({...p, description: html}))} />
                </FullWidthField>
                 <FullWidthField>
                    <AdvancedMediaUploader label="Featured Image" mediaType="image" currentUrl={data.imageUrl} onUrlChange={(url) => setFormData(prev => ({...prev, imageUrl: url}))} onFileUpload={(file) => handleCloudinaryUpload(file, 'imageUrl')} isUploading={isFieldUploading['imageUrl']} uploadStatus={uploadingStatus['imageUrl']} onSelectFromLibrary={() => handleImageFieldSelect('imageUrl')} />
                </FullWidthField>
            </FormSection>
        </>;
      }
       case 'branchChurch': {
        const data = formData as BranchChurchFormData;
        return <>
           <FormSection title="Branch Information">
                <FullWidthField>
                    <label htmlFor="name" className={labelClasses}>Branch Name</label>
                    <input type="text" name="name" value={data.name} onChange={handleChange} required className={inputClasses}/>
                </FullWidthField>
                <FullWidthField>
                    <label htmlFor="address" className={labelClasses}>Address</label>
                    <input type="text" name="address" value={data.address} onChange={handleChange} required className={inputClasses}/>
                </FullWidthField>
                <FullWidthField>
                    <label htmlFor="description" className={labelClasses}>Description (Optional)</label>
                    <textarea name="description" value={data.description || ''} onChange={handleChange} rows={3} className={inputClasses}/>
                </FullWidthField>
                <div>
                    <label htmlFor="pastorName" className={labelClasses}>Pastor Name</label>
                    <input type="text" name="pastorName" value={data.pastorName || ''} onChange={handleChange} className={inputClasses}/>
                </div>
                {renderDateFieldWithBSPicker('establishedDate', 'Established Date')}
           </FormSection>
            <FormSection title="Contact & Schedule">
                <div><label htmlFor="phone" className={labelClasses}>Phone</label><input type="tel" name="phone" value={data.phone || ''} onChange={handleChange} className={inputClasses}/></div>
                <div><label htmlFor="email" className={labelClasses}>Email</label><input type="email" name="email" value={data.email || ''} onChange={handleChange} className={inputClasses}/></div>
                <FullWidthField>
                    <label htmlFor="serviceTimes" className={labelClasses}>Service Times</label>
                    <input type="text" name="serviceTimes" value={data.serviceTimes} onChange={handleChange} required className={inputClasses}/>
                </FullWidthField>
           </FormSection>
           <FormSection title="Media">
                <FullWidthField>
                    <label htmlFor="mapEmbedUrl" className={labelClasses}>Map Embed URL (Optional)</label>
                    <input type="url" name="mapEmbedUrl" value={data.mapEmbedUrl || ''} onChange={handleChange} className={inputClasses} placeholder="e.g., https://www.google.com/maps/embed?..."/>
                    <p className="text-xs text-slate-500 mt-1">Go to Google Maps, find the location, click Share, then "Embed a map", and copy the SRC value from the HTML.</p>
                </FullWidthField>
                <FullWidthField>
                    <AdvancedMediaUploader label="Branch Image" mediaType="image" currentUrl={data.imageUrl} onUrlChange={(url) => setFormData(prev => ({...prev, imageUrl: url}))} onFileUpload={(file) => handleCloudinaryUpload(file, 'imageUrl')} isUploading={isFieldUploading['imageUrl']} uploadStatus={uploadingStatus['imageUrl']} onSelectFromLibrary={() => handleImageFieldSelect('imageUrl')} />
                </FullWidthField>
            </FormSection>
        </>;
      }
      case 'advertisement': {
        const data = formData as AdvertisementFormData;
        return <>
            <FormSection title="Ad Details">
                <FullWidthField>
                    <label htmlFor="name" className={labelClasses}>Ad Name*</label>
                    <input type="text" name="name" value={data.name} onChange={handleChange} required className={inputClasses}/>
                </FullWidthField>
                <div>
                    <label htmlFor="adType" className={labelClasses}>Ad Type</label>
                    <select name="adType" value={data.adType} onChange={handleChange} className={inputClasses}>
                        <option value="image_banner">Image Banner</option>
                        <option value="video_banner">Video Banner</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="linkUrl" className={labelClasses}>Link URL*</label>
                    <input type="url" name="linkUrl" value={data.linkUrl || ''} onChange={handleChange} placeholder="https://example.com/page" required className={inputClasses}/>
                </div>
                 <FullWidthField>
                    <label htmlFor="altText" className={labelClasses}>Alt Text (for accessibility)</label>
                    <input type="text" name="altText" value={data.altText || ''} onChange={handleChange} className={inputClasses}/>
                </FullWidthField>
            </FormSection>
            <FormSection title="AI Content Generation">
                <FullWidthField>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Use AI to automatically generate a name and alt text based on the ad's Link URL.</p>
                    <Button type="button" onClick={handleGenerateAdCopy} disabled={isGeneratingAiContent || !data.linkUrl} size="sm" variant="secondary">
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        {isGeneratingAiContent ? 'Generating...' : 'Generate Name & Alt Text'}
                    </Button>
                    {!data.linkUrl && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Please enter a Link URL first to enable AI generation.</p>}
                </FullWidthField>
            </FormSection>
            <FormSection title="Media">
                {data.adType === 'image_banner' && (
                    <FullWidthField><AdvancedMediaUploader label="Image" mediaType="image" currentUrl={data.imageUrl} onUrlChange={(url) => setFormData(prev => ({...prev, imageUrl: url}))} onFileUpload={(file) => handleCloudinaryUpload(file, 'imageUrl')} isUploading={isFieldUploading['imageUrl']} uploadStatus={uploadingStatus['imageUrl']} onSelectFromLibrary={() => handleImageFieldSelect('imageUrl')} /></FullWidthField>
                )}
                 {data.adType === 'video_banner' && (
                    <FullWidthField><AdvancedMediaUploader label="Video" mediaType="video" currentUrl={data.videoUrl} onUrlChange={(url) => setFormData(prev => ({...prev, videoUrl: url}))} onFileUpload={(file) => handleCloudinaryUpload(file, 'videoUrl')} isUploading={isFieldUploading['videoUrl']} /></FullWidthField>
                )}
            </FormSection>
            <FormSection title="Scheduling & Placement">
                 {renderDateFieldWithBSPicker('startDate', 'Start Date (Optional)')}
                 {renderDateFieldWithBSPicker('endDate', 'End Date (Optional)')}
                <div>
                    <label htmlFor="displayOrder" className={labelClasses}>Display Order</label>
                    <input type="number" name="displayOrder" value={data.displayOrder || 0} onChange={handleChange} className={inputClasses}/>
                </div>
                <div>
                    <label htmlFor="adSizeKey" className={labelClasses}>Ad Size</label>
                    <select name="adSizeKey" value={data.adSizeKey || ''} onChange={handleChange} className={inputClasses}>
                         {Object.entries(AD_SIZES).map(([key, value]) => <option key={key} value={key}>{key.replace(/_/g, ' ')} ({value})</option>)}
                    </select>
                </div>
                <FullWidthField>
                    <div className="flex items-center">
                        <input type="checkbox" id="isActive" name="isActive" checked={data.isActive} onChange={handleChange} className="h-4 w-4 text-purple-600 rounded"/>
                        <label htmlFor="isActive" className="ml-2 text-sm font-medium dark:text-slate-300">Active</label>
                    </div>
                </FullWidthField>
                <FullWidthField>
                    <label className={labelClasses}>Placements</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1 border p-3 rounded-lg dark:border-slate-600">
                        {adPlacementList.map(p => (
                            <div key={p} className="flex items-center">
                                <input type="checkbox" id={`placement-${p}`} name="placements" value={p} checked={data.placements.includes(p)} onChange={handleChange} className="h-4 w-4 text-purple-600 rounded"/>
                                <label htmlFor={`placement-${p}`} className="ml-2 text-xs dark:text-slate-300">{p.replace(/_/g, ' ')}</label>
                            </div>
                        ))}
                    </div>
                </FullWidthField>
            </FormSection>
        </>;
      }
      default:
        // A fallback for simpler forms that might not have been explicitly handled above
        return <>
            {Object.keys(formData).map(key => (
                <div key={key}>
                    <label htmlFor={key}>{key}</label>
                    <input type="text" name={key} value={(formData as any)[key]} onChange={handleChange} />
                </div>
            ))}
        </>;
    }
  };

  const getModalTitle = () => {
    const action = initialData ? 'Edit' : 'Add New';
    const formattedContentType = contentType.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    if (formattedContentType === 'Donate Page Content') return 'Edit Donate Page Content';
    return `${action} ${formattedContentType}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} size="lg">
      <form onSubmit={finalSubmit}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {renderSpecificFields()}
        </div>
        <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || anyFieldUploading} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading || anyFieldUploading}>
            {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : `Create`)}
          </Button>
        </div>
      </form>
      {isMediaModalOpen && (
        <SelectMediaModal isOpen={isMediaModalOpen} onClose={() => setIsMediaModalOpen(false)} onConfirmSelection={handleMediaConfirm} initialSelectedUrls={targetImageField && (formData as any)[targetImageField] ? (typeof (formData as any)[targetImageField] === 'string' ? (formData as any)[targetImageField].split(',').map((s: string) => s.trim()).filter(Boolean) : []) : []} />
      )}
    </Modal>
  );
};

export default ContentFormModal;      */