import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react'; 
import {
  Sermon, EventItem, Ministry, BlogPost, AboutSection, KeyPerson, HistoryMilestone, CoreAboutSectionId, coreAboutSectionIds,
  Comment, NewsItem, DonatePageContent,
  ContentType, ContentItem,
  SermonFormData, EventFormData, MinistryFormData, BlogPostFormData,
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

const initialSampleDonatePageContent: DonatePageContent = {
  id: 'singleton',
  headerTitle: 'Support Our Mission',
  headerSubtitle: `"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Corinthians 9:7`,
  headerImageUrl: 'https://picsum.photos/seed/donateheader/1600/500',
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
    return storedData ? JSON.parse(storedData) : defaultValue;
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
  const { currentUser, isAdmin } = useAuth();
  const { addNotification } = useNotification();

  const [sermons, setSermons] = useState<Sermon[]>(() => getStoredData('bem_sermons', []));
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
  const [donatePageContent, setDonatePageContent] = useState<DonatePageContent>(() => getStoredData('bem_donatePageContent', initialSampleDonatePageContent));

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
  
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentActivityLogs, setContentActivityLogs] = useState<FrontendActivityLog[]>(() => getStoredData('bem_content_activity_logs', []));
  const contentRef = useRef({
    directMediaItems: [] as DirectMediaItem[],
    sermons: [] as Sermon[],
    events: [] as EventItem[],
    ministries: [] as Ministry[],
    blogPosts: [] as BlogPost[],
    newsItems: [] as NewsItem[],
    aboutSections: [] as AboutSection[],
    keyPersons: [] as KeyPerson[],
    historyMilestones: [] as HistoryMilestone[],
    historyChapters: [] as HistoryChapter[],
    branchChurches: [] as BranchChurch[],
    prayerRequests: [] as PrayerRequest[],
    testimonials: [] as Testimonial[],
    contactMessages: [] as ContactMessage[],
    donationRecords: [] as DonationRecord[],
    collectionRecords: [] as CollectionRecord[],
    ministryJoinRequests: [] as MinistryJoinRequest[],
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
    { key: 'collection-records', setter: setCollectionRecords, storageKey: 'bem_collectionRecords', getCurrent: () => contentRef.current.collectionRecords },
    { key: 'ministry-join-requests', setter: setMinistryJoinRequests, storageKey: 'bem_ministryJoinRequests', getCurrent: () => contentRef.current.ministryJoinRequests },
  ]), []);

  const fetchContentBatch = useCallback(async (setLoading: boolean) => {
    const fetchPromises = dataFetchConfig.map(async (config) => {
      const hasExistingContent = Array.isArray(config.getCurrent?.())
        ? (config.getCurrent?.() as any[]).length > 0
        : false;

      if (!navigator.onLine) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/${config.key}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`${config.key} fetch failed`);
        const data = await response.json();
        const hasServerContent = Array.isArray(data) ? data.length > 0 : !!data;

        if (!hasServerContent) {
          if (hasExistingContent) {
            console.warn(`Skipped overwriting ${config.key} with empty server response to preserve existing content.`);
            return;
          }

        }

        config.setter(data);
        if (config.storageKey) saveStoredData(config.storageKey, data);
      } catch (error) {
        console.error(`Failed to load ${config.key}:`, error);
      }
    });

    if (setLoading) setLoadingContent(true);
    await Promise.all(fetchPromises).finally(() => {
      if (setLoading) setLoadingContent(false);
    });
  }, [dataFetchConfig]);

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
    const fallbackTimestamp = new Date().toISOString();
    const { items, updated } = normalizeHomepageDates(sermons, fallbackTimestamp);
    if (updated) setSermons(items);
  }, [sermons]);

  useEffect(() => {
    const fallbackTimestamp = new Date().toISOString();
    const { items, updated } = normalizeHomepageDates(events, fallbackTimestamp);
    if (updated) setEvents(items);
  }, [events]);

  useEffect(() => {
    const fallbackTimestamp = new Date().toISOString();
    const { items, updated } = normalizeHomepageDates(blogPosts, fallbackTimestamp);
    if (updated) setBlogPosts(items);
  }, [blogPosts]);

  useEffect(() => {
    const fallbackTimestamp = new Date().toISOString();
    const { items, updated } = normalizeHomepageDates(newsItems, fallbackTimestamp);
    if (updated) setNewsItems(items);
  }, [newsItems]);

  useEffect(() => {
    const fallbackTimestamp = new Date().toISOString();
    const { items, updated } = normalizeHomepageDates(prayerRequests, fallbackTimestamp);
    if (updated) setPrayerRequests(items);
  }, [prayerRequests]);

  useEffect(() => {
    const fallbackTimestamp = new Date().toISOString();
    const { items, updated } = normalizeHomepageDates(testimonials, fallbackTimestamp);
    if (updated) setTestimonials(items);
  }, [testimonials]);

  useEffect(() => { contentRef.current.sermons = sermons; saveStoredData('bem_sermons', sermons); }, [sermons]);
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
  useEffect(() => { saveStoredData('bem_donatePageContent', donatePageContent); }, [donatePageContent]);
  useEffect(() => { saveStoredData('bem_fellowshipRosters', fellowshipRosters); }, [fellowshipRosters]);
  useEffect(() => { saveStoredData('bem_generatedSchedules', generatedSchedules); }, [generatedSchedules]);
  useEffect(() => { saveStoredData('bem_advertisements', advertisements); }, [advertisements]);
  useEffect(() => { saveStoredData('bem_churchMembers', churchMembers); }, [churchMembers]);
  useEffect(() => { saveStoredData('bem_meetingLogs', meetingLogs); }, [meetingLogs]);
  useEffect(() => { saveStoredData('bem_decisionLogs', decisionLogs); }, [decisionLogs]);
  useEffect(() => { saveStoredData('bem_expenseRecords', expenseRecords); }, [expenseRecords]);
  useEffect(() => { saveStoredData('bem_content_activity_logs', contentActivityLogs); }, [contentActivityLogs]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('bem_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };


  const logContentActivity = useCallback((description: string, type: FrontendActivityLog['type'], itemType?: FrontendActivityLog['itemType'], itemId?: string) => {
    const newLog: FrontendActivityLog = { id: `content-log-${Date.now()}`, timestamp: new Date().toISOString(), userId: currentUser?.id, description, type, itemType, itemId };
    setContentActivityLogs(prevLogs => [newLog, ...prevLogs.slice(0, 99)]);
  }, [currentUser]);

  const addContent = async (type: ContentType, data: GenericContentFormData): Promise<{ success: boolean; newItem?: ContentItem; message?: string }> => {
    const allowedForNonAdmins: ContentType[] = ['contactMessage', 'ministryJoinRequest'];
    if (!isAdmin && !allowedForNonAdmins.includes(type)) {
        return { success: false, message: 'Only administrators can create this type of content.' };
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
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ ...normalizedData, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName, userId: currentUser?.id, userName: currentUser?.fullName, userProfileImageUrl: currentUser?.profileImageUrl }) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `Failed to create ${type}`); }
            const newItem: ContentItem = await response.json();
            const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, ministry: setMinistries, blogPost: setBlogPosts, news: setNewsItems, aboutSection: setAboutSections, keyPerson: setKeyPersons, historyMilestone: setHistoryMilestones, historyChapter: setHistoryChapters, branchChurch: setBranchChurches, directMedia: setDirectMediaItems, prayerRequest: setPrayerRequests, testimonial: setTestimonials, donation: setDonationRecords, collectionRecord: setCollectionRecords, ministryJoinRequest: setMinistryJoinRequests };
            const setter = setterMap[type];
            if (setter) setter((prev: any[]) => [newItem, ...prev]);
            logContentActivity(`${type} created: "${(newItem as any).title || (newItem as any).name}"`, 'content_creation', type, newItem.id);
            return { success: true, newItem: newItem };
        } catch (error) {
          console.error(`Error adding ${type}:`, error);
          return { success: false, message: `Failed to create ${type}. Please try again.` };
        }
    }
    let newItem: ContentItem | null = null;
    let success = false;
    let message = 'An unknown error occurred.';
    switch (type) {
      case 'sermon': {
        const formData = normalizedData as SermonFormData;
        const newSermon: Sermon = {
          id: newItemId,
          title: formData.title,
          description: formData.description,
          imageUrl: formData.imageUrl,
          linkPath: formData.linkPath || `/sermons/${newItemId}`,
          category: formData.category,
          date: formData.date,
          incidentAt: formData.incidentAt || formData.date,
          publishedAt: formData.publishedAt || timestamp,
          speaker: formData.speaker,
          scripture: formData.scripture,
          videoUrl: formData.videoUrl,
          audioUrl: formData.audioUrl,
          fullContent: formData.fullContent,
          postedByAdminId: currentUser?.id,
          postedByAdminName: currentUser?.fullName,
          createdAt: timestamp,
          updatedAt: timestamp,
          likes: 0,
          comments: [],
        };
        setSermons((prev) => [newSermon, ...prev]);
        newItem = newSermon;
        success = true;
        break;
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
      case 'expenseRecord': { const formData = data as ExpenseRecordFormData; const newRecord: ExpenseRecord = { id: newItemId, ...formData, amount: Number(formData.amount), createdAt: timestamp, updatedAt: timestamp, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName }; setExpenseRecords(prev => [newRecord, ...prev]); newItem = newRecord; success = true; break; }
      case 'fellowshipRoster': { const newRoster: FellowshipRosterItem = { id: newItemId, ...(data as FellowshipRosterFormData), linkPath: `/fellowship-program/roster/${newItemId}`, createdAt: timestamp, updatedAt: timestamp, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName }; setFellowshipRosters(prev => [newRoster, ...prev]); newItem = newRoster; success = true; break; }
      case 'advertisement': { const newAd: Advertisement = { id: newItemId, ...(data as AdvertisementFormData), createdAt: timestamp, updatedAt: timestamp, postedByAdminId: currentUser?.id, postedByAdminName: currentUser?.fullName }; setAdvertisements(prev => [newAd, ...prev]); newItem = newAd; success = true; break; }
      }
    if (success && newItem) logContentActivity(`${type} created: "${(newItem as any).title || (newItem as any).name}"`, 'content_creation', type, newItemId);
    return { success, newItem: newItem || undefined, message: success ? 'Content added successfully.' : message };
  };

  const updateContent = async (type: ContentType, id: string, data: GenericContentFormData): Promise<{ success: boolean; updatedItem?: ContentItem; message?: string }> => {
    const contentTypeToEndpoint: Partial<Record<ContentType, string>> =
 { sermon: 'sermons', event: 'events', ministry: 'ministries', blogPost: 'blogposts', news: 'newsitems', aboutSection: 'aboutsections',
 keyPerson: 'keypersons', historyMilestone: 'historymilestones', historyChapter: 'historychapters', branchChurch: 'branchchurches',
 directMedia: 'direct-media', prayerRequest: 'prayer-requests', testimonial: 'timonials',
 donation: 'donation-records', collectionRecord: 'collection-records', contactMessage: 'contact-messages',
 ministryJoinRequest: 'ministry-join-requests' };
    const endpoint = contentTypeToEndpoint[type];
    if (endpoint) {
        try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to update ${type}`);
        }
        const updatedItem: ContentItem = await response.json();
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
        };
        const setter = setterMap[type];
        if (setter) setter((prev: any[]) => prev.map(item => item.id === id ? updatedItem : item));
        logContentActivity(
          `${type} updated: "${(updatedItem as any).title || (updatedItem as any).name}"`,
          'content_update',
          type,
          id,
        );
        return { success: true, updatedItem };
      } catch (error) {
        console.error(`Error updating ${type}:`, error);
        return { success: false, message: `Failed to update ${type}. Please try again.` };
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
        case 'donatePageContent':
            const updatedPageContent = { ...donatePageContent, ...(data as DonatePageContentFormData), updatedAt: timestamp };
            setDonatePageContent(updatedPageContent); updatedItem = updatedPageContent; success = true; message = 'Donate page updated successfully.';
            logContentActivity(`Donate page content updated`, 'content_update', 'donatePageContent', 'singleton');
            break;
        default: return { success: false, message: "Content type not found for update." };
    }
    return { success, updatedItem, message };
  }

  const deleteContent = async (type: ContentType, id: string): Promise<boolean> => {
    const contentTypeToEndpoint: Partial<Record<ContentType, string>> = { sermon: 'sermons', event: 'events', ministry: 'ministries', blogPost: 'blogposts', news: 'newsitems', aboutSection: 'aboutsections', keyPerson: 'keypersons', historyMilestone: 'historymilestones', historyChapter: 'historychapters', branchChurch: 'branchchurches', directMedia: 'direct-media', prayerRequest: 'prayer-requests', testimonial: 'testimonials', donation: 'donation-records', collectionRecord: 'collection-records', ministryJoinRequest: 'ministry-join-requests', contactMessage: 'contact-messages' };
    const endpoint = contentTypeToEndpoint[type];
    if (endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!response.ok && response.status !== 204) throw new Error(`Failed to delete ${type} from server`);
            const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, ministry: setMinistries, blogPost: setBlogPosts, news: setNewsItems, aboutSection: setAboutSections, keyPerson: setKeyPersons, historyMilestone: setHistoryMilestones, historyChapter: setHistoryChapters, branchChurch: setBranchChurches, directMedia: setDirectMediaItems, prayerRequest: setPrayerRequests, testimonial: setTestimonials, donation: setDonationRecords, collectionRecord: setCollectionRecords, ministryJoinRequest: setMinistryJoinRequests };
            const setter = setterMap[type];
            if(setter) setter((prev: any[]) => prev.filter(item => item.id !== id));
            logContentActivity(`${type} with ID ${id} deleted`, 'content_deletion', type, id);
            return true;
        } catch (error) {
          console.error(`Error deleting ${type}:`, error);
          return false;
        }
    }
     let success = false;
     const deleteAndLog = <T extends ContentItem>(setState: React.Dispatch<React.SetStateAction<T[]>>): boolean => { let itemTitle = 'Unknown'; setState(prevItems => { const itemToDelete = prevItems.find(item => item.id === id); if (itemToDelete) itemTitle = (itemToDelete as any).title || (itemToDelete as any).name || itemToDelete.id; return prevItems.filter(item => item.id !== id); }); logContentActivity(`${type} deleted: "${itemTitle}"`, 'content_deletion', type, id); return true; };
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
    const allContentArrays = [ sermons, events, ministries, blogPosts, newsItems, aboutSections, keyPersons, historyMilestones, historyChapters, branchChurches, directMediaItems, churchMembers, meetingLogs, decisionLogs, expenseRecords, collectionRecords, fellowshipRosters, generatedSchedules, advertisements, prayerRequests, testimonials, donationRecords ];
    if (type === 'donatePageContent' && id === 'singleton') return donatePageContent;
    for (const contentArray of allContentArrays) { const item = (contentArray as ContentItem[]).find(item => item.id === id); if (item) return item; }
    return undefined;
  };
  const addCommentToItem = async (itemId: string, itemType: Comment['itemType'], commentText: string): Promise<Comment | null> => {
    if (!currentUser) { alert("You must be logged in to comment."); return null; }
    try {
        const response = await fetch(`${API_BASE_URL}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemType, itemId, text: commentText, userId: currentUser.id, userName: currentUser.fullName, userProfileImageUrl: currentUser.profileImageUrl }) });
        if (!response.ok) throw new Error('Failed to post comment.');
        const newComment: Comment = await response.json();
        const endpointMap = { sermon: 'sermons', event: 'events', blogPost: 'blogposts', news: 'newsitems', historyChapter: 'historychapters', prayerRequest: 'prayer-requests' };
        const endpoint = endpointMap[itemType as keyof typeof endpointMap];
         if(endpoint) {
             const res = await fetch(`${API_BASE_URL}/${endpoint}`);
             const data = await res.json();
             const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, blogPost: setBlogPosts, news: setNewsItems, historyChapter: setHistoryChapters, 'prayer-requests': setPrayerRequests };
             const setter = setterMap[endpoint.replace('-','')] || setterMap[endpoint];
             if(setter) setter(data);
         }
        logContentActivity(`Commented on ${itemType}: ${itemId}`, `${itemType}_comment_added` as any, 'comment', newComment.id);
        return newComment;
    } catch (error) { console.error("Error adding comment:", error); return null; }
  };
  const updateComment = async (commentId: string, newText: string, itemType: Comment['itemType'], itemId: string): Promise<boolean> => {
    try {
         const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newText }) });
        if (!response.ok) throw new Error('Failed to update comment.');
        const endpointMap = { sermon: 'sermons', event: 'events', blogPost: 'blogposts', news: 'newsitems', historyChapter: 'historychapters', prayerRequest: 'prayer-requests' };
        const endpoint = endpointMap[itemType as keyof typeof endpointMap];
         if(endpoint) {
             const res = await fetch(`${API_BASE_URL}/${endpoint}`);
             const data = await res.json();
             const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, blogPost: setBlogPosts, news: setNewsItems, historyChapter: setHistoryChapters, 'prayer-requests': setPrayerRequests };
             const setter = setterMap[endpoint.replace('-','')] || setterMap[endpoint];
             if(setter) setter(data);
         }
        return true;
    } catch(error) { console.error("Error updating comment:", error); return false; }
  };
  const deleteComment = async (commentId: string, itemType: Comment['itemType'], itemId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete comment.');
        const endpointMap = { sermon: 'sermons', event: 'events', blogPost: 'blogposts', news: 'newsitems', historyChapter: 'historychapters', prayerRequest: 'prayer-requests' };
        const endpoint = endpointMap[itemType as keyof typeof endpointMap];
         if(endpoint) {
             const res = await fetch(`${API_BASE_URL}/${endpoint}`);
             const data = await res.json();
             const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, blogPost: setBlogPosts, news: setNewsItems, historyChapter: setHistoryChapters, 'prayer-requests': setPrayerRequests };
             const setter = setterMap[endpoint.replace('-','')] || setterMap[endpoint];
             if(setter) setter(data);
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
  const addMinistryJoinRequest = (data: Omit<MinistryJoinRequest, 'id' | 'requestDate' | 'status' | 'processedDate' | 'adminNotes' | 'userId' | 'userName' | 'userEmail' | 'membershipType' | 'ministryId' | 'ministryName' | 'ministryGuidelines'>, ministry: Ministry) => addContent('ministryJoinRequest', { ministryId: ministry.id, ministryName: ministry.title, ...data } as any).then(res => res.newItem as MinistryJoinRequest || null);
  const updateMinistryJoinRequestStatus = async (id: string, status: MinistryJoinRequestStatus, adminNotes?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ministry-join-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to update ministry join request');
      const updated = await response.json();
      setMinistryJoinRequests(prev => prev.map(req => req.id === id ? updated : req));
      logContentActivity(`ministryJoinRequest updated`, 'content_update', 'ministryJoinRequest', id);
      return true;
    } catch (error) {
      console.error('Error updating ministry join request status:', error);
      return false;
    }
  };
  const getMinistryJoinRequestsForUser = (userId: string) => ministryJoinRequests.filter(req => req.userId === userId);
  const addPrayerRequest = (data: PrayerRequestFormData) => addContent('prayerRequest', data).then(res => res.newItem as PrayerRequest || null);
  const addTestimonial = (data: TestimonialFormData) => addContent('testimonial', data).then(res => res.newItem as Testimonial || null);
  const toggleLikeOnItem = async (itemType: ContentType, itemId: string, isLiked: boolean): Promise<ContentItem | null> => {
      try {
          const action = isLiked ? 'unlike' : 'like';
          const response = await fetch(`${API_BASE_URL}/interactions/toggle-like/${itemType}/${itemId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
          if (!response.ok) throw new Error('Failed to toggle like');
          const updatedItem = await response.json();
          const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, blogPost: setBlogPosts, news: setNewsItems, historyChapter: setHistoryChapters };
          const setter = setterMap[itemType];
          if (setter) setter((prev: any[]) => prev.map(item => item.id === itemId ? { ...item, likes: updatedItem.likes } : item));
          return updatedItem;
      } catch (error) { return null; }
  };
  const togglePrayerOnRequest = async (requestId: string): Promise<boolean> => {
      if (!currentUser) return false;
      try {
          const response = await fetch(`${API_BASE_URL}/prayer-requests/${requestId}/toggle-prayer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, userName: currentUser.fullName }), });
          if (!response.ok) throw new Error('Failed to toggle prayer');
          const updatedRequest: PrayerRequest = await response.json();
          setPrayerRequests(prev => prev.map(p => p.id === requestId ? updatedRequest : p));
          return true;
      } catch (error) { return false; }
  };
  const updatePrayerRequestStatusByAdmin = async (id: string, status: PrayerRequestStatus, adminNotes?: string): Promise<boolean> => {
      try {
          const response = await fetch(`${API_BASE_URL}/prayer-requests/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ status, adminNotes }) });
          if (!response.ok) throw new Error('Failed to update status');
          const updatedRequest = await response.json();
          setPrayerRequests(prev => prev.map(pr => pr.id === id ? updatedRequest : pr));
          return true;
      } catch (error) { return false; }
  };
  const updatePrayerRequestStatusByUser = async (id: string, status: PrayerRequestStatus): Promise<boolean> => {
      if(status !== 'answered' && status !== 'active') return false;
      return updatePrayerRequestStatusByAdmin(id, status);
  };
   return (
    <ContentContext.Provider
      value={{	
        sermons, events, ministries, blogPosts, newsItems, aboutSections, keyPersons, historyMilestones, historyChapters, donationRecords, collectionRecords, contactMessages, branchChurches, directMediaItems, ministryJoinRequests, advertisements, prayerRequests, testimonials, donatePageContent,
        churchMembers, meetingLogs, decisionLogs, expenseRecords, fellowshipRosters, generatedSchedules,
        allDerivedMediaItems: [],
        loadingContent,
        addContent, updateContent, deleteContent, getContentById,
        contentActivityLogs, logContentActivity,
        addDonationRecord, addCollectionRecord, addContactMessage, updateContactMessageStatus,
        addMinistryJoinRequest, updateMinistryJoinRequestStatus, getMinistryJoinRequestsForUser,
        addPrayerRequest, updatePrayerRequestStatusByAdmin, updatePrayerRequestStatusByUser, togglePrayerOnRequest,
        addTestimonial, addCommentToItem, updateComment, deleteComment,
        generateNextSchedules: async () => [], updateGeneratedSchedule: async () => false,
        deleteGeneratedSchedule: async () => false, publishGeneratedScheduleToEvent: async () => null,
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
