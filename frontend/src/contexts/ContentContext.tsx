import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  Sermon, EventItem, Ministry, BlogPost, HomeSlide, AboutSection, KeyPerson, HistoryMilestone, CoreAboutSectionId, coreAboutSectionIds,
  Comment, NewsItem, DonatePageContent, Group, GroupMember,
  ContentType, ContentItem,
  SermonFormData, EventFormData, MinistryFormData, BlogPostFormData, HomeSlideFormData,
  NewsItemFormData, DonatePageContentFormData, GroupFormData,
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
  MonthlyThemeImage, MonthlyThemeImageFormData,
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

const ownerId = '0';
const ownerName = 'Shahid Singh';

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
const initialGroups: Group[] = [
    {
        id: 'group-1', name: 'Saturday Main Fellowship Coordinators', creatorId: '0', 
        members: [{userId: '0', role: 'admin', addedAt: '2024-07-30T10:00:00Z'}, {userId: '1', role: 'admin', addedAt: '2024-07-30T10:00:00Z'}, {userId: '2', role: 'member', addedAt: '2024-07-30T10:00:00Z'}], 
        createdAt: '2024-07-30T10:00:00Z', updatedAt: '2024-07-30T10:00:00Z', linkPath: '/chat/group-1', 
        groupImageUrl: 'https://picsum.photos/seed/group1/100/100'
    },
];

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


