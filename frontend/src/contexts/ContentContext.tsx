import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react'; 
import {
  Sermon, EventItem, Ministry, BlogPost, AboutSection, KeyPerson, HistoryMilestone, CoreAboutSectionId, coreAboutSectionIds,
  Comment, NewsItem, DonatePageContent,
  ContentType, ContentItem,
  EventFormData, MinistryFormData, BlogPostFormData,
  NewsItemFormData, DonatePageContentFormData,
  AboutSectionFormData, KeyPersonFormData, HistoryMilestoneFormData, BranchChurchFormData,
  MinistryJoinRequestFormData, MinistryJoinRequest, MinistryJoinRequestStatus,
  DirectMediaItem, DirectMediaFormData, DonorDetail,
  GenericContentFormData,
  ContentContextType, FrontendActivityLog, DonationRecord, CollectionRecord, CollectionRecordFormData, collectionPurposeList,
  ContactMessage, BranchChurch, DisplayedMediaItem, MediaSourceContentType,
  ChurchMember, MeetingLog, DecisionLog, ExpenseRecord,
  ChurchMemberFormData, MeetingLogFormData, DecisionLogFormData, ExpenseRecordFormData,
  sermonCategoriesList, eventCategoriesList, ministryCategoriesList, blogPostCategoriesList, AllContentCategories, SermonCategory, EventCategory, MinistryCategory, BlogPostCategory, NewsCategory,
  meetingTypeList, meetingLogStatusList, MeetingType, MeetingLogStatus,
  decisionLogStatusList, DecisionLogStatus, MeetingDecisionPoint, FellowshipRosterItem,
  HistoryChapter, HistoryChapterFormData,
  FellowshipRosterFormData, RosterType, rosterTypeList, GeneratedScheduleItem, GeneratedScheduleFormData,
  Advertisement, AdvertisementFormData, AdPlacement, adPlacementList,
  PrayerRequest, PrayerRequestFormData, prayerRequestCategoriesList, prayerRequestVisibilityList, prayerRequestStatusList, PrayerRequestCategory, PrayerRequestVisibility, PrayerRequestStatus,
  Testimonial, TestimonialFormData,
  DonationRecordFormData, donationPurposeList
} from '../types';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { formatDateADBS } from '../dateConverter';

import { API_BASE_URL } from "../utils/apiConfig";

const parseJsonArrayField = <T,>(value: unknown, fallback: T[] = []): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.warn('Failed to parse JSON array field.', error);
    return fallback;
  }
};

