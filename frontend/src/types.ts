// FIX: Import ComponentType to use it directly without the React namespace.
import { ReactNode, ReactElement, ComponentType } from 'react';
import { CalendarDaysIcon as HeroCalendarDaysIcon } from '@heroicons/react/24/solid'; // Example, adjust as needed

export interface NavItem {
  label: string;
  path?: string; // Optional for dropdown headers
  // FIX: Use ComponentType directly.
  icon?: ComponentType<{ className?: string }>; 
  adminOnly?: boolean;
  children?: NavItem[]; // For dropdowns
}

export interface FeatureInfo {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkPath: string;
  category?: string;
  date?: string; // Generally YYYY-MM-DD
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

// --- Specific Category Types ---
export const sermonCategoriesList = ["Sermon Series", "Guest Speaker", "Topical Sermon", "Special Event Sermon", "Bible Study"] as const;
export type SermonCategory = typeof sermonCategoriesList[number];

export const eventCategoriesList = ["Community Outreach", "Conference", "Workshop", "Holiday Service", "Youth Event", "Worship Night", "Fellowship", "Special Meeting"] as const;
export type EventCategory = typeof eventCategoriesList[number];

export const ministryCategoriesList = ["Youth & Young Adults", "Children & Family", "Men's Ministry", "Women's Ministry", "Worship Team", "Outreach & Missions", "Pastoral Care"] as const;
export type MinistryCategory = typeof ministryCategoriesList[number];

export const blogPostCategoriesList = ["Church Life", "Biblical Study", "Devotionals", "Community News", "Testimonies"] as const;
export type BlogPostCategory = typeof blogPostCategoriesList[number];

export const newsCategoriesList = ["Church Announcements", "Community Updates", "Special Reports", "Mission News", "Youth Activities", "Pastoral Messages"] as const;
export type NewsCategory = typeof newsCategoriesList[number];

// --- NEW: Prayer Request Types ---
export const prayerRequestCategoriesList = ["Healing", "Guidance", "Family", "Thanksgiving", "Community", "Personal", "Other"] as const;
export type PrayerRequestCategory = typeof prayerRequestCategoriesList[number];

export const prayerRequestVisibilityList = ['public', 'friends_only', 'private', 'anonymous'] as const;
export type PrayerRequestVisibility = typeof prayerRequestVisibilityList[number];

export const prayerRequestStatusList = ['active', 'prayed_for', 'answered', 'archived'] as const;
export type PrayerRequestStatus = typeof prayerRequestStatusList[number];

export interface PrayerRequest {
  id: string;
  userId?: string; // Undefined if anonymous
  userName?: string; // Undefined if anonymous
  userProfileImageUrl?: string; // Undefined if anonymous
  title: string;
  requestText: string;
  visibility: PrayerRequestVisibility;
  category?: PrayerRequestCategory; // Admin can set, or user can select from predefined
  status: PrayerRequestStatus; // Default to 'active'
  submittedAt: string; // ISO timestamp
  lastPrayedAt?: string; // ISO timestamp, updated when someone indicates they prayed for it
  prayers: Array<{ userId: string; userName: string; timestamp: string; }>; // Users who prayed
  adminNotes?: string; // Private notes by admins/pastors
  postedByOwnerId?: string; // ID of the user who submitted OR admin who entered it
  postedByOwnerName?: string; // Name of the user who submitted OR admin who entered it
  linkPath: string; // e.g. /prayer-requests#prayer-id or /prayer-requests/:id
  createdAt?: string; // Same as submittedAt effectively
  updatedAt?: string; // When status or notes change
  comments: Comment[];
  // New Facebook-like fields
  mediaUrls?: string[];
  location?: string;
  taggedFriends?: string; // Simple text field for simulation
  feelingActivity?: string; // Simple text field
  backgroundTheme?: string; // e.g., a CSS class name for a gradient background
  // Deprecated fields
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
}
// --- END: Prayer Request Types ---

// --- NEW: Testimonial Types ---
export const testimonialVisibilityList = ['public', 'friends_only'] as const;
export type TestimonialVisibility = typeof testimonialVisibilityList[number];

export interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userProfileImageUrl?: string;
  title: string;
  contentText: string;
  visibility: TestimonialVisibility;
  submittedAt: string; // ISO timestamp
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  createdAt?: string;
  updatedAt?: string;
  linkPath: string; // e.g., /prayer-requests#testimonial-id
  // New Facebook-like fields
  mediaUrls?: string[];
  location?: string;
  taggedFriends?: string;
  feelingActivity?: string;
  backgroundTheme?: string;
  // Deprecated fields
  imageUrl?: string;
  videoUrl?: string;
}
// --- END: Testimonial Types ---


export type AllContentCategories = SermonCategory | EventCategory | MinistryCategory | BlogPostCategory | NewsCategory | PrayerRequestCategory;
// --- End Specific Category Types ---


export interface Ministry extends FeatureInfo {
  leader?: string;
  meetingTime?: string;
  category?: MinistryCategory;
  // description field from FeatureInfo will be used as "Ministry Guidelines/Rules"
  // date field from FeatureInfo is not typically used for Ministry as a static entity
  date?: undefined; 
}

export interface Comment {
  id: string;
  itemId: string; // Generic ID for event, sermon, blog post, news item, or history chapter
  itemType: 'event' | 'sermon' | 'blogPost' | 'historyChapter' | 'news' | 'prayerRequest'; // Added prayerRequest
  userId: string; 
  userName: string; 
  userProfileImageUrl?: string;
  text: string;
  timestamp: string; // ISO string
  editedAt?: string;
}

export interface EventItem extends FeatureInfo {
  location?: string;
  time?: string; // HH:MM format
  category?: EventCategory;
  expectations?: string;
  guests?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationLink?: string;
  capacity?: number;
  isFeeRequired?: boolean;
  feeAmount?: string;
  videoUrl?: string; 
  audioUrl?: string;
  likes?: number; 
  comments: Comment[]; 
}

