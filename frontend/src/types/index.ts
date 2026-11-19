export type VerificationStatus = 'VERIFIED' | 'GRACE_PERIOD' | 'RESTRICTED';

export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
export type ConnectionIntent = 'DATING' | 'NETWORKING' | 'FRIENDSHIP' | 'CAMPUS' | 'CASUAL' | 'OPEN_TO_ANY';
export type PersonaType = 'STUDENT' | 'PASSOUT' | 'WORKING_PROFESSIONAL' | 'FREELANCER' | 'CREATOR' | 'OTHER';
export type DiscoveryMode = 'ALL' | 'CAMPUS' | 'PROFESSIONAL' | 'DATING';
export type CampusStatus = 'ALL' | 'STUDENT' | 'PASSOUT';

export type ChallengeLifecycleStatus =
  | 'PENDING'
  | 'VERIFYING'
  | 'CHECKING_ELIGIBILITY'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'FAILED'
  | 'MAX_ATTEMPTS_EXCEEDED';

export interface College {
  id: number;
  name: string;
  shortName?: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified: boolean;
  usageCount: number;
}

export interface Company {
  id: number;
  name: string;
  domain?: string;
  industry?: string;
  logoUrl?: string;
  isVerified: boolean;
  usageCount: number;
}

export interface FieldOfStudy {
  id: number;
  name: string;
  category?: string;
  isVerified: boolean;
  usageCount: number;
}

export interface UserProfile {
  id: string;
  handle: string;
  displayName: string;
  email?: string;
  phone?: string;
  college?: string;
  course?: string;
  major: string;
  year: string;
  bio: string;
  interests: string[];
  photos: string[];
  status: VerificationStatus;
  gracePeriodExpiresAt?: string;
  avatar: string;
  personaType?: PersonaType;
  headline?: string;
  organization?: string;
  roleTitle?: string;
  fieldOfStudy?: string;
  isPassout?: boolean;
  age?: number;
  birthdate?: string;
  gender?: Gender;
  genderPreference?: string;
  intent?: ConnectionIntent;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface InstagramChallenge {
  challengeId: string;
  otp: string;
  claimedUsername: string;
  expiresAt: string;
  resendAvailableAt: string;
  communityAccount: string;
  instructions: string;
}

export interface InstagramVerificationStatus {
  challengeId: string;
  status: ChallengeLifecycleStatus;
  verified: boolean;
  failureReason?: string;
  jwtToken?: string;
  user?: UserProfile;
  expiresAt: string;
  limitationNotice?: string;
}

export interface ConnectRequest {
  id: string;
  fromUser: UserProfile;
  toUser?: UserProfile;
  toUserId: string;
  note?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  respondedAt?: string;
}

export interface Connection {
  id: string;
  user: UserProfile;
  connectedAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
  originRequestId?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  connectionId: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
}

export interface PostMediaItem {
  url: string;
  type: 'IMAGE' | 'VIDEO';
}

export interface UserPost {
  id: string;
  author: UserProfile;
  imageUrl: string;
  media?: PostMediaItem[];
  caption: string;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CampusMeme {
  id: string;
  author: UserProfile;
  imageUrl: string;
  caption: string;
  category?: string;
  likesCount: number;
  isLiked?: boolean;
  commentsCount?: number;
  createdAt: string;
}

export type FeedPost = CampusMeme;
export type Meme = CampusMeme;

export interface SyncStats {
  importedCount: number;
  verifiedCount: number;
  graceCount: number;
  restrictedCount: number;
  lastSyncTime: string;
}

export type ReportReason =
  | 'HARASSMENT'
  | 'SPAM'
  | 'INAPPROPRIATE_CONTENT'
  | 'IMPERSONATION'
  | 'OTHER';

export interface BlockedUser {
  id: string;
  blockedUser: UserProfile;
  reason?: string;
  blockedAt: string;
}

export interface DiscoverCard {
  id?: string;
  user: UserProfile;
  isDiscoverable: boolean;
  mainPhotoUrl: string;
  discoveryBio: string;
  showCollege: boolean;
  showPassoutStatus?: boolean;
  showCourse: boolean;
  showInterests: boolean;
  showAge?: boolean;
  showLocation?: boolean;
  showDistance?: boolean;
  showOrganization?: boolean;
  showRole?: boolean;
  showFieldOfStudy?: boolean;
  showIntent?: boolean;
  collegeId?: number;
  college?: string;
  isPassout?: boolean;
  passoutYear?: number;
  companyId?: number;
  organization?: string;
  roleTitle?: string;
  fieldOfStudyId?: number;
  fieldOfStudy?: string;
  age?: number;
  birthdate?: string;
  gender?: Gender;
  intent?: ConnectionIntent;
  location?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  personaType?: PersonaType;
  headline?: string;
  course?: string;
  interests?: string[];
  availablePhotos?: string[];
  allowedMediaUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpandedDiscoveryProfile {
  user: UserProfile;
  discoveryBio: string;
  mainPhotoUrl: string;
  photoGallery: string[];
  college: string;
  course: string;
  interests: string[];
  showCollege: boolean;
  showCourse: boolean;
  showInterests: boolean;
  isConnected: boolean;
  hasPendingRequest: boolean;
  existingConnectionId?: string;
  existingRequestId?: string;
}

export interface UpdateDiscoverCardPayload {
  isDiscoverable?: boolean;
  mainPhotoUrl?: string;
  discoveryBio?: string;
  showCollege?: boolean;
  showPassoutStatus?: boolean;
  showCourse?: boolean;
  showInterests?: boolean;
  showAge?: boolean;
  showLocation?: boolean;
  showDistance?: boolean;
  showOrganization?: boolean;
  showRole?: boolean;
  showFieldOfStudy?: boolean;
  showIntent?: boolean;

