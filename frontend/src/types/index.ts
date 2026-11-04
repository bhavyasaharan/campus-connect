export type VerificationStatus = 'VERIFIED' | 'GRACE_PERIOD' | 'RESTRICTED';

export type ChallengeLifecycleStatus =
  | 'PENDING'
  | 'VERIFYING'
  | 'CHECKING_ELIGIBILITY'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'FAILED'
  | 'MAX_ATTEMPTS_EXCEEDED';

export interface UserProfile {
  id: string;
  handle: string;
  displayName: string;
  major: string;
  year: string;
  bio: string;
  interests: string[];
  photos: string[];
  status: VerificationStatus;
  gracePeriodExpiresAt?: string;
  avatar: string;
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
  toUserId: string;
  note?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface Connection {
  id: string;
  user: UserProfile;
  connectedAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
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

export interface FeedPost {
  id: string;
  author: UserProfile;
  imageUrl: string;
  caption: string;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  createdAt: string;
}

export interface SyncStats {
  importedCount: number;
  verifiedCount: number;
  graceCount: number;
  restrictedCount: number;
  lastSyncTime: string;
}