export interface Sermon extends FeatureInfo {
  speaker?: string;
  scripture?: string;
  videoUrl?: string;
  audioUrl?: string;
  category?: SermonCategory;
  fullContent?: string; 
  likes?: number; 
  comments: Comment[];
}

export interface BlogPost extends FeatureInfo {
  category?: BlogPostCategory;
  likes?: number; 
  comments: Comment[];
  audioUrl?: string;
  // New Facebook-like fields
  mediaUrls?: string[];
  location?: string;
  taggedFriends?: string;
  feelingActivity?: string;
  backgroundTheme?: string;
  // Deprecated
  videoUrl?: string; 
}

export interface NewsItem extends FeatureInfo {
  category?: NewsCategory;
  videoUrl?: string;
  audioUrl?: string;
  likes?: number;
  comments: Comment[];
}

export interface HomeSlide {
  id: string;
  title: string;
  description: string;
  imageUrl: string; 
  ctaText: string;
  linkPath: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  postedByOwnerId?: string;
  postedByOwnerName?: string;
}

// --- About Page Specific Types ---
export const coreAboutSectionIds = ['our-story', 'our-mission', 'our-vision', 'our-beliefs'] as const;
export type CoreAboutSectionId = typeof coreAboutSectionIds[number];

export interface AboutSection {
  id: string; 
  title: string; 
  content: string; 
  imageUrl?: string; 
  updatedAt?: string;
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  isCoreSection: boolean; 
  displayOrder: number; 
  createdAt?: string;
}

export interface KeyPerson {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  bio: string;
  createdAt?: string;
  updatedAt?: string;
  postedByOwnerId?: string;
  postedByOwnerName?: string;
}

export interface HistoryMilestone {
  id: string;
  year: string; 
  title: string;
  description: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  postedByOwnerId?: string;
  postedByOwnerName?: string;
}
// --- End About Page Specific Types ---

// --- NEW: Church History "Book" Types ---
export interface HistoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string; // Markdown or plain text
  status: 'draft' | 'published';
  imageUrl?: string; // Optional featured image for the chapter
  summary?: string; // Optional short summary/teaser
  authorId?: string; // User ID of the author/editor
  authorName?: string; // Name of the author/editor
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  lastPublishedAt?: string; // ISO timestamp, for "New" indicators
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  likes?: number;
  comments: Comment[];
  linkPath: string; // e.g., /church-history#chapter-1
}
// --- END: Church History "Book" Types ---

// --- NEW: Donate Page Content ---
export interface DonatePageContent {
  id: 'singleton'; // Use a fixed ID for easy retrieval
  headerTitle: string;
  headerSubtitle: string;
  headerImageUrl: string;
  localDonationsTitle: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  bankQrImageUrl?: string;
  eSewaId: string;
  eSewaQrImageUrl?: string;
  localDonationsNote: string;
  internationalDonationsTitle: string;
  internationalDonationsContent: string;
  internationalDonationsContactEmail: string;
  internationalQrImageUrl?: string;
  receiptVerses?: string; // New: Newline-separated Bible verses
  updatedAt?: string;
  postedByOwnerId?: string;
  postedByOwnerName?: string;
}
// --- END: Donate Page Content ---


// --- Donation Specific Types ---
export const donationPurposeList = [
  "General Fund", 
  "Tithe", 
  "Worship Ministry", 
  "Sunday School", 
  "Outreach & Missions", 
  "Prayer Ministry", 
  "Building Fund/Maintenance", 
  "Leadership Support (Pastor)", 
  "Leadership Support (Elders/Ministry Leaders)", 
  "Benevolence Fund"
] as const;
export type DonationPurpose = typeof donationPurposeList[number];

export interface DonationRecord {
  id: string; 
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  amount: number;
  purpose: DonationPurpose;
  donationDate: string; 
  transactionTimestamp: string; 
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  createdAt?: string;
  updatedAt?: string;
  // New fields for enhanced tracking
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  isReceiptSent: boolean;
}
// --- End Donation Specific Types ---

// --- Collection Record Specific Types ---
export const collectionPurposeList = [
  "Tithe", 
  "General Offering", 
  "Saturday Fellowship Offering",
  "Wednesday Fellowship Offering",
  "Friday Program Offering",
  "Building Fund", 
  "Mission Support", 
  "Youth Ministry Support", 
  "Children Ministry Support", 
  "Women Ministry Support", 
  "Men Ministry Support", 
  "Thanksgiving Offering", 
  "Special Event Collection", 
  "Other Collections"
] as const;
export type CollectionPurpose = typeof collectionPurposeList[number];

export interface DonorDetail {
  id: string; // For client-side list key management
  donorName: string;
  amount: number;
  address?: string;
  contact?: string;
}

export interface CollectionRecord {
  id: string;
  collectorName: string; 
  collectionDate: string; 
  amount: number; // Total amount, sum of donor amounts
  purpose: CollectionPurpose;
  source?: string; 
  notes?: string; 
  donors: DonorDetail[]; // List of individual donors
  recordedAt: string; 
  recordedByOwnerId?: string;
  recordedByOwnerName?: string;
  updatedAt?: string; 
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  createdAt?: string;
  // New fields for financial accountability
  countedBy?: string;
  isDeposited: boolean;
  depositDate?: string;
  bankDepositReference?: string;
}
// --- End Collection Record Specific Types ---

// --- Contact Message Types ---
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string; // ISO timestamp
  status: 'pending' | 'replied';
  repliedAt?: string; // ISO timestamp, if replied
  replyNote?: string; // Admin's note about the reply
}
// --- End Contact Message Types ---

// --- Branch Church Types ---
export interface BranchChurch {
  id: string;
  name: string;
  address: string;
  pastorName?: string;
  phone?: string;
  email?: string;
  serviceTimes: string; 
  mapEmbedUrl?: string; 
  imageUrl?: string;
  description?: string;
  establishedDate?: string; // YYYY-MM-DD
  createdAt?: string;
  updatedAt?: string;
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  linkPath?: string; // e.g. /branches#branch-id
}
// --- End Branch Church Types ---