  // Real Card Details
  collegeId?: number;
  college?: string;
  customCollegeName?: string;
  isPassout?: boolean;
  passoutYear?: number;
  companyId?: number;
  organization?: string;
  customCompanyName?: string;
  roleTitle?: string;
  fieldOfStudyId?: number;
  fieldOfStudy?: string;
  customFieldOfStudy?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  age?: number;
  birthdate?: string;
  gender?: Gender;
  intent?: ConnectionIntent;
  headline?: string;
  personaType?: PersonaType;
  interests?: string[];
  allowedMediaUrls?: string[];
}

export interface DiscoveryFeedFilterParams {
  includePassed?: boolean;
  mode?: DiscoveryMode;
  campusStatus?: CampusStatus;
  collegeId?: number;
  college?: string;
  fieldOfStudyId?: number;
  fieldOfStudy?: string;
  companyId?: number;
  organization?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  minAge?: number;
  maxAge?: number;
  gender?: Gender | 'ALL';
  intent?: ConnectionIntent | 'ALL';
}

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

export interface AdminUserManagement {
  id: number;
  handle: string;
  displayName: string;
  email: string;
  college?: string;
  course?: string;
  verificationStatus: VerificationStatus;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastVerifiedAt?: string;
}

export interface FollowerSyncLog {
  id: number;
  batchId: string;
  fileName: string;
  totalImported: number;
  verifiedCount: number;
  restrictedCount: number;
  syncedAt: string;
}

export interface AuthSessionLog {
  id: number;
  userType: 'STUDENT' | 'ADMIN';
  userId: number;
  identifier: string;
  activityType: 'LOGIN' | 'LOGOUT';
  loginMethod?: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  details?: string;
  createdAt: string;
}

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface AdminReport {
  id: number;
  reporterId: number;
  reporterHandle: string;
  reporterDisplayName: string;
  reporterAvatarUrl?: string;
  reportedUserId: number;
  reportedUserHandle: string;
  reportedUserDisplayName: string;
  reportedUserAvatarUrl?: string;
  reportedUserAccountStatus: 'ACTIVE' | 'SUSPENDED';
  reason: string;
  details?: string;
  status: ReportStatus;
  actionTaken?: string;
  reviewerNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ResolveReportPayload {
  action: string;
  reviewerNotes?: string;
  suspendReportedUser?: boolean;
}