const normalizeMeetingTypeLabel = (value?: string): MeetingType | undefined => {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim();
  const normalizedValue = normalized.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedNoApostrophe = normalizedValue
    .replace(/’|'/g, '')
    .replace(/\b(\w+)\s+s\b/gi, '$1s');
  const match = meetingTypeList.find((option) => {
    const optionNormalized = option.replace(/’|'/g, '');
    return optionNormalized.toLowerCase() === normalizedNoApostrophe.toLowerCase()
      || option.toLowerCase() === normalizedValue.toLowerCase();
  });
  return match;
};

const normalizeDecisionStatusLabel = (value?: string): DecisionLogStatus | undefined => {
  if (!value || typeof value !== 'string') return undefined;
  const normalizedValue = value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return decisionLogStatusList.find(
    (option) => option.toLowerCase() === normalizedValue.toLowerCase(),
  );
};

const normalizeMeetingStatusLabel = (value?: string): MeetingLogStatus | undefined => {
  if (!value || typeof value !== 'string') return undefined;
  const normalizedValue = value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return meetingLogStatusList.find(
    (option) => option.toLowerCase() === normalizedValue.toLowerCase(),
  );
};

const serializeActionItems = (items: unknown) => {
  if (Array.isArray(items)) {
    return JSON.stringify(items);
  }
  if (typeof items === 'string') {
    return items;
  }
  return undefined;
};

const normalizeMeetingLogItem = (item: any): MeetingLog => {
  const decisionPointsRaw = item?.meetingdecisionpoint || item?.decisionPoints;
  const decisionPoints = Array.isArray(decisionPointsRaw)
    ? decisionPointsRaw.map((point: any) => ({
      id: point.id,
      description: point.description,
      proposedBy: point.proposedBy,
      status: normalizeDecisionStatusLabel(point.status) || point.status,
      followUpNotes: point.followUpNotes,
      resolutionDate: point.resolutionDate
        ? new Date(point.resolutionDate).toISOString().split('T')[0]
        : undefined,
    }))
    : [];

  return {
    ...item,
    meetingDate: item?.meetingDate ? new Date(item.meetingDate).toISOString().split('T')[0] : item?.meetingDate,
    meetingType: normalizeMeetingTypeLabel(item?.meetingType) || item?.meetingType,
    status: normalizeMeetingStatusLabel(item?.status) || item?.status,
    actionItems: parseJsonArrayField(item?.actionItems, []),
    decisionPoints,
  } as MeetingLog;
};

const normalizeDecisionLogItem = (item: any): DecisionLog => ({
  ...item,
  decisionDate: item?.decisionDate ? new Date(item.decisionDate).toISOString().split('T')[0] : item?.decisionDate,
  status: normalizeDecisionStatusLabel(item?.status) || item?.status,
  followUpActions: parseJsonArrayField(item?.followUpActions, []),
});

const normalizeMeetingTypeForApi = (value?: string) => {
  if (!value) return undefined;
  if (value.includes("'s")) {
    return value.replace(/'s/g, '_s');
  }
  return value;
};

const normalizeSermonCategory = (category?: string): SermonCategory | undefined => {
  if (!category || typeof category !== 'string') return undefined;
  const cleaned = category.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return sermonCategoriesList.find((item) => item.toLowerCase() === cleaned.toLowerCase());
};

const normalizeSermonItem = (item: any): Sermon => {
  const normalizedCategory = normalizeSermonCategory(item?.category);
  const comments = Array.isArray(item?.comments)
    ? item.comments
    : Array.isArray(item?.comment)
      ? item.comment
      : [];

  return {
    ...item,
    category: normalizedCategory || item?.category,
    comments,
    linkPath: item?.linkPath || `/sermons/${item?.id}`,
    date: item?.date ? new Date(item.date).toISOString() : item?.date ?? null,
    createdAt: item?.createdAt ? new Date(item.createdAt).toISOString() : item?.createdAt ?? null,
    updatedAt: item?.updatedAt ? new Date(item.updatedAt).toISOString() : item?.updatedAt ?? null,
    likes: item?.likes ?? 0,
  } as Sermon;
};

const normalizeSermonCollection = (data: unknown): Sermon[] => {
  const payload = (data as { sermons?: unknown })?.sermons ?? data;
  return ensureArray<Sermon>(payload, []).map(normalizeSermonItem);
};

const normalizeFellowshipRosterItem = (item: any): FellowshipRosterItem => ({
  ...item,
  responsibilities: Array.isArray(item?.responsibilities)
    ? item.responsibilities
    : Array.isArray(item?.responsibility)
      ? item.responsibility
      : [],
  linkPath: item?.linkPath || `/fellowship-program/roster/${item?.id}`,
});

const normalizeGeneratedScheduleItem = (item: any): GeneratedScheduleItem => ({
  ...item,
  responsibilities: Array.isArray(item?.responsibilities)
    ? item.responsibilities
    : Array.isArray(item?.responsibility)
      ? item.responsibility
      : [],
  linkPath: item?.linkPath || `/fellowship-program/schedule/${item?.id}`,
});
	
const initialSampleDonatePageContent: DonatePageContent = {
  id: 'singleton',
  headerTitle: 'Support Our Mission',
  headerSubtitle: `"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Corinthians 9:7`,
  headerImageUrl: 'https://picsum.photos/seed/donateheader/1600/500',
  homepageCardTitle: 'Give Hope, Change Lives',
  homepageCardSubtitle: 'Every gift fuels meals, discipleship, and community care for families in need.',
  homepageCardHighlight: 'Join monthly partners to multiply impact all year.',
  homepageCardCtaText: 'Donate Now',
  homepageCardImageUrl: 'https://picsum.photos/seed/donatecard/1200/800',
  localDonationsTitle: 'Giving Locally (Within Nepal)',
  bankName: 'Nabil Bank Ltd.',
  accountName: 'Bishram Ekata Mandali',
  accountNumber: '12345678901234',
  branch: 'Sinamangal Branch',
  bankQrImageUrl: '',
  eSewaId: '9865272258 (Shahid Singh)',
  localDonationsNote: `Please use this form to log your donation for our records after you've made a transfer. This helps us acknowledge your gift properly.`,
  internationalDonationsTitle: 'Giving from Abroad',
  internationalDonationsContent: `For our international friends and partners who wish to support our ministry, we are working on setting up a secure online giving portal. In the meantime, please contact us directly to arrange your contribution. We are grateful for your partnership in the Gospel.`,
  internationalDonationsContactEmail: 'donations@bemchurch.org',
  internationalQrImageUrl: '',
  receiptVerses: `Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you. - Luke 6:38
Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this,” says the LORD Almighty, “and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it. - Malachi 3:10
Honor the LORD with your wealth, with the firstfruits of all your crops. - Proverbs 3:9
A generous person will prosper; whoever refreshes others will be refreshed. - Proverbs 11:25`
};
const getStoredData = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedData = localStorage.getItem(key);
    
const parsed = storedData ? JSON.parse(storedData) : defaultValue;
    if (Array.isArray(defaultValue)) {
      return (Array.isArray(parsed) ? parsed : defaultValue) as any;
    }
    return parsed as any;

  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};
const saveStoredData = <T,>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const ensureArray = <T,>(value: unknown, fallback: T[] = []): T[] =>
  Array.isArray(value) ? value : fallback;

const normalizeHomepageDates = <T extends { publishedAt?: string; createdAt?: string; submittedAt?: string; date?: string; incidentAt?: string }>(
  items: T[],
  fallbackTimestamp: string
): { items: T[]; updated: boolean } => {
  let updated = false;
  const normalized = items.map((item) => {
    let next = item;
    let mutated = false;
    if (!item.incidentAt && item.date) {
      next = { ...next, incidentAt: item.date };
      mutated = true;
    }
    if (!item.publishedAt) {
      const fallback = item.createdAt || item.submittedAt || item.date || item.incidentAt || fallbackTimestamp;
      next = { ...next, publishedAt: fallback };
      mutated = true;
    }
    if (mutated) updated = true;
    return next;
  });
  return { items: normalized, updated };
};


const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isDev = import.meta.env.DEV;
  const { currentUser, isAdmin, requestUnblockAccount } = useAuth();
  const {
    addNotification,
    addGuestNotification,
    updateLastSeenContent,
    lastSeenContent,
    activeUserId,
    isGuest,
  } = useNotification();
  const lastFetchTimestampRef = useRef<string>(new Date().toISOString());
  const lastSeenContentRef = useRef<string | null>(lastSeenContent);
  const hasLoggedNetworkErrorRef = useRef(false);
  const hasInvalidSermonsRef = useRef(false);
  useEffect(() => {
    lastSeenContentRef.current = lastSeenContent;
  }, [lastSeenContent]);

  const contentNotificationConfig = useMemo(
    () => ({
      sermon: { label: 'Sermon' },
      event: { label: 'Event' },
      blogPost: { label: 'Blog' },
      news: { label: 'News' },
      ministry: { label: 'Ministry' },
      directMedia: { label: 'Media' },
      prayerRequest: { label: 'Prayer Request' },
      testimonial: { label: 'Testimonial' },
      historyChapter: { label: 'History Chapter' },
      historyMilestone: { label: 'History Milestone' },
      aboutSection: { label: 'About Section' },
      branchChurch: { label: 'Branch Update' },
    }) satisfies Partial<Record<ContentType, { label: string }>>,
    [],
  );

  const buildNotificationLink = useCallback((type: ContentType, item: ContentItem): string => {
    const typedItem = item as any;
    switch (type) {
      case 'sermon':
        return typedItem.linkPath || `/sermons/${typedItem.id}`;
      case 'event':
        return typedItem.linkPath || `/events/${typedItem.id}`;
      case 'blogPost':
        return typedItem.linkPath || `/blog/${typedItem.id}`;
      case 'news':
        return typedItem.linkPath || `/news/${typedItem.id}`;
      case 'ministry':
        return typedItem.linkPath || `/ministries/${typedItem.id}`;
      case 'directMedia':
        if (typedItem.linkPath && typedItem.linkPath.includes('#')) {
          return typedItem.linkPath;
        }
        return `/media#media-${typedItem.id}`;
      case 'prayerRequest':
        if (typedItem.linkPath && typedItem.linkPath.includes('#')) {
          return typedItem.linkPath;
        }
        return `/prayer-requests#prayer-${typedItem.id}`;
      case 'testimonial':
        if (typedItem.linkPath && typedItem.linkPath.includes('#')) {
          return typedItem.linkPath;
        }
        return `/prayer-requests#testimonial-${typedItem.id}`;
      case 'historyChapter':
        if (typedItem.linkPath && typedItem.linkPath.includes('#')) {
          return typedItem.linkPath;
        }
        return `/church-history#${typedItem.id}`;
      case 'historyMilestone':
        return `/about#milestone-${typedItem.id}`;
      case 'aboutSection':
        return `/about#${typedItem.id}`;
      case 'branchChurch':
        if (typedItem.linkPath && typedItem.linkPath.includes('#')) {
          return typedItem.linkPath;
        }
        return `/branches#${typedItem.id}`;
      default:
        return typedItem.linkPath || '/';
    }
  }, []);

  const promptUnblockRequest = useCallback(async (blockReason?: string) => {
    const reasonText = blockReason?.trim() ? blockReason.trim() : 'an unspecified reason';
    const shouldRequest = window.confirm(
      `You have been blocked by admin for ${reasonText}. Send an unblock request?`
    );
    if (!shouldRequest) return;
    const note = window.prompt('Please enter an apology or declaration note to request unblocking:');
    if (!note || !note.trim()) {
      alert('Unblock request cancelled because a note is required.');
      return;
    }
    const result = await requestUnblockAccount(note.trim());
    if (result.success) {
      alert('Your unblock request has been sent to the admin team.');
    } else {
      alert(result.message || 'Failed to request unblock.');
    }
  }, [requestUnblockAccount]);

  const handleBlockedResponse = useCallback(async (response: Response): Promise<boolean> => {
    if (response.status !== 403) return false;
    const data = await response.json().catch(() => ({}));
    const errorText = typeof data?.error === 'string' ? data.error.toLowerCase() : '';
    if (data?.code !== 'ACCOUNT_BLOCKED' && !data?.blockReason && !errorText.includes('blocked')) {
      return false;
    }
    await promptUnblockRequest(data?.blockReason);
    return true;
  }, [promptUnblockRequest]);

  const sendContentUpdateNotification = useCallback(
    (action: 'added' | 'updated', type: ContentType, item: ContentItem) => {
      const config = contentNotificationConfig[type];
      if (!config) return;
      const title = (item as any).title || (item as any).name || config.label;
      const message =
        action === 'added'
          ? `New ${config.label} published: "${title}"`
          : `${config.label} updated: "${title}"`;
      const link = buildNotificationLink(type, item);
      addNotification({
        targetUserId: 'all_users_for_content',
        message,
        link,
        type: 'new_content_published',
      });
    },
    [addNotification, buildNotificationLink, contentNotificationConfig],
  );

  const [sermons, setSermons] = useState<Sermon[]>(() =>
    normalizeSermonCollection(getStoredData('bem_sermons', [])),
  );
  const [events, setEvents] = useState<EventItem[]>(() => getStoredData('bem_events', []));
  const [ministries, setMinistries] = useState<Ministry[]>(() => getStoredData('bem_ministries', []));
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => getStoredData('bem_blogPosts', []));
  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => getStoredData('bem_newsItems', []));
  const [aboutSections, setAboutSections] = useState<AboutSection[]>(() => getStoredData('bem_aboutSections', []));
  const [keyPersons, setKeyPersons] = useState<KeyPerson[]>(() => getStoredData('bem_keyPersons', []));
  const [historyMilestones, setHistoryMilestones] = useState<HistoryMilestone[]>(() => getStoredData('bem_historyMilestones', []));
  const [historyChapters, setHistoryChapters] = useState<HistoryChapter[]>(() => getStoredData('bem_historyChapters', []));
  const [branchChurches, setBranchChurches] = useState<BranchChurch[]>(() => getStoredData('bem_branchChurches', []));
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>(() => getStoredData('bem_prayerRequests', []));
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => getStoredData('bem_testimonials', []));
  
  const [directMediaItems, setDirectMediaItems] = useState<DirectMediaItem[]>(() => getStoredData('bem_directMediaItems', []));
  const [donatePageContent, setDonatePageContent] = useState<DonatePageContent>(() => ({
    ...initialSampleDonatePageContent,
    ...getStoredData('bem_donatePageContent', initialSampleDonatePageContent),
  }));

  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>(() => getStoredData('bem_donationRecords', []));
  const [collectionRecords, setCollectionRecords] = useState<CollectionRecord[]>(() => getStoredData('bem_collectionRecords', []));
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => getStoredData('bem_contactMessages', []));
  const [ministryJoinRequests, setMinistryJoinRequests] = useState<MinistryJoinRequest[]>(() => getStoredData('bem_ministryJoinRequests', []));
  const [fellowshipRosters, setFellowshipRosters] = useState<FellowshipRosterItem[]>(() => getStoredData('bem_fellowshipRosters', []));
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedScheduleItem[]>(() => getStoredData('bem_generatedSchedules', []));
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(() => getStoredData('bem_advertisements', []));
  const [churchMembers, setChurchMembers] = useState<ChurchMember[]>(() => getStoredData('bem_churchMembers', []));
  const [meetingLogs, setMeetingLogs] = useState<MeetingLog[]>(() => getStoredData('bem_meetingLogs', []));
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>(() => getStoredData('bem_decisionLogs', []));
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>(() => getStoredData('bem_expenseRecords', []));
  
  const safeSermons = ensureArray<Sermon>(sermons);
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentActivityLogs, setContentActivityLogs] = useState<FrontendActivityLog[]>(() => getStoredData('bem_content_activity_logs', []));
  const contentRef = useRef({
    directMediaItems: directMediaItems as DirectMediaItem[],
    sermons: safeSermons as Sermon[],
    events: events as EventItem[],
    ministries: ministries as Ministry[],
    blogPosts: blogPosts as BlogPost[],
    newsItems: newsItems as NewsItem[],
    aboutSections: aboutSections as AboutSection[],
    keyPersons: keyPersons as KeyPerson[],
    historyMilestones: historyMilestones as HistoryMilestone[],
    historyChapters: historyChapters as HistoryChapter[],
    branchChurches: branchChurches as BranchChurch[],
    prayerRequests: prayerRequests as PrayerRequest[],
    testimonials: testimonials as Testimonial[],
    contactMessages: contactMessages as ContactMessage[],
    donationRecords: donationRecords as DonationRecord[],
    collectionRecords: collectionRecords as CollectionRecord[],
    ministryJoinRequests: ministryJoinRequests as MinistryJoinRequest[],
    donatePageContent: donatePageContent as DonatePageContent,
    meetingLogs: meetingLogs as MeetingLog[],
    decisionLogs: decisionLogs as DecisionLog[],
    advertisements: advertisements as Advertisement[],
    churchMembers: churchMembers as ChurchMember[],
  });

  const dataFetchConfig = useMemo(() => ([
    { key: 'direct-media', setter: setDirectMediaItems, storageKey: 'bem_directMediaItems', getCurrent: () => contentRef.current.directMediaItems },
    { key: 'sermons', setter: setSermons, storageKey: 'bem_sermons', getCurrent: () => contentRef.current.sermons },
    { key: 'events', setter: setEvents, storageKey: 'bem_events', getCurrent: () => contentRef.current.events },
    { key: 'ministries', setter: setMinistries, storageKey: 'bem_ministries', getCurrent: () => contentRef.current.ministries },
    { key: 'blogposts', setter: setBlogPosts, storageKey: 'bem_blogPosts', getCurrent: () => contentRef.current.blogPosts },
    { key: 'newsitems', setter: setNewsItems, storageKey: 'bem_newsItems', getCurrent: () => contentRef.current.newsItems },
    { key: 'aboutsections', setter: setAboutSections, storageKey: 'bem_aboutSections', getCurrent: () => contentRef.current.aboutSections },
    { key: 'keypersons', setter: setKeyPersons, storageKey: 'bem_keyPersons', getCurrent: () => contentRef.current.keyPersons },
    { key: 'historymilestones', setter: setHistoryMilestones, storageKey: 'bem_historyMilestones', getCurrent: () => contentRef.current.historyMilestones },
    { key: 'historychapters', setter: setHistoryChapters, storageKey: 'bem_historyChapters', getCurrent: () => contentRef.current.historyChapters },
    { key: 'branchchurches', setter: setBranchChurches, storageKey: 'bem_branchChurches', getCurrent: () => contentRef.current.branchChurches },
    { key: 'prayer-requests', setter: setPrayerRequests, storageKey: 'bem_prayerRequests', getCurrent: () => contentRef.current.prayerRequests },
    { key: 'testimonials', setter: setTestimonials, storageKey: 'bem_testimonials', getCurrent: () => contentRef.current.testimonials },
    { key: 'contact-messages', setter: setContactMessages, storageKey: 'bem_contactMessages', getCurrent: () => contentRef.current.contactMessages },
    { key: 'donation-records', setter: setDonationRecords, storageKey: 'bem_donationRecords', getCurrent: () => contentRef.current.donationRecords },
      { key: 'expense-records', setter: setExpenseRecords, storageKey: '', getCurrent: () => contentRef.current.expenseRecords },
    { key: 'collection-records', setter: setCollectionRecords, storageKey: 'bem_collectionRecords', getCurrent: () => contentRef.current.collectionRecords },
    { key: 'ministry-join-requests', setter: setMinistryJoinRequests, storageKey: 'bem_ministryJoinRequests', getCurrent: () => contentRef.current.ministryJoinRequests },
    { key: 'donate-page', setter: setDonatePageContent, storageKey: 'bem_donatePageContent', getCurrent: () => contentRef.current.donatePageContent }, 
    { key: 'meeting-logs', setter: setMeetingLogs, storageKey: 'bem_meetingLogs', getCurrent: () => contentRef.current.meetingLogs },
    { key: 'decision-logs', setter: setDecisionLogs, storageKey: 'bem_decisionLogs', getCurrent: () => contentRef.current.decisionLogs },
    { key: 'advertisements', setter: setAdvertisements, storageKey: 'bem_advertisements', getCurrent: () => contentRef.current.advertisements },
    { key: 'church-members', setter: setChurchMembers, storageKey: 'bem_churchMembers', getCurrent: () => contentRef.current.churchMembers },
 ]), []);

  const fetchContentBatch = useCallback(async (setLoading: boolean) => {
  if (setLoading) setLoadingContent(true);
  lastFetchTimestampRef.current = new Date().toISOString();
  const latestContent = new Map<string, any[]>();
  let didUpdateContent = false;

  if (!navigator.onLine) {
    if (setLoading) setLoadingContent(false);
    return;
  }

  hasLoggedNetworkErrorRef.current = false;
	
  const allowEmptyOverwriteKeys = new Set(['advertisements']);
  const fetchPromises = dataFetchConfig.map(async (config) => {
    const currentValue = config.getCurrent?.();
    const hasExistingContent = Array.isArray(currentValue)
      ? (currentValue as any[]).length > 0
      : Boolean(currentValue);
   
    try {
      const response = await fetch(`${API_BASE_URL}/${config.key}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${config.key} fetch failed`);

      const data = await response.json();
      const isSermonsConfig = config.key === 'sermons';
      const sermonPayload = isSermonsConfig ? normalizeSermonCollection(data) : null;

      if (isSermonsConfig && !Array.isArray((data as any)?.sermons ?? data)) {
        if (isDev) {
          console.warn('Received invalid sermons payload. Expected an array.');
        }
        if (hasExistingContent) {
          return;
        }
        config.setter([]);
        if (config.storageKey) saveStoredData(config.storageKey, []);
        didUpdateContent = true;
        return;
      }

      // ✅ If backend returns [] / empty, do NOT overwrite existing local content.
      const hasServerContent = isSermonsConfig
        ? sermonPayload.length > 0
        : Array.isArray(data)
          ? data.length > 0
          : !!data;
      if (!hasServerContent && hasExistingContent && !allowEmptyOverwriteKeys.has(config.key)) {
        if (isDev) {
          console.warn(
            `Skipped overwriting ${config.key} with empty server response to preserve existing content.`
          );
        }
        return;
      }

      // ✅ Normalize comment relation name: backend uses `comment`, frontend expects `comments`
      const normalized = isSermonsConfig
        ? sermonPayload
        : Array.isArray(data)
          ? data.map((item: any) => {
           if (!item || typeof item !== 'object') return item;
            if (config.key === 'sermons') {
              return normalizeSermonItem(item);
            }
            if (config.key === 'meeting-logs') {
              return normalizeMeetingLogItem(item);
            }
            if (config.key === 'decision-logs') {
              return normalizeDecisionLogItem(item);
            }
            let normalizedItem = item;
            if (item.comment && !item.comments) {
              normalizedItem = { ...normalizedItem, comments: item.comment };
            }
            if (config.key === 'prayer-requests') {
              const mediaUrls = Array.isArray(normalizedItem.mediaUrls) && normalizedItem.mediaUrls.length > 0
                ? normalizedItem.mediaUrls.filter(Boolean)
                : normalizedItem.imageUrl
                  ? [normalizedItem.imageUrl]
                  : [];
              normalizedItem = {
                ...normalizedItem,
                 prayers: Array.isArray(normalizedItem.prayers) ? normalizedItem.prayers : Array.isArray(normalizedItem.prayer) ? normalizedItem.prayer : [],
                comments: Array.isArray(normalizedItem.comments) ? normalizedItem.comments : [],
                mediaUrls,
                linkPath: normalizedItem.linkPath || `/prayer-requests#prayer-${normalizedItem.id}`,
              };
            }
            if (config.key === 'testimonials') {
              const mediaUrls = Array.isArray(normalizedItem.mediaUrls) && normalizedItem.mediaUrls.length > 0
                ? normalizedItem.mediaUrls.filter(Boolean)
                : normalizedItem.imageUrl
                  ? [normalizedItem.imageUrl]
                  : [];
              normalizedItem = {
                ...normalizedItem,
                mediaUrls,
                linkPath: normalizedItem.linkPath || `/prayer-requests#testimonial-${normalizedItem.id}`,
              };
            }
            return normalizedItem;
          })
          : data;

      config.setter(normalized);
      if (Array.isArray(normalized)) {
        latestContent.set(config.key, normalized);
      }
      if (config.storageKey) saveStoredData(config.storageKey, normalized);
      didUpdateContent = true;
    } catch (error) {
      const isNetworkError = error instanceof TypeError && !navigator.onLine;
      if (isNetworkError && !hasLoggedNetworkErrorRef.current) {
        if (isDev) {
          console.warn('Network appears offline. Pausing content fetch errors until back online.');
        }
        hasLoggedNetworkErrorRef.current = true;
        return;
      }
      if (isDev) {
        console.error(`Failed to load ${config.key}:`, error);
      }
    }
  }); // ✅ <-- this was missing before

  fetchPromises.push((async () => {
    const hasExistingContent = fellowshipRosters.length > 0 || generatedSchedules.length > 0;
    try {
      const response = await fetch(`${API_BASE_URL}/fellowship-schedules`, { cache: 'no-store' });
      if (!response.ok) throw new Error('fellowship-schedules fetch failed');
      const data = await response.json();
      const rosters = Array.isArray(data?.rosters) ? data.rosters : [];
      const schedules = Array.isArray(data?.schedules) ? data.schedules : [];
      const hasServerContent = rosters.length > 0 || schedules.length > 0;
      if (!hasServerContent && hasExistingContent) {
        if (isDev) {
          console.warn('Skipped overwriting fellowship schedules with empty server response.');
        }
        return;
      }
      const normalizedRosters = rosters.map(normalizeFellowshipRosterItem);
      const normalizedSchedules = schedules.map(normalizeGeneratedScheduleItem);
      setFellowshipRosters(normalizedRosters);
      setGeneratedSchedules(normalizedSchedules);
      saveStoredData('bem_fellowshipRosters', normalizedRosters);
      saveStoredData('bem_generatedSchedules', normalizedSchedules);
      didUpdateContent = true;
    } catch (error) {
      if (isDev) {
        console.error('Failed to load fellowship schedules:', error);
      }
    }
  })());

  await Promise.all(fetchPromises).finally(() => {
    if (setLoading) setLoadingContent(false);
  });

const nowTimestamp = new Date().toISOString();
  const lastSeenTimestamp = lastSeenContentRef.current;
  if (lastSeenTimestamp) {
    const lastSeenTime = new Date(lastSeenTimestamp).getTime();
    const contentConfig: Record<string, { label: string; type: ContentType }> = {
      sermons: { label: 'Sermon', type: 'sermon' },
      events: { label: 'Event', type: 'event' },
      blogposts: { label: 'Blog', type: 'blogPost' },
      newsitems: { label: 'News', type: 'news' },
      ministries: { label: 'Ministry', type: 'ministry' },
      'direct-media': { label: 'Media', type: 'directMedia' },
      'prayer-requests': { label: 'Prayer Request', type: 'prayerRequest' },
      testimonials: { label: 'Testimonial', type: 'testimonial' },
      historychapters: { label: 'History Chapter', type: 'historyChapter' },
      historymilestones: { label: 'History Milestone', type: 'historyMilestone' },
      aboutsections: { label: 'About Section', type: 'aboutSection' },
      branchchurches: { label: 'Branch Update', type: 'branchChurch' },
    };

    const recentUpdates: Array<{ message: string; link: string; timestamp: string }> = [];

    Array.from(latestContent.entries()).forEach(([key, items]) => {
      const config = contentConfig[key];
      if (!config) return;
      items.forEach((item) => {
        const timestamp =
          item?.updatedAt ||
          item?.publishedAt ||
          item?.createdAt ||
          item?.incidentAt ||
          item?.date;
        if (!timestamp) return;
        const itemTime = new Date(timestamp).getTime();
        if (itemTime <= lastSeenTime) return;
        const title = item?.title || item?.name || 'New update';
        recentUpdates.push({
          message: `New ${config.label} update: "${title}"`,
          link: buildNotificationLink(config.type, item as ContentItem),
          timestamp,
        });
      });
    });

    recentUpdates
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .forEach((update) => {
        if (isGuest) {
          addGuestNotification({
            targetUserId: activeUserId,
            message: update.message,
            link: update.link,
            type: 'new_content_published',
          });
        } else if (currentUser && (currentUser.receiveContentUpdateNotifications ?? true)) {
          addNotification({
            targetUserId: currentUser.id,
            message: update.message,
            link: update.link,
            type: 'new_content_published',
          });
        }
      });
  }

  if (didUpdateContent) {
    updateLastSeenContent(nowTimestamp);
  }
}, [dataFetchConfig, addGuestNotification, addNotification, updateLastSeenContent, isGuest, currentUser, activeUserId, isDev, fellowshipRosters.length, generatedSchedules.length, buildNotificationLink]);

  useEffect(() => {
    fetchContentBatch(true);
  }, [fetchContentBatch]);

  useEffect(() => {
    const refreshIntervalMs = 15000;
    const intervalId = window.setInterval(() => {
      fetchContentBatch(false);
    }, refreshIntervalMs);

    const handleOnline = () => fetchContentBatch(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchContentBatch(false);
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchContentBatch]);
  
  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const source = new EventSource(`${API_BASE_URL}/content-updates`);

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type) {
          fetchContentBatch(false);
        }
      } catch (error) {
        console.error('Failed to parse content update payload:', error);
      }
    };

    source.addEventListener('message', handleMessage);

    source.addEventListener('error', () => {
      if (source.readyState === EventSource.CLOSED) {
        console.warn('Content updates connection closed.');
      }
    });

    return () => {
      source.removeEventListener('message', handleMessage);
      source.close();
    };
  }, [fetchContentBatch]);

  useEffect(() => {
    if (Array.isArray(sermons)) {
      hasInvalidSermonsRef.current = false;
      return;
    }
    if (hasInvalidSermonsRef.current) return;
    hasInvalidSermonsRef.current = true;
    if (isDev) {
      console.warn('Sermons state was not an array. Resetting and refetching.');
    }
    setSermons([]);
    fetchContentBatch(false);
  }, [fetchContentBatch, isDev, sermons]);

  useEffect(() => {
    const { items, updated } = normalizeHomepageDates(safeSermons, lastFetchTimestampRef.current);
    if (updated) setSermons(items);
  }, [safeSermons]);

  useEffect(() => {
    const { items, updated } = normalizeHomepageDates(events, lastFetchTimestampRef.current);
    if (updated) setEvents(items);
  }, [events]);

  useEffect(() => {
    const { items, updated } = normalizeHomepageDates(blogPosts, lastFetchTimestampRef.current);
    if (updated) setBlogPosts(items);
  }, [blogPosts]);

  useEffect(() => {
    const { items, updated } = normalizeHomepageDates(newsItems, lastFetchTimestampRef.current);
    if (updated) setNewsItems(items);
  }, [newsItems]);

  useEffect(() => {
    const { items, updated } = normalizeHomepageDates(prayerRequests, lastFetchTimestampRef.current);
    if (updated) setPrayerRequests(items);
  }, [prayerRequests]);

  useEffect(() => {
    const { items, updated } = normalizeHomepageDates(testimonials, lastFetchTimestampRef.current);
    if (updated) setTestimonials(items);
  }, [testimonials]);

  useEffect(() => { contentRef.current.sermons = safeSermons; saveStoredData('bem_sermons', safeSermons); }, [safeSermons]);
  useEffect(() => { contentRef.current.events = events; saveStoredData('bem_events', events); }, [events]);
  useEffect(() => { contentRef.current.ministries = ministries; saveStoredData('bem_ministries', ministries); }, [ministries]);
  useEffect(() => { contentRef.current.blogPosts = blogPosts; saveStoredData('bem_blogPosts', blogPosts); }, [blogPosts]);
  useEffect(() => { contentRef.current.newsItems = newsItems; saveStoredData('bem_newsItems', newsItems); }, [newsItems]);
  useEffect(() => { contentRef.current.aboutSections = aboutSections; saveStoredData('bem_aboutSections', aboutSections); }, [aboutSections]);
  useEffect(() => { contentRef.current.keyPersons = keyPersons; saveStoredData('bem_keyPersons', keyPersons); }, [keyPersons]);
  useEffect(() => { contentRef.current.historyMilestones = historyMilestones; saveStoredData('bem_historyMilestones', historyMilestones); }, [historyMilestones]);
  useEffect(() => { contentRef.current.historyChapters = historyChapters; saveStoredData('bem_historyChapters', historyChapters); }, [historyChapters]);
  useEffect(() => { contentRef.current.branchChurches = branchChurches; saveStoredData('bem_branchChurches', branchChurches); }, [branchChurches]);
  useEffect(() => { contentRef.current.prayerRequests = prayerRequests; saveStoredData('bem_prayerRequests', prayerRequests); }, [prayerRequests]);
  useEffect(() => { contentRef.current.testimonials = testimonials; saveStoredData('bem_testimonials', testimonials); }, [testimonials]);
  useEffect(() => { contentRef.current.donationRecords = donationRecords; saveStoredData('bem_donationRecords', donationRecords); }, [donationRecords]);
  useEffect(() => { contentRef.current.collectionRecords = collectionRecords; saveStoredData('bem_collectionRecords', collectionRecords); }, [collectionRecords]);
  useEffect(() => { contentRef.current.contactMessages = contactMessages; saveStoredData('bem_contactMessages', contactMessages); }, [contactMessages]);
  useEffect(() => { contentRef.current.ministryJoinRequests = ministryJoinRequests; saveStoredData('bem_ministryJoinRequests', ministryJoinRequests); }, [ministryJoinRequests]);
  useEffect(() => { contentRef.current.directMediaItems = directMediaItems; saveStoredData('bem_directMediaItems', directMediaItems); }, [directMediaItems]);
  useEffect(() => { contentRef.current.donatePageContent = donatePageContent; saveStoredData('bem_donatePageContent', donatePageContent); }, [donatePageContent]);
  useEffect(() => { contentRef.current.meetingLogs = meetingLogs; saveStoredData('bem_meetingLogs', meetingLogs); }, [meetingLogs]);
  useEffect(() => { contentRef.current.decisionLogs = decisionLogs; saveStoredData('bem_decisionLogs', decisionLogs); }, [decisionLogs]);
  useEffect(() => { contentRef.current.advertisements = advertisements; saveStoredData('bem_advertisements', advertisements); }, [advertisements]);
  useEffect(() => { contentRef.current.churchMembers = churchMembers; saveStoredData('bem_churchMembers', churchMembers); }, [churchMembers]);
  useEffect(() => { saveStoredData('bem_fellowshipRosters', fellowshipRosters); }, [fellowshipRosters]);
  useEffect(() => { saveStoredData('bem_generatedSchedules', generatedSchedules); }, [generatedSchedules]);
  useEffect(() => { saveStoredData('bem_expenseRecords', expenseRecords); }, [expenseRecords]);
  useEffect(() => { saveStoredData('bem_content_activity_logs', contentActivityLogs); }, [contentActivityLogs]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('bem_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const buildDirectMediaPayload = (data: DirectMediaFormData) => {
    const tags = data.tagsString
      ? data.tagsString
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    return {
      ...data,
      category: data.uploadCategory,
      tags,
    };
  };

  const logContentActivity = useCallback((description: string, type: FrontendActivityLog['type'], itemType?: FrontendActivityLog['itemType'], itemId?: string) => {
    const newLog: FrontendActivityLog = { id: `content-log-${Date.now()}`, timestamp: new Date().toISOString(), userId: currentUser?.id, description, type, itemType, itemId };
    setContentActivityLogs(prevLogs => [newLog, ...prevLogs.slice(0, 99)]);
  }, [currentUser]);

  const addContent = async (type: ContentType, data: GenericContentFormData): Promise<{ success: boolean; newItem?: ContentItem; message?: string }> => {
    const allowedForNonAdmins: ContentType[] = ['contactMessage', 'ministryJoinRequest', 'donation', 'prayerRequest', 'testimonial'];
    if (!isAdmin && !allowedForNonAdmins.includes(type)) {
        return { success: false, message: 'Only administrators can create this type of content.' };
    }
    if ((type === 'prayerRequest' || type === 'testimonial') && !currentUser) {
      return { success: false, message: 'Please log in to submit a prayer request or testimonial.' };
    }
    const contentTypeToEndpoint: Partial<Record<ContentType, string>> = {
    sermon: 'sermons',
    event: 'events',
    ministry: 'ministries',
    blogPost: 'blogposts',
    news: 'newsitems',
    aboutSection: 'aboutsections',
    keyPerson: 'keypersons',
    historyMilestone: 'historymilestones',
    historyChapter: 'historychapters',
    branchChurch: 'branchchurches',
    directMedia: 'direct-media',
    prayerRequest: 'prayer-requests',
    testimonial: 'testimonials',
    donation: 'donation-records',
    collectionRecord: 'collection-records',
    ministryJoinRequest: 'ministry-join-requests',
    contactMessage: 'contact-messages',
    expenseRecord: 'expense-records',
    meetingLog: 'meeting-logs',
    decisionLog: 'decision-logs',
    advertisement: 'advertisements',
    churchMember: 'church-members',
    fellowshipRoster: 'fellowship-schedules/rosters',
    generatedSchedule: 'fellowship-schedules/generated',
};

    const newItemId = `${type}-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const normalizedData: any = { ...data };
    const incidentAt = normalizedData.incidentAt || normalizedData.date;
    if (incidentAt) {
      normalizedData.incidentAt = incidentAt;
      if (!normalizedData.date) {
        normalizedData.date = incidentAt;
      }
    }
    if (!normalizedData.publishedAt) {
      normalizedData.publishedAt = timestamp;
    }

    const endpoint = contentTypeToEndpoint[type];
    if (endpoint) {
        try {
            const payload = type === 'directMedia'
              ? buildDirectMediaPayload(normalizedData as DirectMediaFormData)
              : type === 'meetingLog'
                ? {
                    ...normalizedData,
                    meetingType: normalizeMeetingTypeForApi((normalizedData as MeetingLogFormData).meetingType),
                    actionItems: serializeActionItems((normalizedData as MeetingLogFormData).actionItems),
                  }
                : type === 'decisionLog'
                  ? {
                      ...normalizedData,
                      followUpActions: serializeActionItems((normalizedData as DecisionLogFormData).followUpActions),
                    }
                  : normalizedData;
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ ...payload, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName, userId: currentUser?.id, userName: currentUser?.fullName, userEmail: currentUser?.email, userProfileImageUrl: currentUser?.profileImageUrl }) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `Failed to create ${type}`); }
            const newItem: ContentItem = await response.json();
            const normalizedNewItem =
              type === 'sermon'
                ? (normalizeSermonItem(newItem) as ContentItem)
                : type === 'meetingLog'
                  ? (normalizeMeetingLogItem(newItem) as ContentItem)
                  : type === 'decisionLog'
                    ? (normalizeDecisionLogItem(newItem) as ContentItem)
                    : type === 'fellowshipRoster'
                      ? (normalizeFellowshipRosterItem(newItem) as ContentItem)
                      : type === 'generatedSchedule'
                        ? (normalizeGeneratedScheduleItem(newItem) as ContentItem)
                        : newItem;
            const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, ministry: setMinistries, blogPost: setBlogPosts, news: setNewsItems, aboutSection: setAboutSections, keyPerson: setKeyPersons, historyMilestone: setHistoryMilestones, historyChapter: setHistoryChapters, branchChurch: setBranchChurches, directMedia: setDirectMediaItems, prayerRequest: setPrayerRequests, testimonial: setTestimonials, donation: setDonationRecords, collectionRecord: setCollectionRecords, ministryJoinRequest: setMinistryJoinRequests, meetingLog: setMeetingLogs, decisionLog: setDecisionLogs, advertisement: setAdvertisements, churchMember: setChurchMembers, fellowshipRoster: setFellowshipRosters, generatedSchedule: setGeneratedSchedules };
            const setter = setterMap[type];
            if (setter) {
              setter((prev: any[]) => [normalizedNewItem, ...ensureArray(prev)]);
            }
            logContentActivity(`${type} created: "${(normalizedNewItem as any).title || (normalizedNewItem as any).name}"`, 'content_creation', type, normalizedNewItem.id);
            if (type === 'donation') {
              addNotification({
                targetUserId: 'admin_group',
                message: `New donation logged: ${normalizedNewItem.donorName} donated NPR ${Number(normalizedNewItem.amount).toFixed(2)}.`,
                link: '/admin/donation-records',
                type: 'generic',
              });
            }
            sendContentUpdateNotification('added', type, normalizedNewItem);           
            return { success: true, newItem: normalizedNewItem };            
        } catch (error) {
          console.error(`Error adding ${type}:`, error);
          const message = error instanceof Error ? error.message : `Failed to create ${type}. Please try again.`;
          return { success: false, message };
        }
    }
    if (endpoint) {
      return { success: false, message: 'Failed to create content.' };
    }
    let newItem: ContentItem | null = null;
    let success = false;
    let message = 'An unknown error occurred.';
    switch (type) {
      case 'sermon': {
        return { success: false, message: 'Failed to create sermon.' };
      }
      case 'event': {
        const formData = normalizedData as EventFormData;
        const normalizedLocations = (formData.locations || []).filter(Boolean);
        const newEvent: EventItem = {
          id: newItemId,
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          linkPath: formData.linkPath || `/events/${newItemId}`,
          category: formData.category,
          date: formData.date,
          incidentAt: formData.incidentAt || formData.date,
          publishedAt: formData.publishedAt || timestamp,
          eventType: formData.eventType || 'REGULAR',
          scheduleType: formData.scheduleType,
          scheduleNotes: formData.scheduleNotes,
          locations: normalizedLocations,
          conductedBy: (formData.conductedBy || []).filter(Boolean),
          speakers: (formData.speakers || []).filter(Boolean),
          location: formData.location || normalizedLocations[0],
          mapEmbedUrl: formData.mapEmbedUrl,
          time: formData.time,
          expectations: formData.expectations,
          guests: formData.guests,
          contactPerson: formData.contactPerson,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          registrationLink: formData.registrationLink,
          capacity: formData.capacity,
          isFeeRequired: formData.isFeeRequired,
          feeAmount: formData.feeAmount,
          videoUrl: formData.videoUrl,
          audioUrl: formData.audioUrl,
          postedByAdminId: currentUser?.id,
          postedByAdminName: currentUser?.fullName,
          createdAt: timestamp,
          updatedAt: timestamp,
          likes: 0,
          comments: [],
        };
        setEvents((prev) => [newEvent, ...prev]);
        newItem = newEvent;
        success = true;
        break;
      }
      case 'ministry': {
        const formData = data as MinistryFormData;
        const newMinistry: Ministry = {
          id: newItemId,
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          linkPath: formData.linkPath || `/ministries/${newItemId}`,
          category: formData.category,
          leader: formData.leader,
          meetingTime: formData.meetingTime,
          postedByAdminId: currentUser?.id,
          postedByAdminName: currentUser?.fullName,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        setMinistries((prev) => [newMinistry, ...prev]);
        newItem = newMinistry;
        success = true;
        break;
      }
      case 'blogPost': {
        const formData = normalizedData as BlogPostFormData;
        const newBlog: BlogPost = {
          id: newItemId,
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          linkPath: formData.linkPath || `/blog/${newItemId}`,
          category: formData.category,
          date: formData.date,
          incidentAt: formData.incidentAt || formData.date,
          publishedAt: formData.publishedAt || timestamp,
          audioUrl: formData.audioUrl,
          videoUrl: formData.videoUrl,
          mediaUrls: formData.mediaUrls,
          location: formData.location,
          postedByAdminId: currentUser?.id,
          postedByAdminName: currentUser?.fullName,
          createdAt: timestamp,
          updatedAt: timestamp,
          likes: 0,
          comments: [],
        };
        setBlogPosts((prev) => [newBlog, ...prev]);
        newItem = newBlog;
        success = true;
        break;
      }
      case 'news': {
        const formData = normalizedData as NewsItemFormData;
        const newNews: NewsItem = {
          id: newItemId,
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          linkPath: formData.linkPath || `/news/${newItemId}`,
          category: formData.category,
          date: formData.date,
          incidentAt: formData.incidentAt || formData.date,
          publishedAt: formData.publishedAt || timestamp,
          videoUrl: formData.videoUrl,
          audioUrl: formData.audioUrl,
          postedByAdminId: currentUser?.id,
          postedByAdminName: currentUser?.fullName,
          createdAt: timestamp,
          updatedAt: timestamp,
          likes: 0,
          comments: [],
        };
        setNewsItems((prev) => [newNews, ...prev]);
        newItem = newNews;
        success = true;
        break;
      }
      case 'directMedia': { const formData = data as DirectMediaFormData; const newMedia: DirectMediaItem = { id: newItemId, title: formData.title, description: formData.description, url: formData.url, mediaType: formData.mediaType, category: formData.uploadCategory, tags: formData.tagsString?.split(',').map(t => t.trim()).filter(Boolean) || [], uploadDate: timestamp, linkPath: `/media`, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName, updatedAt: timestamp, }; setDirectMediaItems(prev => [newMedia, ...prev]); newItem = newMedia; success = true; break; }
      case 'churchMember': { const newMember: ChurchMember = { id: newItemId, ...(data as ChurchMemberFormData), createdAt: timestamp, updatedAt: timestamp, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName }; setChurchMembers(prev => [newMember, ...prev]); newItem = newMember; success = true; break; }
      case 'meetingLog': { const newLog: MeetingLog = { id: newItemId, ...(data as MeetingLogFormData), createdAt: timestamp, updatedAt: timestamp, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName }; setMeetingLogs(prev => [newLog, ...prev]); newItem = newLog; success = true; break; }
      case 'decisionLog': { const newLog: DecisionLog = { id: newItemId, ...(data as DecisionLogFormData), createdAt: timestamp, updatedAt: timestamp, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName }; setDecisionLogs(prev => [newLog, ...prev]); newItem = newLog; success = true; break; }
      case "expenseRecord": {
        try {
          const resp = await fetch(`/expense-records`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify(data),
          });
          if (!resp.ok) throw new Error(`HTTP `);
          const created = await resp.json();
          setExpenseRecords(prev => [created, ...prev]);
          return created;
        } catch (err) {
          console.error("Error adding expense record:", err);
          return null;
        }
      }
      case 'advertisement': { const newAd: Advertisement = { id: newItemId, ...(data as AdvertisementFormData), createdAt: timestamp, updatedAt: timestamp, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName }; setAdvertisements(prev => [newAd, ...prev]); newItem = newAd; success = true; break; }
      }
    if (success && newItem) {
      logContentActivity(`${type} created: "${(newItem as any).title || (newItem as any).name}"`, 'content_creation', type, newItemId);
      sendContentUpdateNotification('added', type, newItem);
    }
    return { success, newItem: newItem || undefined, message: success ? 'Content added successfully.' : message };
  };

  const updateContent = async (type: ContentType, id: string, data: GenericContentFormData): Promise<{ success: boolean; updatedItem?: ContentItem; message?: string }> => {
    if (type === 'donatePageContent') {
      try {
        const response = await fetch(`${API_BASE_URL}/donate-page`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update donate page content.');
        }
        const updatedItem: ContentItem = await response.json();
        setDonatePageContent(updatedItem as DonatePageContent);
        logContentActivity(`Donate page content updated`, 'content_update', 'donatePageContent', 'singleton');
        return { success: true, updatedItem };
      } catch (error) {
        console.error('Error updating donate page content:', error);
        return { success: false, message: 'Failed to update donate page content. Please try again.' };
      }
    }

    const contentTypeToEndpoint: Partial<Record<ContentType, string>> =
 { sermon: 'sermons', event: 'events', ministry: 'ministries', blogPost: 'blogposts', news: 'newsitems', aboutSection: 'aboutsections',
 keyPerson: 'keypersons', historyMilestone: 'historymilestones', historyChapter: 'historychapters', branchChurch: 'branchchurches',
 directMedia: 'direct-media', prayerRequest: 'prayer-requests', testimonial: 'testimonials',
 donation: 'donation-records', collectionRecord: 'collection-records', contactMessage: 'contact-messages',
 ministryJoinRequest: 'ministry-join-requests', meetingLog: 'meeting-logs', decisionLog: 'decision-logs',
 advertisement: 'advertisements', churchMember: 'church-members', fellowshipRoster: 'fellowship-schedules/rosters', generatedSchedule: 'fellowship-schedules/generated' };
    const endpoint = contentTypeToEndpoint[type];
    if (endpoint) {
        try {
        const payload = type === 'directMedia'
          ? buildDirectMediaPayload(data as DirectMediaFormData)
          : type === 'meetingLog'
            ? {
                ...data,
                meetingType: normalizeMeetingTypeForApi((data as MeetingLogFormData).meetingType),
                actionItems: serializeActionItems((data as MeetingLogFormData).actionItems),
              }
            : type === 'decisionLog'
              ? {
                  ...data,
                  followUpActions: serializeActionItems((data as DecisionLogFormData).followUpActions),
                }
              : data;
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to update ${type}`);
        }
        const updatedItem: ContentItem = await response.json();
        const normalizedUpdatedItem =
          type === 'sermon'
            ? (normalizeSermonItem(updatedItem) as ContentItem)
            : type === 'meetingLog'
              ? (normalizeMeetingLogItem(updatedItem) as ContentItem)
              : type === 'decisionLog'
                ? (normalizeDecisionLogItem(updatedItem) as ContentItem)
                : type === 'fellowshipRoster'
                  ? (normalizeFellowshipRosterItem(updatedItem) as ContentItem)
                  : type === 'generatedSchedule'
                    ? (normalizeGeneratedScheduleItem(updatedItem) as ContentItem)
                    : updatedItem;
        const setterMap: Record<string, Function> = {
          sermon: setSermons,
          event: setEvents,
          ministry: setMinistries,
          blogPost: setBlogPosts,
          news: setNewsItems,
          aboutSection: setAboutSections,
          keyPerson: setKeyPersons,
          historyMilestone: setHistoryMilestones,
          historyChapter: setHistoryChapters,
          branchChurch: setBranchChurches,
          directMedia: setDirectMediaItems,
          prayerRequest: setPrayerRequests,
          testimonial: setTestimonials,
          donation: setDonationRecords,
          collectionRecord: setCollectionRecords,
          fellowshipRoster: setFellowshipRosters,
          generatedSchedule: setGeneratedSchedules,
          meetingLog: setMeetingLogs,
          decisionLog: setDecisionLogs,
          advertisement: setAdvertisements,
          churchMember: setChurchMembers,
        };
        const setter = setterMap[type];
        if (setter) {
          setter((prev: any[]) => ensureArray(prev).map(item => item.id === id ? normalizedUpdatedItem : item));
        }
        logContentActivity(
          `${type} updated: "${(normalizedUpdatedItem as any).title || (normalizedUpdatedItem as any).name}"`,
          'content_update',
          type,
          id,
        );
        sendContentUpdateNotification('updated', type, normalizedUpdatedItem);
        return { success: true, updatedItem: normalizedUpdatedItem };
      } catch (error) {
        console.error(`Error updating ${type}:`, error);
        return { success: false, message: `Failed to update ${type}. Please try again.` };
      }
    }
    if (type === 'fellowshipRoster') {
      try {
        const response = await fetch(`${API_BASE_URL}/fellowship-schedules/rosters/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ ...(data as FellowshipRosterFormData), postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update fellowship roster');
        }
        const updatedItem = normalizeFellowshipRosterItem(await response.json());
        setFellowshipRosters((prev) => prev.map((item) => item.id === id ? updatedItem : item));
        logContentActivity(`fellowshipRoster updated: "${updatedItem.groupNameOrEventTitle}"`, 'content_update', 'fellowshipRoster', id);
        return { success: true, updatedItem };
      } catch (error) {
        console.error('Error updating fellowship roster:', error);
        return { success: false, message: 'Failed to update fellowship roster. Please try again.' };
      }
    }
    const timestamp = new Date().toISOString();
    let success = false;
    let updatedItem: ContentItem | undefined = undefined;
    let message = 'An unknown error occurred.';
    const updateAndLog = <T extends ContentItem>(setState: React.Dispatch<React.SetStateAction<T[]>>, newItemData: Partial<T>): { success: boolean, updatedItem?: T, message?: string } => {
      let found = false; let itemForLog: T | undefined = undefined;
      setState(prevItems => { const newItems = prevItems.map(item => { if (item.id === id) { found = true; const updated = { ...item, ...newItemData, updatedAt: timestamp }; itemForLog = updated; updatedItem = updated; return updated; } return item; }); return newItems; });
      if (found && itemForLog) { logContentActivity(`${type} updated: "${(itemForLog as any).title || (itemForLog as any).name}"`, 'content_update', type, id); return { success: true, updatedItem: itemForLog, message: 'Content updated successfully.' }; }
      return { success: false, message: 'Item not found.' };
    };
    switch (type) {
        case 'directMedia': { const result = updateAndLog<DirectMediaItem>(setDirectMediaItems, data as any); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        case 'churchMember': { const result = updateAndLog<ChurchMember>(setChurchMembers, data as any); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        case 'meetingLog': { const result = updateAndLog<MeetingLog>(setMeetingLogs, data as any); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        case 'decisionLog': { const result = updateAndLog<DecisionLog>(setDecisionLogs, data as any); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        case 'expenseRecord': { const result = updateAndLog<ExpenseRecord>(setExpenseRecords, { ...(data as any), amount: Number((data as ExpenseRecordFormData).amount) }); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        case 'fellowshipRoster': { const result = updateAndLog<FellowshipRosterItem>(setFellowshipRosters, data as any); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        case 'advertisement': { const result = updateAndLog<Advertisement>(setAdvertisements, data as any); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        default: return { success: false, message: "Content type not found for update." };
    }
    if (success && updatedItem) {
      sendContentUpdateNotification('updated', type, updatedItem);
    }
    return { success, updatedItem, message };
  }

  const deleteContent = async (type: ContentType, id: string, reason?: string): Promise<boolean> => {
    const contentTypeToEndpoint: Partial<Record<ContentType, string>> = { sermon: 'sermons', event: 'events', ministry: 'ministries', blogPost: 'blogposts', news: 'newsitems', aboutSection: 'aboutsections', keyPerson: 'keypersons', historyMilestone: 'historymilestones', historyChapter: 'historychapters', branchChurch: 'branchchurches', directMedia: 'direct-media', prayerRequest: 'prayer-requests', testimonial: 'testimonials', donation: 'donation-records', collectionRecord: 'collection-records', ministryJoinRequest: 'ministry-join-requests', contactMessage: 'contact-messages', meetingLog: 'meeting-logs', decisionLog: 'decision-logs', advertisement: 'advertisements', churchMember: 'church-members' };
    const endpoint = contentTypeToEndpoint[type];
    if (endpoint) {
        try {
            const shouldSendReason = Boolean(reason && reason.trim());
            const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
              method: 'DELETE',
              headers: { ...getAuthHeaders(), ...(shouldSendReason ? { 'Content-Type': 'application/json' } : {}) },
              body: shouldSendReason ? JSON.stringify({ reason }) : undefined,
            });
            if (!response.ok && response.status !== 204) throw new Error(`Failed to delete ${type} from server`);
            const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, ministry: setMinistries, blogPost: setBlogPosts, news: setNewsItems, aboutSection: setAboutSections, keyPerson: setKeyPersons, historyMilestone: setHistoryMilestones, historyChapter: setHistoryChapters, branchChurch: setBranchChurches, directMedia: setDirectMediaItems, prayerRequest: setPrayerRequests, testimonial: setTestimonials, donation: setDonationRecords, collectionRecord: setCollectionRecords, ministryJoinRequest: setMinistryJoinRequests, meetingLog: setMeetingLogs, decisionLog: setDecisionLogs, advertisement: setAdvertisements, churchMember: setChurchMembers };
            const setter = setterMap[type];
            if (setter) {
              setter((prev: any[]) => ensureArray(prev).filter(item => item.id !== id));
            }
            logContentActivity(`${type} with ID ${id} deleted`, 'content_deletion', type, id);
            return true;
        } catch (error) {
          console.error(`Error deleting ${type}:`, error);
          return false;
        }
      }
    if (type === 'fellowshipRoster') {
      try {
        const response = await fetch(`${API_BASE_URL}/fellowship-schedules/rosters/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok && response.status !== 204) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete fellowship roster');
        }
        setFellowshipRosters((prev) => ensureArray(prev).filter((item) => item.id !== id));
        logContentActivity(`fellowshipRoster deleted: "${id}"`, 'content_deletion', 'fellowshipRoster', id);
        return true;
      } catch (error) {
        console.error('Error deleting fellowship roster:', error);
        return false;
      }
    }
     let success = false;
     const deleteAndLog = <T extends ContentItem>(setState: React.Dispatch<React.SetStateAction<T[]>>): boolean => {
       let itemTitle = 'Unknown';
       setState(prevItems => {
         const normalizedItems = ensureArray(prevItems);
         const itemToDelete = (Array.isArray(normalizedItems) ? normalizedItems : []).find(item => item.id === id);
         if (itemToDelete) {
           itemTitle = (itemToDelete as any).title || (itemToDelete as any).name || itemToDelete.id;
         }
         return normalizedItems.filter(item => item.id !== id);
       });
       logContentActivity(`${type} deleted: "${itemTitle}"`, 'content_deletion', type, id);
       return true;
     };
     switch (type) {
        case 'sermon': success = deleteAndLog(setSermons); break;
        case 'event': success = deleteAndLog(setEvents); break;
        case 'ministry': success = deleteAndLog(setMinistries); break;
        case 'blogPost': success = deleteAndLog(setBlogPosts); break;
        case 'news': success = deleteAndLog(setNewsItems); break;
        case 'aboutSection': success = deleteAndLog(setAboutSections); break;
        case 'keyPerson': success = deleteAndLog(setKeyPersons); break;
        case 'historyMilestone': success = deleteAndLog(setHistoryMilestones); break;
        case 'historyChapter': success = deleteAndLog(setHistoryChapters); break;
        case 'branchChurch': success = deleteAndLog(setBranchChurches); break;
        case 'directMedia': success = deleteAndLog(setDirectMediaItems); break;
        case 'churchMember': success = deleteAndLog(setChurchMembers); break;
        case 'meetingLog': success = deleteAndLog(setMeetingLogs); break;
        case 'decisionLog': success = deleteAndLog(setDecisionLogs); break;
        case 'expenseRecord': success = deleteAndLog(setExpenseRecords); break;
        case 'fellowshipRoster': success = deleteAndLog(setFellowshipRosters); break;
        case 'advertisement': success = deleteAndLog(setAdvertisements); break;
        case 'prayerRequest': success = deleteAndLog(setPrayerRequests); break;
        case 'testimonial': success = deleteAndLog(setTestimonials); break;
        case 'donation': success = deleteAndLog(setDonationRecords); break;
        case 'collectionRecord': success = deleteAndLog(setCollectionRecords); break;
        case 'contactMessage': success = deleteAndLog(setContactMessages); break;
        case 'ministryJoinRequest': success = deleteAndLog(setMinistryJoinRequests); break;
    }
    return success;
  }
  
  const getContentById = (type: ContentType, id: string): ContentItem | undefined => {
    const allContentArrays = [ safeSermons, events, ministries, blogPosts, newsItems, aboutSections, keyPersons, historyMilestones, historyChapters, branchChurches, directMediaItems, churchMembers, meetingLogs, decisionLogs, expenseRecords, collectionRecords, fellowshipRosters, generatedSchedules, advertisements, prayerRequests, testimonials, donationRecords ];
    if (type === 'donatePageContent' && id === 'singleton') return donatePageContent;
    for (const contentArray of allContentArrays) { const item = (Array.isArray(contentArray) ? (contentArray as ContentItem[]) : []).find(item => item.id === id); if (item) return item; }
    return undefined;
  };
  const addCommentToItem = async (itemId: string, itemType: Comment['itemType'], commentText: string): Promise<Comment | null> => {
    try {
        const payload: any = { itemType, itemId, text: commentText };

        if (!currentUser) {
            // Basic guest flow (replace with a proper modal if desired)
            const guestName = window.prompt('Enter your name to comment:');
            if (!guestName) return null;
            const contact = window.prompt('Enter your email OR phone:');
            if (!contact) return null;

            if (contact.includes('@')) payload.guestEmail = contact.trim();
            else payload.guestPhone = contact.trim();

            payload.userName = guestName.trim();
            payload.isGuest = true;
        } else {
            payload.userId = currentUser.id;
            payload.userName = currentUser.fullName;
            payload.userProfileImageUrl = currentUser.profileImageUrl;
        }

        const response = await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            if (await handleBlockedResponse(response)) {
                return null;
            }
            throw new Error('Failed to post comment.');
        }

        const newComment: Comment = await response.json();

        // Re-fetch the content list so comment counts stay consistent everywhere
        const endpointMap = { sermon: 'sermons', event: 'events', blogPost: 'blogposts', news: 'newsitems', historyChapter: 'historychapters', prayerRequest: 'prayer-requests', testimonial: 'testimonials' };
        const endpoint = endpointMap[itemType as keyof typeof endpointMap];
        if (endpoint) {
            const res = await fetch(`${API_BASE_URL}/${endpoint}`);
            const data = await res.json();
            const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, blogPost: setBlogPosts, news: setNewsItems, historyChapter: setHistoryChapters, 'prayer-requests': setPrayerRequests, testimonials: setTestimonials };
            const setter = setterMap[endpoint.replace('-', '')] || setterMap[endpoint];
            if (setter) {
              if (endpoint === 'sermons') {
                setter(normalizeSermonCollection(data));
              } else {
                setter(ensureArray(data));
              }
            }
        }

        logContentActivity(`Commented on ${itemType}: ${itemId}`, `${itemType}_comment_added` as any, 'comment', newComment.id);
        return newComment;
    } catch (error) {
        console.error('Error adding comment:', error);
        return null;
    }
};

  const updateComment = async (commentId: string, newText: string, itemType: Comment['itemType'], itemId: string): Promise<boolean> => {
    try {
         const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newText }) });
        if (!response.ok) throw new Error('Failed to update comment.');
        const endpointMap = { sermon: 'sermons', event: 'events', blogPost: 'blogposts', news: 'newsitems', historyChapter: 'historychapters', prayerRequest: 'prayer-requests', testimonial: 'testimonials' };
        const endpoint = endpointMap[itemType as keyof typeof endpointMap];
         if(endpoint) {
             const res = await fetch(`${API_BASE_URL}/${endpoint}`);
             const data = await res.json();
             const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, blogPost: setBlogPosts, news: setNewsItems, historyChapter: setHistoryChapters, 'prayer-requests': setPrayerRequests, testimonials: setTestimonials };
             const setter = setterMap[endpoint.replace('-','')] || setterMap[endpoint];
             if (setter) {
               if (endpoint === 'sermons') {
                 setter(normalizeSermonCollection(data));
               } else {
                 setter(ensureArray(data));
               }
             }
         }
        return true;
    } catch(error) { console.error("Error updating comment:", error); return false; }
  };
  const deleteComment = async (commentId: string, itemType: Comment['itemType'], itemId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete comment.');
        const endpointMap = { sermon: 'sermons', event: 'events', blogPost: 'blogposts', news: 'newsitems', historyChapter: 'historychapters', prayerRequest: 'prayer-requests', testimonial: 'testimonials' };
        const endpoint = endpointMap[itemType as keyof typeof endpointMap];
         if(endpoint) {
            const res = await fetch(`${API_BASE_URL}/${endpoint}`);
            const data = await res.json();
            const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, blogPost: setBlogPosts, news: setNewsItems, historyChapter: setHistoryChapters, 'prayer-requests': setPrayerRequests, testimonials: setTestimonials };
            const setter = setterMap[endpoint.replace('-','')] || setterMap[endpoint];
            if (setter) {
              if (endpoint === 'sermons') {
                setter(normalizeSermonCollection(data));
              } else {
                setter(ensureArray(data));
              }
            }
        }
        return true;
    } catch (error) { console.error("Error deleting comment:", error); return false; }
  };
  const addDonationRecord = (data: Omit<DonationRecord, 'id' | 'transactionTimestamp' | 'postedByAdminId' | 'postedByAdminName' | 'createdAt' | 'updatedAt'>) => addContent('donation', data as DonationRecordFormData).then(res => res.newItem as DonationRecord || null);
  const addCollectionRecord = (data: CollectionRecordFormData) => addContent('collectionRecord', data).then(res => res.newItem as CollectionRecord || null);
  const addContactMessage = (data: Omit<ContactMessage, 'id' | 'submittedAt' | 'status' | 'repliedAt' | 'replyNote'>) => addContent('contactMessage', data as any).then(res => res.newItem as ContactMessage || null);
  const updateContactMessageStatus = async (id: string, status: 'replied' | 'pending', replyNote?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/contact-messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status, replyNote }),
      });
      if (!response.ok) throw new Error('Failed to update contact message');
      const updated = await response.json();
      setContactMessages(prev => prev.map(msg => msg.id === id ? updated : msg));
      logContentActivity(`contactMessage updated`, 'content_update', 'contactMessage', id);
      return true;
    } catch (error) {
      console.error('Error updating contact message status:', error);
      return false;
    }
  };
  const addMinistryJoinRequest = async (
    data: Omit<
      MinistryJoinRequest,
      | 'id'
      | 'requestDate'
      | 'status'
      | 'processedDate'
      | 'adminNotes'
      | 'userId'
      | 'userName'
      | 'userEmail'
      | 'membershipType'
      | 'ministryId'
      | 'ministryName'
      | 'ministryGuidelines'
    >,
    ministry: Ministry
  ) => {
    const result = await addContent('ministryJoinRequest', {
      ministryId: ministry.id,
      ministryName: ministry.title,
      ministryGuidelines: ministry.description || '',
      membershipType: 'member',
      ...data,
    } as any);
    const newItem = result.newItem as MinistryJoinRequest | undefined;
    if (newItem) {
      addNotification({
        targetUserId: 'admin_group',
        message: `New ministry join request from ${newItem.userName} for ${newItem.ministryName}.`,
        link: `/admin/ministry-join-requests?requestId=${newItem.id}`,
        type: 'ministry_request_update',
      });
    }
    return { request: newItem || null, message: result.message };
  };
  const updateMinistryJoinRequestStatus = async (id: string, status: MinistryJoinRequestStatus, adminNotes?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ministry-join-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          status,
          adminNotes,
          processedByAdminId: currentUser?.id,
          processedByAdminName: currentUser?.fullName,
        }),
      });
      const responseText = await response.text();
      let updated: MinistryJoinRequest | null = null;
      if (responseText) {
        try {
          updated = JSON.parse(responseText) as MinistryJoinRequest;
        } catch (parseError) {
          if (!response.ok) {
            throw parseError;
          }
        }
      }
      if (!response.ok) {
        const errorMessage = (updated as { error?: string } | null)?.error || responseText || 'Failed to update ministry join request';
        throw new Error(errorMessage);
      }
      if (updated) {
        setMinistryJoinRequests(prev => prev.map(req => req.id === id ? updated : req));
      }
      logContentActivity(`ministryJoinRequest updated`, 'content_update', 'ministryJoinRequest', id);
      if (updated?.userId) {
        addNotification({
          targetUserId: updated.userId,
          message: `Your ministry join request for ${updated.ministryName} was ${updated.status}.`,
          link: `/ministries/${updated.ministryId}`,
          type: 'ministry_request_update',
        });
      }     
      return true;
    } catch (error) {
      console.error('Error updating ministry join request status:', error);
      return false;
    }
  };
  const getMinistryJoinRequestsForUser = (userId: string) => ensureArray(ministryJoinRequests).filter(req => req.userId === userId);
  const addPrayerRequest = (data: PrayerRequestFormData) => addContent('prayerRequest', data).then(res => res.newItem as PrayerRequest || null);
  const addTestimonial = (data: TestimonialFormData) => addContent('testimonial', data).then(res => res.newItem as Testimonial || null);
  const toggleLikeOnItem = async (itemType: ContentType, itemId: string, isLiked: boolean) => {
  try {
    const action = isLiked ? 'unlike' : 'like';

    const payload: any = { action };

    // logged in user
    if (currentUser?.id) {
      payload.userId = currentUser.id;
      payload.userName = currentUser.fullName;
    } else {
      // OPTIONAL: if you support guest likes, pass guest fields from UI form
      // payload.guestName = guestName;
      // payload.guestEmail = guestEmail;
      // payload.guestPhone = guestPhone;
    }

    const response = await fetch(
      `${API_BASE_URL}/interactions/toggle-like/${itemType}/${itemId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      if (await handleBlockedResponse(response)) {
        return null;
      }
      throw new Error('Failed to toggle like');
    }

    const updated = await response.json();

    const setterMap: Record<string, Function> = {
      sermon: setSermons,
      event: setEvents,
      blogPost: setBlogPosts,
      news: setNewsItems,
      historyChapter: setHistoryChapters,
      prayerRequest: setPrayerRequests,
      testimonial: setTestimonials,
    };

    const setter = setterMap[itemType];
    if (setter) {
      setter((prev: any[]) =>
        ensureArray(prev).map(item => item.id === itemId ? { ...item, likes: updated.likes } : item)
      );
    }

    return updated;
  } catch {
    return null;
  }
};

  const togglePrayerOnRequest = async (
    requestId: string,
    guestContact?: { email?: string; phone?: string }
  ): Promise<boolean> => {
      try {
          if (!currentUser && !guestContact?.email && !guestContact?.phone) return false;
          const payload: Record<string, string> = {};
          if (currentUser) {
            payload.userId = currentUser.id;
            payload.userName = currentUser.fullName;
          } else if (guestContact?.email) {
            payload.guestEmail = guestContact.email;
          } else if (guestContact?.phone) {
            payload.guestPhone = guestContact.phone;
          }
          const response = await fetch(
            `${API_BASE_URL}/prayer-requests/${requestId}/toggle-prayer`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }
          );
          if (!response.ok) throw new Error('Failed to toggle prayer');
          const updatedRequest: PrayerRequest = await response.json();
          setPrayerRequests(prev => prev.map(p => p.id === requestId ? updatedRequest : p));
          return true;
      } catch (error) { return false; }
  };
  const updatePrayerRequestStatusByAdmin = async (id: string, status: PrayerRequestStatus, adminNotes?: string, moderationReason?: string): Promise<boolean> => {
      try {
          const response = await fetch(`${API_BASE_URL}/prayer-requests/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ status, adminNotes, moderationReason }) });
          if (!response.ok) throw new Error('Failed to update status');
          const updatedRequest = await response.json();
          setPrayerRequests(prev => prev.map(pr => pr.id === id ? updatedRequest : pr));
          return true;
      } catch (error) { return false; }
  };
  const updatePrayerRequestStatusByUser = async (id: string, status: PrayerRequestStatus): Promise<boolean> => {
      if(status !== 'answered' && status !== 'active') return false;
      const fallbackReason = isAdmin ? 'Status updated by administrator.' : undefined;
      return updatePrayerRequestStatusByAdmin(id, status, undefined, fallbackReason);
  };
 
  const updateGeneratedSchedule = async (id: string, data: Partial<GeneratedScheduleItem>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/fellowship-schedules/generated/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ...data, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update schedule draft');
      }
      const updated = normalizeGeneratedScheduleItem(await response.json());
      setGeneratedSchedules((prev) => prev.map((item) => item.id === id ? updated : item));
      logContentActivity(`schedule draft updated: "${updated.groupNameOrEventTitle}"`, 'schedule_draft_updated', 'generatedSchedule', id);
      return true;
    } catch (error) {
      console.error('Error updating schedule draft:', error);
      return false;
    }
  };

  const deleteGeneratedSchedule = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/fellowship-schedules/generated/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete schedule draft');
      }
      setGeneratedSchedules((prev) => ensureArray(prev).filter((item) => item.id !== id));
      logContentActivity(`schedule draft deleted: "${id}"`, 'schedule_draft_deleted', 'generatedSchedule', id);
      return true;
    } catch (error) {
      console.error('Error deleting schedule draft:', error);
      return false;
    }
  };

  const allDerivedMediaItems = useMemo<DisplayedMediaItem[]>(() => (
    directMediaItems.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.mediaType,
      url: item.url,
      thumbnailUrl: item.mediaType === 'image' ? item.url : undefined,
      category: item.category,
      date: item.uploadDate,
      sourceTitle: 'Admin Uploads',
      sourceLink: item.linkPath || '/media',
      sourceContentType: 'directMedia',
      description: item.description,
      tags: item.tags,
      postedByAdminName: item.postedByAdminName,
    }))
  ), [directMediaItems]);
 
  return (
    <ContentContext.Provider
      value={{	
        sermons: safeSermons, events, ministries, blogPosts, newsItems, aboutSections, keyPersons, historyMilestones, historyChapters, donationRecords, collectionRecords, contactMessages, branchChurches, directMediaItems, ministryJoinRequests, advertisements, prayerRequests, testimonials, donatePageContent,
        churchMembers, meetingLogs, decisionLogs, expenseRecords, fellowshipRosters, generatedSchedules,
        allDerivedMediaItems,
        loadingContent,
        addContent, updateContent, deleteContent, getContentById,
        contentActivityLogs, logContentActivity,
        addDonationRecord, addCollectionRecord, addContactMessage, updateContactMessageStatus,
        addMinistryJoinRequest, updateMinistryJoinRequestStatus, getMinistryJoinRequestsForUser,
        addPrayerRequest, updatePrayerRequestStatusByAdmin, updatePrayerRequestStatusByUser, togglePrayerOnRequest,
        addTestimonial, addCommentToItem, updateComment, deleteComment,
        generateNextSchedules: async () => [], updateGeneratedSchedule,
        deleteGeneratedSchedule, publishGeneratedScheduleToEvent: async () => null,
        toggleLikeOnItem,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};


  export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (context === undefined) throw new Error('useContent must be used within a ContentProvider');
  return context;
};