// --- Ministry Join Request Types ---
export type MinistryJoinRequestStatus = 'pending' | 'approved' | 'rejected';
export type MinistryMembershipType = 'member'; 

export interface MinistryJoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  ministryId: string;
  ministryName: string;
  membershipType: MinistryMembershipType; 
  ministryGuidelines: string; 
  requestDate: string; // ISO timestamp
  message: string; 
  status: MinistryJoinRequestStatus;
  processedDate?: string; // ISO timestamp, when approved/rejected
  adminNotes?: string; // Admin's notes on processing
}
// --- End Ministry JoinRequest Types ---

// --- Direct Media Upload Types ---
export interface DirectMediaItem {
  id: string;
  title: string;
  description?: string;
  url: string; // Cloudinary URL
  mediaType: 'image' | 'video';
  category?: string; // E.g., "Gallery", "Event Highlights", "General"
  tags?: string[];
  uploadDate: string; // ISO timestamp (serves as createdAt)
  linkPath: string; 
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  updatedAt?: string; // Added
}

export interface DirectMediaFormData {
  title: string;
  description?: string;
  url: string;
  mediaType: 'image' | 'video';
  uploadCategory?: string; 
  tagsString?: string; 
}
// --- End Direct Media Upload Types ---

// --- NEW ADMINISTRATIVE TYPES ---
export interface ChurchMember {
  id: string;
  fullName: string;
  username?: string; // Added username
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  memberSince: string; 
  dateOfBirth?: string; 
  baptismDate?: string; 
  familyMembers?: string; 
  notes?: string;
  isActiveMember: boolean; 
  profileImageUrl?: string;
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const meetingTypeList = [
  "General Leaders Meeting", "Elders Meeting", "Deacons Meeting",
  "General Choir Meeting", "Worship Team Practice",
  "Programme Arrange Meeting", "Event Planning Meeting",
  "Helping Ministry Meeting", "Benevolence Committee",
  "Outreach Planning Meeting", "Missions Update Meeting",
  "Sunday School Teachers Meeting", "Youth Leaders Meeting",
  "Men's Fellowship Planning", "Women's Fellowship Planning",
  "Prayer Meeting", "Bible Study Group",
  "Financial Committee Meeting", "Administrative Meeting",
  "Special General Meeting", "Other Specific Meeting"
] as const;
export type MeetingType = typeof meetingTypeList[number];

export const meetingLogStatusList = [
  "Pending Discussion", "Agenda Set", "In Progress", "Completed", 
  "Decisions Approved", "Follow-up Required", "Postponed", "Cancelled"
] as const;
export type MeetingLogStatus = typeof meetingLogStatusList[number];

export const decisionLogStatusList = [
  "Proposed", "Approved", "Implemented", "Rejected", "Follow-up Required", "Postponed", "Cancelled"
] as const;
export type DecisionLogStatus = typeof decisionLogStatusList[number];

// --- NEW Action Item Types ---
export const actionItemStatusList = ["Pending", "In Progress", "Completed", "Cancelled"] as const;
export type ActionItemStatus = typeof actionItemStatusList[number];

export interface ActionItem {
  id: string; // For client-side key management
  description: string;
  assignedTo?: string;
  status: ActionItemStatus;
  dueDate?: string; // YYYY-MM-DD (AD)
}
// --- END Action Item Types ---

export interface MeetingDecisionPoint {
  id: string;
  description: string;
  proposedBy?: string;
  status: DecisionLogStatus;
  followUpNotes?: string;
  resolutionDate?: string; 
}

export interface MeetingLog {
  id: string;
  meetingDate: string; 
  title: string; 
  meetingType?: MeetingType; 
  attendees: string; 
  agenda: string; 
  minutes: string; 
  actionItems?: ActionItem[]; 
  status?: MeetingLogStatus; 
  imageUrl?: string; 
  decisionPoints?: MeetingDecisionPoint[];
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DecisionLog {
  id: string;
  decisionDate: string; 
  title: string; 
  description: string; 
  madeBy: string; 
  status?: DecisionLogStatus;
  followUpActions?: ActionItem[];
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const expenseCategoriesList = [
  "Ministry Supplies", "Utilities", "Outreach & Events", "Benevolence", 
  "Salaries & Stipends", "Building Maintenance", "Office Supplies", 
  "Travel", "Bank Charges", "IT & Subscriptions", "Other"
] as const;
export type ExpenseCategory = typeof expenseCategoriesList[number];

export const paymentMethodOptions = ["Cash", "Cheque", "Bank Transfer", "eSewa", "Other"] as const;
export type PaymentMethod = typeof paymentMethodOptions[number];

// New status list for expenses
export const expenseStatusList = ["paid", "pending", "overdue", "cancelled"] as const;
export type ExpenseStatus = typeof expenseStatusList[number];

export interface ExpenseRecord {
  id: string;
  expenseDate: string; 
  category: ExpenseCategory;
  description: string; 
  amount: number;
  payee?: string; 
  paymentMethod?: PaymentMethod;
  transactionReference?: string; 
  receiptUrl?: string; 
  approvedBy?: string;
  notes?: string;
  source?: string;
  location?: string;
  status?: ExpenseStatus; // New status field
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  createdAt?: string;
  updatedAt?: string;
}
// --- END NEW ADMINISTRATIVE TYPES ---

// --- CALENDAR TYPES ---
export interface MonthlyThemeImage {
  id: string; 
  year: number; // BS Year.
  month: number; // BS Month (1-12).
  imageUrls: string[]; // Array of image URLs
  quoteOrCaption?: string;
  createdAt?: string; // Added
  updatedAt?: string; // Added
  postedByOwnerId?: string; // Added
  postedByOwnerName?: string; // Added
}
// --- END CALENDAR TYPES ---

// --- NEW FELLOWSHIP SCHEDULE / ROSTER TYPES ---
export const rosterTypeList = [
  "Saturday Main Fellowship", "Saturday Children Fellowship", "Saturday Youth Fellowship",
  "Wednesday Home Fellowship", "Friday Evening Program", 
  "Special Meeting", "Outreach Program", "Other Regular Program",
  "Prayer Team Visit", "Night Prayer", "Saturday Prayer" // Added types
] as const;
export type RosterType = typeof rosterTypeList[number];

export interface Responsibility {
  id: string; // For client-side list key management
  role: string;
  assignedTo: string;
}

export interface FellowshipRosterItem {
  id: string;
  rosterType: RosterType;
  groupNameOrEventTitle: string; 
  assignedDate: string; // YYYY-MM-DD (AD)
  timeSlot: string; // e.g., "10:00 AM - 11:00 AM", "Full Service"
  responsibilities: Responsibility[]; // New flexible responsibilities
  location?: string;
  contactNumber?: string;
  additionalNotesOrProgramDetails?: string; 
  isTemplate?: boolean; 
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  createdAt?: string;
  updatedAt?: string;
  linkPath?: string; // e.g., /fellowship-program/roster/:id
}

export interface GeneratedScheduleItem {
  id: string;
  basedOnRosterItemId?: string; 
  rosterType: RosterType;
  groupNameOrEventTitle: string;
  scheduledDate: string; // YYYY-MM-DD (AD)
  timeSlot: string;
  responsibilities: Responsibility[]; // New flexible responsibilities
  location?: string;
  contactNumber?: string;
  additionalNotesOrProgramDetails?: string;
  generatedAt: string; // ISO timestamp
  isPublishedAsEvent: boolean;
  publishedEventId?: string; 
  adminNotes?: string; 
  linkPath?: string; // e.g., /fellowship-program/schedule/:id
  postedByOwnerId?: string; 
  postedByOwnerName?: string;
  createdAt?: string; 
  updatedAt?: string; 
}
// --- END FELLOWSHIP SCHEDULE / ROSTER TYPES ---

// --- NEW ADVERTISEMENT TYPES ---
export const adPlacementList = [
  'homepage_banner_top', 
  'homepage_banner_bottom',
  'content_list_interspersed',
  'sermon_list_top',
  'event_list_top',
  'blog_list_top',
  'news_list_top',
  'single_page_bottom',
  'sidebar_main',
  'footer_banner'
] as const;
export type AdPlacement = typeof adPlacementList[number];

// Define standard ad sizes
export const AD_SIZES = {
  BILLBOARD_970X250: "970x250",
  FULL_BANNER_468X60: "468x60",
  HALF_BANNER_234X60: "234x60",
  HALF_PAGE_300X600: "300x600",
  LARGE_LEADERBOARD_970X90: "970x90",
  LARGE_MOBILE_BANNER_320X100: "320x100",
  LARGE_RECTANGLE_336X280: "336x280",
  LEADERBOARD_728X90: "728x90",
  MEDIUM_RECTANGLE_300X250: "300x250",
  MOBILE_BANNER_320X50: "320x50",
  MOBILE_INTERSTITIAL_320X480: "320x480",
  PORTRAIT_300X1050: "300x1050",
  RECTANGLE_180X150: "180x150",
  SKYSCRAPER_120X600: "120x600",
  SQUARE_250X250: "250x250",
  VERTICAL_BANNER_120X240: "120x240",
  WIDE_SKYSCRAPER_160X600: "160x600",
} as const;
export type AdSizeKey = keyof typeof AD_SIZES;


export interface Advertisement {
  id: string;
  name: string; 
  adType: 'image_banner' | 'video_banner'; // Updated
  imageUrl?: string; // Optional for video ads
  videoUrl?: string; // Added for video ads
  linkUrl?: string; // Made optional
  altText?: string;
  placements: AdPlacement[]; 
  startDate?: string; 
  endDate?: string; 
  isActive: boolean;
  displayOrder?: number; 
  adSizeKey?: AdSizeKey; // Changed to optional
  createdAt: string;
  updatedAt: string;
  postedByOwnerId?: string;
  postedByOwnerName?: string;
}
// --- END ADVERTISEMENT TYPES ---


export type UserRole = 'admin' | 'user' | 'owner';

export type RelationshipStatus = 'Single' | 'In a relationship' | 'Engaged' | 'Married' | 'Its complicated' | 'Separated' | 'Divorced' | 'Widowed';
export const relationshipStatusList: RelationshipStatus[] = ['Single', 'In a relationship', 'Engaged', 'Married', 'Its complicated', 'Separated', 'Divorced', 'Widowed'];

export type PrivacySetting = 'public' | 'friends' | 'private';
export type FriendRequestSetting = 'everyone' | 'friends_of_friends';
export type GroupInviteSetting = 'everyone' | 'friends';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  countryCode?: string;
  phone?: string;
  role: UserRole;
  profileImageUrl?: string;
  coverPhotoUrl?: string;
  
  // New "About Me" fields
  bio?: string;
  hometown?: string;
  currentCity?: string;
  work?: string; // Simplified for now
  education?: string; // Simplified for now
  relationshipStatus?: RelationshipStatus;
  interests?: string; // Simplified as comma-separated string
  favoriteScripture?: string;
  
  // Notification Preferences
  receiveContentUpdateNotifications?: boolean;
  receivePrayerRequestNotifications?: boolean;
  receiveTestimonialNotifications?: boolean;
  receiveFriendActivityNotifications?: boolean;

  // New Privacy Settings
  privacySettings?: {
    friendsList: PrivacySetting;
    profileInSearch: boolean;
    whoCanSendFriendRequest: FriendRequestSetting;
    whoCanAddToGroups: GroupInviteSetting;
  };
}


// --- NEW: Friendship Types ---
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked' | 'declined';

export interface Friendship {
  id: string;
  // The user who sent the request
  requesterId: string;
  // The user who received the request
  addresseeId: string;
  status: FriendshipStatus;
  requestedAt: string; // ISO timestamp of the initial request
  updatedAt: string; // ISO timestamp of status change
}
// --- END: Friendship Types ---


// --- NEW: Group Chat Types ---
export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  addedAt: string;
}

export type GroupPermissionSetting = 'admins_only' | 'all_members';

export interface Group {
  id: string;
  name: string;
  creatorId: string;
  groupImageUrl?: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  postedByOwnerId?: string;
  postedByOwnerName?: string;
  linkPath: string;
  permissions?: {
    editSettings: GroupPermissionSetting;
    sendMessage: GroupPermissionSetting;
    addMembers: GroupPermissionSetting;
    approveMembers: GroupPermissionSetting; // For future use
  };
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderProfileImageUrl?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file' | 'location';
  timestamp: string;
  isLoading?: boolean;
  error?: boolean;
}
// --- END: Group Chat Types ---

export interface AdminActionLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: string; 
  targetId?: string; 
  details?: string; 
}