const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const { addNotification } = useNotification();

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [homeSlides, setHomeSlides] = useState<HomeSlide[]>([]);
  const [aboutSections, setAboutSections] = useState<AboutSection[]>([]);
  const [keyPersons, setKeyPersons] = useState<KeyPerson[]>([]);
  const [historyMilestones, setHistoryMilestones] = useState<HistoryMilestone[]>([]);
  const [historyChapters, setHistoryChapters] = useState<HistoryChapter[]>([]);
  const [branchChurches, setBranchChurches] = useState<BranchChurch[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  const [directMediaItems, setDirectMediaItems] = useState<DirectMediaItem[]>(() => getStoredData('bem_directMediaItems', []));
  const [donatePageContent, setDonatePageContent] = useState<DonatePageContent>(() => getStoredData('bem_donatePageContent', initialSampleDonatePageContent));

  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>([]);
  const [collectionRecords, setCollectionRecords] = useState<CollectionRecord[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [ministryJoinRequests, setMinistryJoinRequests] = useState<MinistryJoinRequest[]>([]);
  const [monthlyThemeImages, setMonthlyThemeImages] = useState<MonthlyThemeImage[]>(() => getStoredData('bem_monthlyThemeImages', []));
  const [fellowshipRosters, setFellowshipRosters] = useState<FellowshipRosterItem[]>(() => getStoredData('bem_fellowshipRosters', []));
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedScheduleItem[]>(() => getStoredData('bem_generatedSchedules', []));
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(() => getStoredData('bem_advertisements', []));
  const [groups, setGroups] = useState<Group[]>(() => getStoredData('bem_groups', initialGroups));

  const [churchMembers, setChurchMembers] = useState<ChurchMember[]>(() => getStoredData('bem_churchMembers', []));
  const [meetingLogs, setMeetingLogs] = useState<MeetingLog[]>(() => getStoredData('bem_meetingLogs', []));
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>(() => getStoredData('bem_decisionLogs', []));
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>(() => getStoredData('bem_expenseRecords', []));
  
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentActivityLogs, setContentActivityLogs] = useState<FrontendActivityLog[]>(() => getStoredData('bem_content_activity_logs', []));

  useEffect(() => {
    setLoadingContent(true);
    const dataFetchConfig = [
        { key: 'sermons', setter: setSermons },
        { key: 'events', setter: setEvents },
        { key: 'ministries', setter: setMinistries },
        { key: 'blogposts', setter: setBlogPosts },
        { key: 'newsitems', setter: setNewsItems },
        { key: 'homeslides', setter: setHomeSlides },
        { key: 'aboutsections', setter: setAboutSections },
        { key: 'keypersons', setter: setKeyPersons },
        { key: 'historymilestones', setter: setHistoryMilestones },
        { key: 'historychapters', setter: setHistoryChapters },
        { key: 'branchchurches', setter: setBranchChurches },
        { key: 'prayer-requests', setter: setPrayerRequests },
        { key: 'testimonials', setter: setTestimonials },
        { key: 'contact-messages', setter: setContactMessages },
        { key: 'donation-records', setter: setDonationRecords },
        { key: 'collection-records', setter: setCollectionRecords },
        { key: 'ministry-join-requests', setter: setMinistryJoinRequests },
    ];
    const fetchPromises = dataFetchConfig.map(config =>
        fetch(`${API_BASE_URL}/${config.key}`)
            .then(res => res.ok ? res.json() : Promise.reject(`${config.key} fetch failed`))
            .then(data => config.setter(data))
            .catch(error => console.error(`Failed to load ${config.key}:`, error))
    );
    Promise.all(fetchPromises).finally(() => setLoadingContent(false));
  }, []);
  
  useEffect(() => { saveStoredData('bem_directMediaItems', directMediaItems); }, [directMediaItems]);
  useEffect(() => { saveStoredData('bem_donatePageContent', donatePageContent); }, [donatePageContent]);
  // Local storage persistence removed for DB-backed data
  useEffect(() => { saveStoredData('bem_monthlyThemeImages', monthlyThemeImages); }, [monthlyThemeImages]);
  useEffect(() => { saveStoredData('bem_fellowshipRosters', fellowshipRosters); }, [fellowshipRosters]);
  useEffect(() => { saveStoredData('bem_generatedSchedules', generatedSchedules); }, [generatedSchedules]);
  useEffect(() => { saveStoredData('bem_advertisements', advertisements); }, [advertisements]);
  useEffect(() => { saveStoredData('bem_groups', groups); }, [groups]);
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
        sermon: 'sermons', event: 'events', ministry: 'ministries', blogPost: 'blogposts', news: 'newsitems', homeSlide: 'homeslides',
        aboutSection: 'aboutsections', keyPerson: 'keypersons', historyMilestone: 'historymilestones', historyChapter: 'historychapters',
        branchChurch: 'branchchurches', prayerRequest: 'prayer-requests', testimonial: 'testimonials', donation: 'donation-records',
        collectionRecord: 'collection-records', ministryJoinRequest: 'ministry-join-requests', contactMessage: 'contact-messages'
    };
    const endpoint = contentTypeToEndpoint[type];
    if (endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ ...data, postedByOwnerId: currentUser?.id, postedByOwnerName: currentUser?.fullName, userId: currentUser?.id, userName: currentUser?.fullName, userProfileImageUrl: currentUser?.profileImageUrl }) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `Failed to create ${type}`); }
            const newItem: ContentItem = await response.json();
            const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, ministry: setMinistries, blogPost: setBlogPosts, news: setNewsItems, homeSlide: setHomeSlides, aboutSection: setAboutSections, keyPerson: setKeyPersons, historyMilestone: setHistoryMilestones, historyChapter: setHistoryChapters, branchChurch: setBranchChurches, prayerRequest: setPrayerRequests, testimonial: setTestimonials, donation: setDonationRecords, collectionRecord: setCollectionRecords, ministryJoinRequest: setMinistryJoinRequests };
            const setter = setterMap[type];
            if (setter) setter((prev: any[]) => [newItem, ...prev]);
            logContentActivity(`${type} created: "${(newItem as any).title || (newItem as any).name}"`, 'content_creation', type, newItem.id);
            return { success: true, newItem: newItem };
        } catch (error) { console.error(`Error adding ${type}:`, error); return { success: false, message: (error as Error).message }; }
    }
    const newItemId = `${type}-${Date.now()}`;
    const timestamp = new Date().toISOString();
    let newItem: ContentItem | null = null;
    let success = false;
    let message = 'An unknown error occurred.';
    switch (type) {
      case 'directMedia': { const formData = data as DirectMediaFormData; const newMedia: DirectMediaItem = { id: newItemId, title: formData.title, description: formData.description, url: formData.url, mediaType: formData.mediaType, category: formData.uploadCategory, tags: formData.tagsString?.split(',').map(t => t.trim()).filter(Boolean) || [], uploadDate: timestamp, linkPath: `/media`, postedByOwnerId: currentUser?.id, postedByOwnerName: currentUser?.fullName, updatedAt: timestamp, }; setDirectMediaItems(prev => [newMedia, ...prev]); newItem = newMedia; success = true; break; }
      case 'churchMember': { const newMember: ChurchMember = { id: newItemId, ...(data as ChurchMemberFormData), createdAt: timestamp, updatedAt: timestamp, postedByOwnerId: currentUser?.id, postedByOwnerName: currentUser?.fullName }; setChurchMembers(prev => [newMember, ...prev]); newItem = newMember; success = true; break; }
      case 'meetingLog': { const newLog: MeetingLog = { id: newItemId, ...(data as MeetingLogFormData), createdAt: timestamp, updatedAt: timestamp, postedByOwnerId: currentUser?.id, postedByOwnerName: currentUser?.fullName }; setMeetingLogs(prev => [newLog, ...prev]); newItem = newLog; success = true; break; }
      case 'decisionLog': { const newLog: DecisionLog = { id: newItemId, ...(data as DecisionLogFormData), createdAt: timestamp, updatedAt: timestamp, postedByOwnerId: currentUser?.id, postedByOwnerName: currentUser?.fullName }; setDecisionLogs(prev => [newLog, ...prev]); newItem = newLog; success = true; break; }
      case 'expenseRecord': { const formData = data as ExpenseRecordFormData; const newRecord: ExpenseRecord = { id: newItemId, ...formData, amount: Number(formData.amount), createdAt: timestamp, updatedAt: timestamp, postedByOwnerId: currentUser?.id, postedByOwnerName: currentUser?.fullName }; setExpenseRecords(prev => [newRecord, ...prev]); newItem = newRecord; success = true; break; }
      case 'monthlyThemeImage': { const formData = data as MonthlyThemeImageFormData; const existing = monthlyThemeImages.find(img => img.year === formData.year && img.month === formData.month); if (existing) { return { success: false, message: 'A theme for this month and year already exists. Please edit it instead.' }; } const newImage: MonthlyThemeImage = { id: newItemId, year: formData.year, month: formData.month, imageUrls: formData.imageUrlsString.split(',').map(s => s.trim()).filter(Boolean), quoteOrCaption: formData.quoteOrCaption, createdAt: timestamp, updatedAt: timestamp, postedByOwnerId: currentUser?.id, postedByOwnerName: currentUser?.fullName }; setMonthlyThemeImages(prev => [newImage, ...prev]); newItem = newImage; success = true; break; }
      case 'fellowshipRoster': { const newRoster: FellowshipRosterItem = { id: newItemId, ...(data as FellowshipRosterFormData), linkPath: `/fellowship-program/roster/${newItemId}`, createdAt: timestamp, updatedAt: timestamp, postedByOwnerId: currentUser?.id, postedByOwnerName: currentUser?.fullName }; setFellowshipRosters(prev => [newRoster, ...prev]); newItem = newRoster; success = true; break; }
      case 'advertisement': { const newAd: Advertisement = { id: newItemId, ...(data as AdvertisementFormData), createdAt: timestamp, updatedAt: timestamp, postedByOwnerId: currentUser?.id, postedByOwnerName: currentUser?.fullName }; setAdvertisements(prev => [newAd, ...prev]); newItem = newAd; success = true; break; }
      case 'group': { if (!currentUser) return { success: false, message: "User not logged in." }; const formData = data as GroupFormData; const newGroup: Group = { id: `group-${Date.now()}`, name: formData.name, creatorId: currentUser.id, groupImageUrl: formData.groupImageUrl, members: [ { userId: currentUser.id, role: 'admin', addedAt: timestamp }, ...formData.memberIds.map(id => ({ userId: id, role: 'member' as const, addedAt: timestamp })) ], createdAt: timestamp, updatedAt: timestamp, postedByOwnerId: currentUser.id, postedByOwnerName: currentUser.fullName, linkPath: `/chat/group-${Date.now()}`, permissions: formData.permissions, }; setGroups(prev => [newGroup, ...prev]); newItem = newGroup; success = true; break; }
    }
    if (success && newItem) logContentActivity(`${type} created: "${(newItem as any).title || (newItem as any).name}"`, 'content_creation', type, newItemId);
    return { success, newItem: newItem || undefined, message: success ? 'Content added successfully.' : message };
  };

  const updateContent = async (type: ContentType, id: string, data: GenericContentFormData): Promise<{ success: boolean; updatedItem?: ContentItem; message?: string }> => {
    const contentTypeToEndpoint: Partial<Record<ContentType, string>> = { sermon: 'sermons', event: 'events', ministry: 'ministries', blogPost: 'blogposts', news: 'newsitems', homeSlide: 'homeslides', aboutSection: 'aboutsections', keyPerson: 'keypersons', historyMilestone: 'historymilestones', historyChapter: 'historychapters', branchChurch: 'branchchurches', prayerRequest: 'prayer-requests', testimonial: 'testimonials', donation: 'donation-records', collectionRecord: 'collection-records', contactMessage: 'contact-messages', ministryJoinRequest: 'ministry-join-requests' };
    const endpoint = contentTypeToEndpoint[type];
    if (endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `Failed to update ${type}`); }
            const updatedItem: ContentItem = await response.json();
            const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, ministry: setMinistries, blogPost: setBlogPosts, news: setNewsItems, homeSlide: setHomeSlides, aboutSection: setAboutSections, keyPerson: setKeyPersons, historyMilestone: setHistoryMilestones, historyChapter: setHistoryChapters, branchChurch: setBranchChurches, prayerRequest: setPrayerRequests, testimonial: setTestimonials, donation: setDonationRecords, collectionRecord: setCollectionRecords };
            const setter = setterMap[type];
            if(setter) setter((prev: any[]) => prev.map(item => item.id === id ? updatedItem : item));
            logContentActivity(`${type} updated: "${(updatedItem as any).title || (updatedItem as any).name}"`, 'content_update', type, id);
            return { success: true, updatedItem };
        } catch (error) { console.error(`Error updating ${type}:`, error); return { success: false, message: (error as Error).message }; }
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
        case 'monthlyThemeImage': { const result = updateAndLog<MonthlyThemeImage>(setMonthlyThemeImages, { ...(data as any), imageUrls: (data as MonthlyThemeImageFormData).imageUrlsString.split(',').map(s => s.trim()).filter(Boolean) }); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        case 'fellowshipRoster': { const result = updateAndLog<FellowshipRosterItem>(setFellowshipRosters, data as any); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        case 'advertisement': { const result = updateAndLog<Advertisement>(setAdvertisements, data as any); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
        case 'group': { const result = updateAndLog<Group>(setGroups, data as any); success = result.success; updatedItem = result.updatedItem; message = result.message!; break; }
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
    const contentTypeToEndpoint: Partial<Record<ContentType, string>> = { sermon: 'sermons', event: 'events', ministry: 'ministries', blogPost: 'blogposts', news: 'newsitems', homeSlide: 'homeslides', aboutSection: 'aboutsections', keyPerson: 'keypersons', historyMilestone: 'historymilestones', historyChapter: 'historychapters', branchChurch: 'branchchurches', prayerRequest: 'prayer-requests', testimonial: 'testimonials', donation: 'donation-records', collectionRecord: 'collection-records', ministryJoinRequest: 'ministry-join-requests', contactMessage: 'contact-messages' };
    const endpoint = contentTypeToEndpoint[type];
    if (endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!response.ok && response.status !== 204) throw new Error(`Failed to delete ${type} from server`);
            const setterMap: Record<string, Function> = { sermon: setSermons, event: setEvents, ministry: setMinistries, blogPost: setBlogPosts, news: setNewsItems, homeSlide: setHomeSlides, aboutSection: setAboutSections, keyPerson: setKeyPersons, historyMilestone: setHistoryMilestones, historyChapter: setHistoryChapters, branchChurch: setBranchChurches, prayerRequest: setPrayerRequests, testimonial: setTestimonials, donation: setDonationRecords, collectionRecord: setCollectionRecords, ministryJoinRequest: setMinistryJoinRequests };
            const setter = setterMap[type];
            if(setter) setter((prev: any[]) => prev.filter(item => item.id !== id));
            logContentActivity(`${type} with ID ${id} deleted`, 'content_deletion', type, id);
            return true;
        } catch (error) { console.error(`Error deleting ${type}:`, error); return false; }
    }
     let success = false;
     const deleteAndLog = <T extends ContentItem>(setState: React.Dispatch<React.SetStateAction<T[]>>): boolean => { let itemTitle = 'Unknown'; setState(prevItems => { const itemToDelete = prevItems.find(item => item.id === id); if (itemToDelete) itemTitle = (itemToDelete as any).title || (itemToDelete as any).name || itemToDelete.id; return prevItems.filter(item => item.id !== id); }); logContentActivity(`${type} deleted: "${itemTitle}"`, 'content_deletion', type, id); return true; };
     switch (type) {
        case 'directMedia': success = deleteAndLog(setDirectMediaItems); break;
        case 'churchMember': success = deleteAndLog(setChurchMembers); break;
        case 'meetingLog': success = deleteAndLog(setMeetingLogs); break;
        case 'decisionLog': success = deleteAndLog(setDecisionLogs); break;
        case 'expenseRecord': success = deleteAndLog(setExpenseRecords); break;
        case 'monthlyThemeImage': success = deleteAndLog(setMonthlyThemeImages); break;
        case 'fellowshipRoster': success = deleteAndLog(setFellowshipRosters); break;
        case 'advertisement': success = deleteAndLog(setAdvertisements); break;
        case 'group': success = deleteAndLog(setGroups); break;
    }
    return success;
  }
  
  const getContentById = (type: ContentType, id: string): ContentItem | undefined => {
    const allContentArrays = [ sermons, events, ministries, blogPosts, newsItems, homeSlides, aboutSections, keyPersons, historyMilestones, historyChapters, branchChurches, directMediaItems, churchMembers, meetingLogs, decisionLogs, expenseRecords, collectionRecords, monthlyThemeImages, fellowshipRosters, generatedSchedules, advertisements, prayerRequests, testimonials, groups, donationRecords ];
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
  const addDonationRecord = (data: Omit<DonationRecord, 'id' | 'transactionTimestamp' | 'postedByOwnerId' | 'postedByOwnerName' | 'createdAt' | 'updatedAt'>) => addContent('donation', data as DonationRecordFormData).then(res => res.newItem as DonationRecord || null);
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
        sermons, events, ministries, blogPosts, newsItems, homeSlides, aboutSections, keyPersons, historyMilestones, historyChapters, donationRecords, collectionRecords, contactMessages, branchChurches, directMediaItems, ministryJoinRequests, monthlyThemeImages, advertisements, prayerRequests, testimonials, groups, donatePageContent,
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