export interface FrontendActivityLog {
  id: string;
  timestamp: string;
  userId?: string; 
  description: string; 
  type: 
    | 'user_registration' 
    | 'user_update' 
    | 'content_creation' 
    | 'content_update' 
    | 'content_deletion' 
    | 'donation_logged' 
    | 'collection_logged' // New activity type
    | 'contact_submission' 
    | 'contact_status_update' 
    | 'ministry_join_request_submission' 
    | 'ministry_join_request_status_update' 
    | 'event_comment_added' 
    | 'sermon_comment_added' 
    | 'blog_post_comment_added'
    | 'history_chapter_comment_added'
    | 'news_comment_added'
    | 'prayer_request_submission'        // New
    | 'prayer_request_status_update'   // New
    | 'prayer_request_prayed_for'      // New
    | 'testimonial_submission'         // New
    | 'friend_request_sent'            // New
    | 'friend_request_accepted'        // New
    | 'friend_request_declined'        // New
    | 'friend_removed'                 // New
    | 'notification_added'
    | 'direct_media_upload'
    | 'user_login' 
    | 'user_logout' 
    | 'notification_preference_update'
    | 'password_change_simulated'
    | 'forgot_password_request'
    | 'password_reset_success'
    | 'password_reset_failure'
    | 'social_login_google'
    | 'social_login_x'
    | 'social_login_facebook'
    | 'social_login_apple'
    | 'social_login_microsoft'
    | 'social_login_github'     // Added
    | 'social_login_linkedin'   // Added
    | 'roster_item_created'       
    | 'roster_item_updated'       
    | 'roster_item_deleted'       
    | 'schedule_draft_generated'  
    | 'schedule_draft_updated'    
    | 'schedule_draft_deleted'    
    | 'schedule_draft_published'
    | 'ad_created'
    | 'ad_updated'
    | 'ad_deleted'
    | 'group_created'; // New
  itemId?: string; 
  itemType?: ContentType | 'donation' | 'contactMessage' | 'ministryJoinRequest' | 'comment' | 'notification' | 'mediaItem' | 'directMedia' | 'userPreference' | 'userAccount' | 'advertisement' | 'prayerRequest' | 'testimonial' | 'friendship' | 'group';
}

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  loadingAuthState: boolean;
  login: (identifier: string, pass: string, rememberMe?: boolean) => Promise<boolean>; 
  register: (fullName: string, email: string, countryCode: string, phone: string, pass: string, profileImageUrl?: string) => Promise<boolean>; // Updated signature
  logout: () => void;
  updateUserProfile?: (userId: string, data: Partial<User>) => Promise<boolean>;
  adminActionLogs: AdminActionLog[];
  logAdminAction: (action: string, targetId?: string, details?: string) => void;
  getAllUsers: () => User[];
  updateUserRole: (targetUserId: string, newRole: UserRole) => Promise<{ success: boolean; message?: string }>;
  userActivityLogs: FrontendActivityLog[];
  logUserActivity: (description: string, type: FrontendActivityLog['type'], itemId?: string, itemType?: FrontendActivityLog['itemType'], userId?: string) => void;
  changePassword?: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; token?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithX: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
  loginWithMicrosoft: () => Promise<boolean>;
  loginWithGitHub: () => Promise<boolean>;     // Added
  loginWithLinkedIn: () => Promise<boolean>;   // Added
  // New Friendship context items
  friendships: Friendship[];
  friendRequestCount: number;
  sendFriendRequest: (targetUserId: string) => Promise<{ success: boolean; message?: string }>;
  acceptFriendRequest: (friendshipId: string) => Promise<{ success: boolean; message?: string }>;
  declineFriendRequest: (friendshipId: string) => Promise<{ success: boolean; message?: string }>;
  removeFriend: (friendshipId: string) => Promise<{ success: boolean; message?: string }>;
  getFriendshipStatus: (targetUserId: string) => { status: 'friends' | 'pending_sent' | 'pending_received' | 'not_friends'; friendshipId?: string };
}

export type ContentType = 
  | 'sermon' 
  | 'event' 
  | 'ministry' 
  | 'blogPost' 
  | 'news'
  | 'homeSlide'
  | 'aboutSection'
  | 'keyPerson'
  | 'historyMilestone'
  | 'branchChurch'
  | 'contactMessage' 
  | 'ministryJoinRequest' 
  | 'mediaItem' 
  | 'directMedia'
  | 'churchMember' 
  | 'meetingLog'   
  | 'decisionLog'  
  | 'expenseRecord'
  | 'collectionRecord' 
  | 'monthlyThemeImage'
  | 'historyChapter'
  | 'fellowshipRoster'    
  | 'generatedSchedule'
  | 'advertisement'
  | 'prayerRequest'
  | 'testimonial'
  | 'group'
  | 'donation'
  | 'donatePageContent';

export type ContentItem = 
  | Sermon 
  | EventItem 
  | Ministry 
  | BlogPost 
  | NewsItem
  | HomeSlide
  | AboutSection
  | KeyPerson
  | HistoryMilestone
  | BranchChurch
  | ContactMessage
  | MinistryJoinRequest
  // DisplayedMediaItem removed from ContentItem union
  | DirectMediaItem
  | ChurchMember    
  | MeetingLog      
  | DecisionLog     
  | ExpenseRecord
  | CollectionRecord 
  | MonthlyThemeImage 
  | HistoryChapter
  | FellowshipRosterItem  
  | GeneratedScheduleItem
  | Advertisement
  | PrayerRequest
  | Testimonial
  | Group
  | DonationRecord
  | DonatePageContent;


// FormData types for creation/editing
export interface BaseContentFormData {
  title: string;
  description: string;
  imageUrl?: string; // This might be deprecated for multi-image types like MonthlyThemeImage
  category?: AllContentCategories;
  date?: string; 
}

export interface SermonFormData extends BaseContentFormData {
  speaker?: string;
  scripture?: string;
  videoUrl?: string;
  audioUrl?: string;
  category?: SermonCategory;
  fullContent?: string; 
}

export interface EventFormData extends BaseContentFormData {
  location?: string;
  time?: string; 
  category?: EventCategory;
  expectations?: string;
  guests?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationLink?: string;
  capacity?: number;
  isFeeRequired?: boolean;
  feeAmount?: string;
  videoUrl?: string;
  audioUrl?: string;
}

export interface MinistryFormData extends BaseContentFormData {
  leader?: string;
  meetingTime?: string;
  category?: MinistryCategory;
  date?: undefined; 
}

export interface BlogPostFormData extends BaseContentFormData {
    category?: BlogPostCategory;
    audioUrl?: string;
    // New
    mediaUrls?: string[];
    location?: string;
    taggedFriends?: string;
    feelingActivity?: string;
    backgroundTheme?: string;
    // Deprecated
    videoUrl?: string;
}

export interface NewsItemFormData extends BaseContentFormData {
    category?: NewsCategory;
    videoUrl?: string;
    audioUrl?: string;
}

export interface HomeSlideFormData {
  title: string;
  description: string;
  imageUrl: string; 
  ctaText: string;
  linkPath: string;
  order: number;
  isActive: boolean;
}

// --- NEW: Donate Page FormData ---
export interface DonatePageContentFormData {
  headerTitle: string;
  headerSubtitle: string; 
  headerImageUrl: string;
  localDonationsTitle: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  bankQrImageUrl?: string;
  eSewaId: string;
  eSewaQrImageUrl?: string;
  localDonationsNote: string;
  internationalDonationsTitle: string;
  internationalDonationsContent: string;
  internationalDonationsContactEmail: string;
  internationalQrImageUrl?: string;
  receiptVerses?: string; // New: Newline-separated Bible verses
}
// --- END: Donate Page FormData ---

// --- About Page FormData Types ---
export interface AboutSectionFormData {
  title: string; 
  content: string;
  imageUrl?: string;
  displayOrder: number; 
}

export interface KeyPersonFormData {
  name: string;
  role: string;
  imageUrl?: string;
  bio: string;
}

export interface HistoryMilestoneFormData {
  year: string;
  title: string;
  description: string;
  imageUrl?: string;
}
// --- End About Page FormData Types ---

// --- NEW: HistoryChapter FormData ---
export interface HistoryChapterFormData {
  chapterNumber: number;
  title: string;
  content: string;
  status: 'draft' | 'published';
  imageUrl?: string;
  summary?: string;
}
// --- END: HistoryChapter FormData ---

// --- NEW: PrayerRequest FormData ---
export interface PrayerRequestFormData {
  title: string;
  requestText: string;
  visibility: PrayerRequestVisibility;
  category?: PrayerRequestCategory;
  // New
  mediaUrls?: string[];
  location?: string;
  taggedFriends?: string;
  feelingActivity?: string;
  backgroundTheme?: string;
  // Deprecated
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
}
// --- END: PrayerRequest FormData ---

// --- NEW: Testimonial FormData ---
export interface TestimonialFormData {
  title: string;
  contentText: string;
  visibility: TestimonialVisibility;
   // New
  mediaUrls?: string[];
  location?: string;
  taggedFriends?: string;
  feelingActivity?: string;
  backgroundTheme?: string;
  // Deprecated
  imageUrl?: string;
  videoUrl?: string;
}
// --- END: Testimonial FormData ---

// --- NEW: Group FormData ---
export interface GroupFormData {
  name: string;
  groupImageUrl?: string;
  memberIds: string[];
  permissions: {
    editSettings: GroupPermissionSetting;
    sendMessage: GroupPermissionSetting;
    addMembers: GroupPermissionSetting;
    approveMembers: GroupPermissionSetting;
  };
}
// --- END: Group FormData ---


// --- Branch Church FormData Type ---
export interface BranchChurchFormData {
  name: string;
  address: string;
  pastorName?: string;
  phone?: string;
  email?: string;
  serviceTimes: string;
  mapEmbedUrl?: string;
  imageUrl?: string;
  description?: string;
  establishedDate?: string;
}
// --- End Branch Church FormData Type ---

// --- Ministry Join Request FormData ---
export interface MinistryJoinRequestFormData {
  message: string; 
}
// --- End Ministry JoinRequest FormData ---

// --- NEW ADMINISTRATIVE FORMDATA TYPES ---
export interface ChurchMemberFormData {
  fullName: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  memberSince: string; 
  dateOfBirth?: string; 
  baptismDate?: string; 
  familyMembers?: string;
  notes?: string;
  isActiveMember: boolean;
  profileImageUrl?: string;
}

export interface MeetingLogFormData {
  meetingDate: string; 
  title: string;
  meetingType?: MeetingType;
  attendees: string;
  agenda: string; 
  minutes: string;
  actionItems?: ActionItem[];
  status?: MeetingLogStatus;
  imageUrl?: string;
  decisionPoints?: MeetingDecisionPoint[];
}

export interface DecisionLogFormData {
  decisionDate: string; 
  title: string;
  description: string;
  madeBy: string;
  status?: DecisionLogStatus;
  followUpActions?: ActionItem[];
}

export interface ExpenseRecordFormData {
  expenseDate: string; 
  category: ExpenseCategory;
  description: string;
  amount: number | string; 
  payee?: string;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  receiptUrl?: string;
  approvedBy?: string;
  notes?: string;
  source?: string;
  location?: string;
  status?: ExpenseStatus; // New
}

export interface CollectionRecordFormData {
  collectorName: string;
  collectionDate: string; // YYYY-MM-DD (AD)
  amount: number | string; // Sum of donor amounts, string for input, number for storage.
  purpose: CollectionPurpose;
  source?: string;
  notes?: string;
  donors: DonorDetail[];
  // New
  countedBy?: string;
  isDeposited: boolean;
  depositDate?: string;
  bankDepositReference?: string;
}

export interface DonationRecordFormData {
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  amount: number | string;
  purpose: DonationPurpose;
  donationDate: string;
  // New
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  isReceiptSent: boolean;
}
// --- END NEW ADMINISTRATIVE FORMDATA TYPES ---

// --- CALENDAR THEME IMAGE FORMDATA TYPE ---
export interface MonthlyThemeImageFormData {
  year: number; // BS Year
  month: number; // BS Month (1-12)
  imageUrlsString: string; // Comma-separated image URLs
  quoteOrCaption?: string;
}
// --- END CALENDAR THEME IMAGE FORMDATA TYPE ---

// --- NEW FELLOWSHIP ROSTER FORMDATA TYPE ---
export interface FellowshipRosterFormData {
  rosterType: RosterType;
  groupNameOrEventTitle: string;
  assignedDate: string; // YYYY-MM-DD (AD)
  timeSlot: string;
  responsibilities: Responsibility[]; // New field
  location?: string;
  contactNumber?: string;
  additionalNotesOrProgramDetails?: string;
  isTemplate?: boolean;
}

export interface GeneratedScheduleFormData { // For editing generated drafts
  groupNameOrEventTitle: string;
  scheduledDate: string; // YYYY-MM-DD (AD)
  timeSlot: string;
  responsibilities: Responsibility[]; // New field
  location?: string;
  contactNumber?: string;
  additionalNotesOrProgramDetails?: string;
  adminNotes?: string;
}
// --- END FELLOWSHIP ROSTER FORMDATA TYPE ---

// --- NEW ADVERTISEMENT FORMDATA TYPE ---
export interface AdvertisementFormData {
  name: string;
  adType: 'image_banner' | 'video_banner'; // Updated
  imageUrl?: string; // Optional for video
  videoUrl?: string; // Added
  linkUrl?: string; // Made optional
  altText?: string;
  placements: AdPlacement[];
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  isActive: boolean;
  displayOrder?: number;
  adSizeKey?: AdSizeKey; 
}
// --- END ADVERTISEMENT FORMDATA TYPE ---


export type GenericContentFormData = 
  | SermonFormData 
  | EventFormData 
  | MinistryFormData 
  | BlogPostFormData 
  | NewsItemFormData
  | HomeSlideFormData
  | AboutSectionFormData
  | KeyPersonFormData
  | HistoryMilestoneFormData
  | BranchChurchFormData
  | MinistryJoinRequestFormData
  | DirectMediaFormData
  | ChurchMemberFormData    
  | MeetingLogFormData      
  | DecisionLogFormData     
  | ExpenseRecordFormData
  | CollectionRecordFormData 
  | MonthlyThemeImageFormData
  | HistoryChapterFormData
  | FellowshipRosterFormData
  | GeneratedScheduleFormData
  | AdvertisementFormData
  | PrayerRequestFormData
  | TestimonialFormData
  | GroupFormData
  | DonationRecordFormData
  | DonatePageContentFormData;


// --- Media Library Types ---
export type MediaSourceContentType = 'Sermon' | 'Event' | 'Blog Post' | 'News' | 'Home Slide' | 'About Section' | 'Key Person' | 'History Milestone' | 'Branch Church' | 'Ministry' | 'Direct Upload' | 'Other' | 'Church Member' | 'Meeting Log' | 'Expense Record' | 'Monthly Theme Image' | 'History Chapter' | 'Prayer Request' | 'Testimonial'; // New

export interface DisplayedMediaItem {
  id: string; 
  title: string; 
  type: 'image' | 'video' | 'audio';
  url: string; 
  thumbnailUrl?: string; 
  category?: string; 
  date?: string; 
  sourceTitle: string; 
  sourceLink: string; 
  sourceContentType: MediaSourceContentType;
  description?: string; 
  tags?: string[]; 
  postedByOwnerName?: string;
}
// --- End Media Library Types ---

export interface ContentContextType {
  sermons: Sermon[];
  events: EventItem[];
  ministries: Ministry[];
  blogPosts: BlogPost[];
  newsItems: NewsItem[];
  homeSlides: HomeSlide[];
  aboutSections: AboutSection[];
  keyPersons: KeyPerson[];
  historyMilestones: HistoryMilestone[];
  historyChapters: HistoryChapter[]; 
  donationRecords: DonationRecord[];
  collectionRecords: CollectionRecord[]; 
  contactMessages: ContactMessage[];
  branchChurches: BranchChurch[];
  directMediaItems: DirectMediaItem[]; 
  ministryJoinRequests: MinistryJoinRequest[]; 
  allDerivedMediaItems: DisplayedMediaItem[];
  monthlyThemeImages: MonthlyThemeImage[]; 
  advertisements: Advertisement[]; 
  prayerRequests: PrayerRequest[]; 
  testimonials: Testimonial[]; // New
  groups: Group[]; // New
  donatePageContent: DonatePageContent;

  // New Administrative Data
  churchMembers: ChurchMember[];
  meetingLogs: MeetingLog[];
  decisionLogs: DecisionLog[];
  expenseRecords: ExpenseRecord[];

  // New Fellowship Schedule Data
  fellowshipRosters: FellowshipRosterItem[];       
  generatedSchedules: GeneratedScheduleItem[];     

  loadingContent: boolean;
  addContent: (type: ContentType, data: GenericContentFormData) => Promise<{ success: boolean; newItem?: ContentItem; message?: string }>;
  updateContent: (type: ContentType, id: string, data: GenericContentFormData) => Promise<{ success: boolean; updatedItem?: ContentItem; message?: string }>;
  deleteContent: (type: ContentType, id: string) => Promise<boolean>;
  getContentById: (type: ContentType, id: string) => ContentItem | undefined;
  
  contentActivityLogs: FrontendActivityLog[];
  logContentActivity: (
    description: string, 
    type: FrontendActivityLog['type'], 
    itemType?: FrontendActivityLog['itemType'], // Updated this union in FrontendActivityLog['itemType']
    itemId?: string
  ) => void;

  addDonationRecord: (recordData: Omit<DonationRecord, 'id' | 'transactionTimestamp' | 'postedByOwnerId' | 'postedByOwnerName' | 'createdAt' | 'updatedAt'>) => Promise<DonationRecord | null>;
  addCollectionRecord: (recordData: CollectionRecordFormData) => Promise<CollectionRecord | null>; 
  
  addContactMessage: (data: Omit<ContactMessage, 'id' | 'submittedAt' | 'status' | 'repliedAt' | 'replyNote'>) => Promise<ContactMessage | null>;
  updateContactMessageStatus: (id: string, status: 'replied' | 'pending', replyNote?: string) => Promise<boolean>;

  addMinistryJoinRequest: (
    data: Omit<MinistryJoinRequest, 'id' | 'requestDate' | 'status' | 'processedDate' | 'adminNotes' | 'userId' | 'userName' | 'userEmail' | 'membershipType' | 'ministryId' | 'ministryName' | 'ministryGuidelines'>, 
    ministry: Ministry
  ) => Promise<MinistryJoinRequest | null>;
  updateMinistryJoinRequestStatus: (id: string, status: MinistryJoinRequestStatus, adminNotes?: string) => Promise<boolean>;
  getMinistryJoinRequestsForUser: (userId: string) => MinistryJoinRequest[];

  // New for Prayer Requests
  addPrayerRequest: (data: PrayerRequestFormData) => Promise<PrayerRequest | null>;
  updatePrayerRequestStatusByAdmin: (id: string, status: PrayerRequestStatus, adminNotes?: string) => Promise<boolean>;
  updatePrayerRequestStatusByUser: (id: string, newStatus: PrayerRequestStatus) => Promise<boolean>;
  togglePrayerOnRequest: (id: string) => Promise<boolean>;
  toggleLikeOnItem: (itemType: ContentType, itemId: string, isLiked: boolean) => Promise<ContentItem | null>;

  // New for Testimonials
  addTestimonial: (data: TestimonialFormData) => Promise<Testimonial | null>;

  addCommentToItem: (itemId: string, itemType: Comment['itemType'], commentText: string) => Promise<Comment | null>;
  updateComment: (commentId: string, newText: string, itemType: Comment['itemType'], itemId: string) => Promise<boolean>;
  deleteComment: (commentId: string, itemType: Comment['itemType'], itemId: string) => Promise<boolean>;


  generateNextSchedules: (rosterType: RosterType, count: number) => Promise<GeneratedScheduleItem[]>;
  updateGeneratedSchedule: (id: string, data: Partial<GeneratedScheduleItem>) => Promise<boolean>;
  deleteGeneratedSchedule: (id: string) => Promise<boolean>;
  publishGeneratedScheduleToEvent: (scheduleId: string) => Promise<EventItem | null>;
}

// --- Notification System Types ---
export interface Notification {
  id: string;
  targetUserId: string; 
  message: string;
  link?: string; 
  timestamp: string; 
  read: boolean;
  type: 
    | 'comment' 
    | 'ministry_request_update' 
    | 'admin_action' 
    | 'event_reminder' 
    | 'generic'
    | 'new_content_published' 
    | 'schedule_update'
    | 'feature_update'
    | 'prayer_request_submitted_admin' // New
    | 'prayer_request_status_user' // New
    | 'prayer_request_prayed_for'      // New
    | 'friend_request_received'      // New
    | 'friend_request_accepted'      // New
    | 'new_prayer_request_friend'
    | 'new_testimonial_friend'
    | 'ad_expiring_soon'; 
}

export type NotificationAddData = Omit<Notification, 'id' | 'timestamp' | 'read'>;

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notificationData: NotificationAddData) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void; 
  loadingNotifications: boolean;
}
// --- End Notification System Types ---

// --- Chatbot & Chat Types ---
export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | string; // bot for AI chatbot, string for user IDs in P2P chat
  text: string;
  timestamp: string; 
  isLoading?: boolean; 
  error?: boolean; 
}
// --- End Chatbot & Chat Types ---

// --- BS Date Simulation Types (Internal to dateConverter) ---
export interface BSSimulatedDate {
  year: number;
  month: number; 
  day: number;
  monthName: string; 
  dayOfWeek?: number; 
}
// --- End BS Date Simulation Types ---


// --- Settings Context Types ---
export type FontSize = 'xs' | 'sm' | 'md' | 'lg'; // Added 'xs'

export interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
}
// --- End Settings Context Types ---

// --- Global Search Types ---
export interface SearchResultItem {
  id: string;
  title: string;
  type: string; // User-friendly type name (e.g., "Sermon", "Event")
  typeKey: ContentType | 'Other'; // For internal linking/filtering
  snippet: string;
  linkPath: string;
  imageUrl?: string;
  date?: string; // AD date string for display
}
// --- End Global Search Types ---

// --- Fellowship Program Detail Page Type ---
export type FellowshipProgramDetailType = FellowshipRosterItem | GeneratedScheduleItem;

export type FellowshipProgramItemType = 'roster' | 'schedule';

// --- End Fellowship Program Detail Page Type ---

// --- Registration FormData ---
export interface RegistrationFormData {
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  profileImageUrl?: string;
  coverPhotoUrl?: string;
}
// --- End Registration FormData ---
