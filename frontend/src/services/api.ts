import axios from 'axios';
import {
  UserProfile,
  ConnectRequest,
  Connection,
  ChatMessage,
  UserPost,
  PostMediaItem,
  CampusMeme,
  SyncStats,
  InstagramChallenge,
  InstagramVerificationStatus,
  BlockedUser,
  DiscoverCard,
  ExpandedDiscoveryProfile,
  UpdateDiscoverCardPayload,
  AdminUser,
  AdminUserManagement,
  FollowerSyncLog,
  AuthSessionLog,
  AdminReport,
  ReportStatus,
  ResolveReportPayload,
  College,
  Company,
  FieldOfStudy,
  DiscoveryFeedFilterParams,
} from '../types';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Attach JWT token to requests if present (admin token for /admin endpoints, student token for others)
api.interceptors.request.use((config) => {
  const isAdminRequest = config.url?.startsWith('/admin');
  const token = isAdminRequest
    ? localStorage.getItem('campus_connect_admin_jwt')
    : localStorage.getItem('campus_connect_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await api.get('/users');
    return res.status === 200 && res.data.success === true;
  } catch {
    return false;
  }
};

// ==========================================
// Instagram DM Authentication Endpoints
// ==========================================

export const createInstagramChallenge = async (username: string): Promise<InstagramChallenge> => {
  const res = await api.post('/auth/instagram/challenge', { username });
  return res.data.data;
};

export const resendInstagramChallenge = async (challengeId: string): Promise<InstagramChallenge> => {
  const res = await api.post('/auth/instagram/resend', { challengeId });
  return res.data.data;
};

export const checkInstagramVerificationStatus = async (challengeId: string): Promise<InstagramVerificationStatus> => {
  const res = await api.get(`/auth/instagram/verification/${challengeId}`);
  const data = res.data.data;
  return {
    challengeId: data.challengeId,
    status: data.status,
    verified: data.verified,
    failureReason: data.failureReason,
    jwtToken: data.jwtToken,
    user: data.user ? mapUserResponseToProfile(data.user) : undefined,
    expiresAt: data.expiresAt,
    limitationNotice: data.limitationNotice,
  };
};

export const loginWithVerifiedChallenge = async (challengeId: string): Promise<{ token: string; user: UserProfile }> => {
  const res = await api.post('/auth/instagram/login', { challengeId });
  const data = res.data.data;
  return {
    token: data.token,
    user: mapUserResponseToProfile(data.user),
  };
};

export const simulateDevInstagramDm = async (username: string, otp: string, igsid?: string): Promise<void> => {
  await api.post('/auth/instagram/dev/simulate-dm', {
    username,
    otp,
    igsid,
  });
};

// ==========================================
// Standard Login & OTP Authentication
// ==========================================

export const loginWithPasswordApi = async (
  identifier: string,
  password: string
): Promise<{ token: string; user: UserProfile }> => {
  const res = await api.post('/auth/login', { identifier, password });
  const data = res.data.data;
  return {
    token: data.token,
    user: mapUserResponseToProfile(data.user),
  };
};

export const requestLoginOtpApi = async (
  identifier: string
): Promise<{ identifier: string; expiresInSeconds: number; otp?: string; message: string }> => {
  const res = await api.post('/auth/login/otp/request', { identifier });
  return res.data.data;
};

export const verifyLoginOtpApi = async (
  identifier: string,
  otp: string
): Promise<{ token: string; user: UserProfile }> => {
  const res = await api.post('/auth/login/otp/verify', { identifier, otp });
  const data = res.data.data;
  return {
    token: data.token,
    user: mapUserResponseToProfile(data.user),
  };
};

export const changePasswordApi = async (
  newPassword: string,
  currentPassword?: string,
  userId?: string
): Promise<void> => {
  await api.put('/auth/password', {
    newPassword,
    currentPassword,
    userId: userId ? Number(userId) : undefined,
  });
};

export const logoutStudentApi = async (userId?: string): Promise<void> => {
  await api.post('/auth/logout', null, {
    params: { userId },
  });
};

// ==========================================
// Helper Mapper
// ==========================================

export const mapUserResponseToProfile = (u: any): UserProfile => ({
  id: String(u.id),
  handle: u.handle,
  displayName: u.displayName,
  email: u.email,
  phone: u.phone,
  college: u.college || 'Campus University',
  course: u.course || u.department || 'General Studies',
  major: u.course || u.department || 'General Studies',
  year: u.graduationYear || 'Class of 2026',
  bio: u.bio || 'Campus community member excited to connect.',
  interests: Array.isArray(u.interests) ? u.interests : [],
  photos: u.avatarUrl ? [u.avatarUrl] : [],
  avatar: u.avatarUrl || '',
  status: u.verificationStatus || 'VERIFIED',
  gracePeriodExpiresAt: u.gracePeriodExpiresAt,
  personaType: u.personaType || 'STUDENT',
  headline: u.headline,
  organization: u.organization,
  roleTitle: u.roleTitle,
  fieldOfStudy: u.fieldOfStudy || u.course,
  isPassout: Boolean(u.isPassout ?? u.passout),
  age: u.age,
  birthdate: u.birthdate,
  gender: u.gender || 'PREFER_NOT_TO_SAY',
  genderPreference: u.genderPreference || 'EVERYONE',
  intent: u.intent || 'OPEN_TO_ANY',
  location: u.location,
  latitude: u.latitude,
  longitude: u.longitude,
});

// ==========================================
// Core Social Endpoints
// ==========================================

export const fetchUsers = async (): Promise<UserProfile[]> => {
  const res = await api.get('/users');
  const userList = res.data.data || [];
  return userList.map(mapUserResponseToProfile);
};

// ==========================================
// Connect & Pass Endpoints
// ==========================================

export const fetchCandidatesApi = async (userId: string, includePassed: boolean = false): Promise<UserProfile[]> => {
  const res = await api.get(`/connections/candidates?userId=${userId}&includePassed=${includePassed}`);
  const list = res.data.data || [];
  return list.map(mapUserResponseToProfile);
};

export const passUserApi = async (userId: string, passedUserId: string): Promise<void> => {
  await api.post('/connections/pass', {
    userId: Number(userId),
    passedUserId: Number(passedUserId),
  });
};

export const resetPassesApi = async (userId: string): Promise<void> => {
  await api.post(`/connections/passes/reset?userId=${userId}`);
};

export const sendConnectRequestApi = async (senderId: string, receiverId: string, note?: string): Promise<ConnectRequest> => {
  const res = await api.post('/connections/request', {
    senderId: Number(senderId),
    receiverId: Number(receiverId),
    note,
  });
  const data = res.data.data;
  return {
    id: String(data.id),
    fromUser: mapUserResponseToProfile(data.sender),
    toUser: data.receiver ? mapUserResponseToProfile(data.receiver) : undefined,
    toUserId: String(data.receiverId),
    note: data.note,
    status: data.status,
    createdAt: 'Just now',
  };
};

export const acceptConnectRequestApi = async (requestId: string, currentUserId: string): Promise<Connection> => {
  const res = await api.post(`/connections/requests/${requestId}/accept?currentUserId=${currentUserId}`);
  const data = res.data.data;
  return {
    id: String(data.id),
    user: mapUserResponseToProfile(data.peerUser),
    connectedAt: 'Just now',
    lastMessage: 'Connection accepted! Chat unlocked.',
    originRequestId: data.originRequestId ? String(data.originRequestId) : undefined,
  };
};

export const declineConnectRequestApi = async (requestId: string, currentUserId: string): Promise<void> => {
  await api.post(`/connections/requests/${requestId}/decline?currentUserId=${currentUserId}`);
};

export const cancelConnectRequestApi = async (requestId: string, currentUserId: string): Promise<void> => {
  await api.delete(`/connections/requests/${requestId}/cancel?currentUserId=${currentUserId}`);
};

export const fetchPendingReceivedRequestsApi = async (userId: string): Promise<ConnectRequest[]> => {
  const res = await api.get(`/connections/requests/received?userId=${userId}`);
  const list = res.data.data || [];
  return list.map((data: any) => ({
    id: String(data.id),
    fromUser: mapUserResponseToProfile(data.sender),
    toUser: data.receiver ? mapUserResponseToProfile(data.receiver) : undefined,
    toUserId: String(data.receiverId),
    note: data.note,
    status: data.status,
    createdAt: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
  }));
};

export const fetchSentRequestsApi = async (userId: string): Promise<ConnectRequest[]> => {
  const res = await api.get(`/connections/requests/sent?userId=${userId}`);
  const list = res.data.data || [];
  return list.map((data: any) => ({
    id: String(data.id),
    fromUser: mapUserResponseToProfile(data.sender),
    toUser: data.receiver ? mapUserResponseToProfile(data.receiver) : undefined,
    toUserId: String(data.receiverId),
    note: data.note,
    status: data.status,
    createdAt: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
  }));
};

export const fetchConnectionsApi = async (userId: string): Promise<Connection[]> => {
  const res = await api.get(`/connections/user/${userId}`);
  const list = res.data.data || [];
  return list.map((c: any) => ({
    id: String(c.id),
    user: mapUserResponseToProfile(c.peerUser),
    connectedAt: c.connectedAt ? new Date(c.connectedAt).toLocaleDateString() : 'Connected',
    lastMessage: 'Mutual Connection Active',
    originRequestId: c.originRequestId ? String(c.originRequestId) : undefined,
  }));
};

export const removeConnectionApi = async (connectionId: string, currentUserId?: string): Promise<void> => {
  if (!connectionId || !/^\d+$/.test(String(connectionId))) return;
  await api.delete(`/connections/${connectionId}`, { params: { currentUserId } });
};

export const removeConnectionWithUserApi = async (targetUserId: string, currentUserId?: string): Promise<void> => {
  if (!targetUserId || !/^\d+$/.test(String(targetUserId))) return;
  await api.delete(`/connections/user/${targetUserId}`, { params: { currentUserId } });
};

// ==========================================
// Chat & Messaging Endpoints
// ==========================================

export const fetchMessagesApi = async (connectionId: string, userId: string): Promise<ChatMessage[]> => {
  if (!connectionId || !/^\d+$/.test(String(connectionId))) {
    return [];
  }
  const res = await api.get(`/chat/connections/${connectionId}/messages?userId=${userId}`);
  const list = res.data.data || [];
  return list.map((m: any) => ({
    id: String(m.id),
    connectionId: String(connectionId),
    senderId: String(m.senderId),
    senderName: m.senderName,
    content: m.content,
    sentAt: m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
  }));
};

export const sendMessageApi = async (connectionId: string, senderId: string, content: string): Promise<ChatMessage> => {
  if (!connectionId || !/^\d+$/.test(String(connectionId))) {
    return {
      id: `temp_${Date.now()}`,
      connectionId: String(connectionId),
      senderId: String(senderId),
      senderName: 'You',
      content,
      sentAt: 'Just now',
    };
  }
  const res = await api.post(`/chat/connections/${connectionId}/messages`, {
    senderId: Number(senderId),
    content,
  });
  const data = res.data.data;
  return {
    id: String(data.id),
    connectionId: String(connectionId),
    senderId: String(data.senderId),
    senderName: data.senderName,
    content: data.content,
    sentAt: 'Just now',
  };
};

export const markMessagesReadApi = async (connectionId: string, userId: string): Promise<void> => {
  if (!connectionId || !/^\d+$/.test(String(connectionId))) return;
  await api.patch(`/chat/connections/${connectionId}/read?userId=${userId}`);
};

// ==========================================
// Trust & Safety Endpoints
// ==========================================

export const blockUserApi = async (blockerId: string, blockedId: string, reason?: string): Promise<void> => {
  await api.post('/safety/block', {
    blockerId: Number(blockerId),
    blockedId: Number(blockedId),
    reason,
  });
};

export const unblockUserApi = async (blockerId: string, blockedId: string): Promise<void> => {
  await api.post('/safety/unblock', {
    blockerId: Number(blockerId),
    blockedId: Number(blockedId),
  });
};

export const fetchBlockedUsersApi = async (userId: string): Promise<BlockedUser[]> => {
  const res = await api.get(`/safety/blocked?userId=${userId}`);
  const list = res.data.data || [];
  return list.map((b: any) => ({
    id: String(b.id),
    blockedUser: mapUserResponseToProfile(b.blockedUser),
    reason: b.reason,
    blockedAt: b.blockedAt,
  }));
};

export const reportUserApi = async (
  reporterId: string,
  reportedId: string,
  reason: string,
  details?: string
): Promise<{ id: string; message: string }> => {
  const res = await api.post('/safety/report', {
    reporterId: Number(reporterId),
    reportedId: Number(reportedId),
    reason,
    details,
  });
  return {
    id: String(res.data.data.id),
    message: res.data.message || 'Report received successfully',
  };
};

// ==========================================
// Profile Management Endpoints
// ==========================================

export interface UpdateProfilePayload {
  displayName: string;
  email?: string;
  phone?: string;
  college?: string;
  course?: string;
  department?: string;
  graduationYear?: string;
  bio?: string;
  avatarUrl?: string;
  interests?: string[];
  personaType?: 'STUDENT' | 'PASSOUT' | 'WORKING_PROFESSIONAL' | 'FREELANCER' | 'CREATOR' | 'OTHER';
  headline?: string;
  organization?: string;
  roleTitle?: string;
  fieldOfStudy?: string;
  isPassout?: boolean;
  age?: number;
  birthdate?: string;
  gender?: string;
  genderPreference?: string;
  intent?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export const updateUserProfileApi = async (
  payloadOrUserId: UpdateProfilePayload | string,
  optionalPayload?: UpdateProfilePayload
): Promise<UserProfile> => {
  const payload = typeof payloadOrUserId === 'string' ? optionalPayload! : payloadOrUserId;
  const res = await api.put('/users/profile', payload);
  return mapUserResponseToProfile(res.data.data);
};

export const fetchCurrentUserProfileApi = async (): Promise<UserProfile> => {
  const res = await api.get('/users/me');
  return mapUserResponseToProfile(res.data.data);
};

// ==========================================
// Student Profile Posts Endpoints (Profile Only)
// ==========================================

export const mapUserPostResponse = (p: any): UserPost => {
  const media: PostMediaItem[] = Array.isArray(p.media) && p.media.length > 0
    ? p.media.map((m: any) => ({
        url: m.url,
        type: (m.type || (/\.(mp4|webm|mov|ogg|m4v)$/i.test(m.url) ? 'VIDEO' : 'IMAGE')) as 'IMAGE' | 'VIDEO',
      }))
    : p.imageUrl
    ? [{
        url: p.imageUrl,
        type: (/\.(mp4|webm|mov|ogg|m4v)$/i.test(p.imageUrl) ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
      }]
    : [];

  return {
    id: String(p.id),
    author: mapUserResponseToProfile(p.author),
    imageUrl: p.imageUrl || (media[0]?.url || ''),
    media,
    caption: p.caption,
    likesCount: p.likesCount || 0,
    isLiked: Boolean(p.isLiked),
    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recently',
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : undefined,
  };
};

export const fetchUserPostsApi = async (userId: string, viewerId?: string): Promise<UserPost[]> => {
  const res = await api.get(`/posts/user/${userId}`, {
    params: viewerId ? { viewerId } : {},
  });
  const list = res.data.data || [];
  return list.map(mapUserPostResponse);
};

export interface CreateUserPostPayload {
  authorId: string;
  caption: string;
  imageUrl?: string;
  media?: PostMediaItem[];
}

export const createUserPostApi = async (
  payloadOrAuthorId: CreateUserPostPayload | string,
  caption?: string,
  imageUrl?: string,
  media?: PostMediaItem[]
): Promise<UserPost> => {
  let body: any;
  if (typeof payloadOrAuthorId === 'object') {
    body = {
      authorId: Number(payloadOrAuthorId.authorId),
      caption: payloadOrAuthorId.caption,
      imageUrl: payloadOrAuthorId.imageUrl,
      media: payloadOrAuthorId.media,
    };
  } else {
    body = {
      authorId: Number(payloadOrAuthorId),
      caption: caption || '',
      imageUrl: imageUrl || '',
      media: media || (imageUrl ? [{ url: imageUrl, type: /\.(mp4|webm|mov|ogg|m4v)$/i.test(imageUrl) ? 'VIDEO' : 'IMAGE' }] : []),
    };
  }
  const res = await api.post('/posts', body);
  return mapUserPostResponse(res.data.data);
};

export interface UpdateUserPostPayload {
  caption: string;
  media?: PostMediaItem[];
  userId?: string;
}

export const updateUserPostApi = async (
  postId: string,
  payload: UpdateUserPostPayload
): Promise<UserPost> => {
  const res = await api.put(`/posts/${postId}`, {
    caption: payload.caption,
    media: payload.media,
  }, {
    params: payload.userId ? { userId: payload.userId } : {},
  });
  return mapUserPostResponse(res.data.data);
};

export const likeUserPostApi = async (postId: string, userId?: string): Promise<UserPost> => {
  const res = await api.post(`/posts/${postId}/like`, null, {
    params: userId ? { userId } : {},
  });
  return mapUserPostResponse(res.data.data);
};

export const deleteUserPostApi = async (postId: string, userId: string): Promise<void> => {
  await api.delete(`/posts/${postId}`, { params: { userId } });
};

// ==========================================
// Campus Memes Endpoints (Memes Section Only)
// ==========================================

export const fetchMemesApi = async (category?: string, userId?: string): Promise<CampusMeme[]> => {
  const params: Record<string, string> = {};
  if (category && category !== 'All Memes') {
    params.category = category;
  }
  if (userId) {
    params.userId = userId;
  }
  const res = await api.get('/memes', { params });
  const list = res.data.data || [];
  return list.map((p: any) => ({
    id: String(p.id),
    author: mapUserResponseToProfile(p.author),
    imageUrl: p.imageUrl,
    caption: p.caption,
    category: p.category || 'All Memes',
    likesCount: p.likesCount || 0,
    isLiked: Boolean(p.isLiked),
    commentsCount: 0,
    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent',
  }));
};

export const createMemeApi = async (
  authorId: string,
  caption: string,
  imageUrl: string,
  category: string = 'All Memes'
): Promise<CampusMeme> => {
  const res = await api.post('/memes', {
    authorId: Number(authorId),
    caption,
    imageUrl,
    category,
  });
  const p = res.data.data;
  return {
    id: String(p.id),
    author: mapUserResponseToProfile(p.author),
    imageUrl: p.imageUrl,
    caption: p.caption,
    category: p.category || category,
    likesCount: p.likesCount || 0,
    isLiked: false,
    commentsCount: 0,
    createdAt: 'Just now',
  };
};

export const likeMemeApi = async (memeId: string, userId?: string): Promise<CampusMeme> => {
  const res = await api.post(`/memes/${memeId}/like`, null, {
    params: userId ? { userId } : {},
  });
  const p = res.data.data;
  return {
    id: String(p.id),
    author: mapUserResponseToProfile(p.author),
    imageUrl: p.imageUrl,
    caption: p.caption,
    category: p.category || 'All Memes',
    likesCount: p.likesCount || 0,
    isLiked: Boolean(p.isLiked),
    commentsCount: 0,
    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent',
  };
};

export const deleteMemeApi = async (memeId: string, userId: string): Promise<void> => {
  await api.delete(`/memes/${memeId}`, { params: { userId } });
};

// Backward-compatibility aliases for moments
export const fetchMomentsApi = fetchMemesApi;
export const fetchUserMomentsApi = fetchUserPostsApi;
export const createMomentApi = (authorId: string, caption: string, imageUrl: string) =>
  createMemeApi(authorId, caption, imageUrl, 'All Memes');
export const likeMomentApi = likeMemeApi;
export const deleteMomentApi = deleteMemeApi;

export const uploadFollowersFileApi = async (file: File): Promise<SyncStats> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/admin/sync-followers', formData, {
    headers: { 'Content-Type': undefined },
  });
  const data = res.data.data;
  return {
    importedCount: data.totalImported,
    verifiedCount: data.verifiedCount,
    graceCount: 0,
    restrictedCount: data.restrictedCount,
    lastSyncTime: new Date(data.syncedAt).toLocaleTimeString(),
  };
};

// ==========================================
// Admin Portal & Moderation Endpoints
// ==========================================

export const adminLoginApi = async (
  identifier: string,
  password: string
): Promise<{ token: string; admin: AdminUser }> => {
  const res = await api.post('/admin/auth/login', { identifier, password });
  const data = res.data.data;
  return {
    token: data.token,
    admin: data.admin,
  };
};

export const fetchAdminProfileApi = async (): Promise<AdminUser> => {
  const res = await api.get('/admin/auth/me');
  return res.data.data;
};

export const fetchAdminUsersApi = async (): Promise<AdminUserManagement[]> => {
  const res = await api.get('/admin/users');
  return res.data.data || [];
};

export const suspendUserApi = async (userId: number): Promise<void> => {
  await api.post(`/admin/users/${userId}/suspend`);
};

export const activateUserApi = async (userId: number): Promise<void> => {
  await api.post(`/admin/users/${userId}/activate`);
};

export const fetchFollowerSyncLogsApi = async (): Promise<FollowerSyncLog[]> => {
  const res = await api.get('/admin/sync-logs');
  return res.data.data || [];
};

export const logoutAdminApi = async (): Promise<void> => {
  await api.post('/admin/auth/logout');
};

export const fetchAuthSessionLogsApi = async (): Promise<AuthSessionLog[]> => {
  const res = await api.get('/admin/logs/auth');
  return res.data.data || [];
};

export const fetchAdminReportsApi = async (status?: ReportStatus): Promise<AdminReport[]> => {
  const res = await api.get('/admin/reports', { params: status ? { status } : {} });
  return res.data.data || [];
};

export const fetchPendingReportsCountApi = async (): Promise<number> => {
  const res = await api.get('/admin/reports/pending-count');
  return res.data.data ?? 0;
};

export const resolveAdminReportApi = async (
  reportId: number,
  payload: ResolveReportPayload
): Promise<AdminReport> => {
  const res = await api.post(`/admin/reports/${reportId}/resolve`, payload);
  return res.data.data;
};

export const uploadImageApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': undefined },
  });
  const path: string = res.data.data;
  return path;
};

export const uploadMediaApi = async (file: File): Promise<PostMediaItem> => {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(file.name);
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': undefined },
  });
  const url: string = res.data.data;
  return {
    url,
    type: isVideo ? 'VIDEO' : 'IMAGE',
  };
};

// ==========================================
// Discovery Card Endpoints
// ==========================================

export const mapDiscoverCardResponse = (c: any): DiscoverCard => ({
  id: c.id ? String(c.id) : undefined,
  user: mapUserResponseToProfile(c.user),
  isDiscoverable: c.isDiscoverable ?? c.discoverable ?? true,
  mainPhotoUrl: c.mainPhotoUrl,
  discoveryBio: c.discoveryBio,
  showCollege: c.showCollege ?? true,
  showPassoutStatus: c.showPassoutStatus ?? true,
  showCourse: c.showCourse ?? true,
  showInterests: c.showInterests ?? true,
  showAge: c.showAge ?? true,
  showLocation: c.showLocation ?? true,
  showDistance: c.showDistance ?? true,
  showOrganization: c.showOrganization ?? true,
  showRole: c.showRole ?? true,
  showFieldOfStudy: c.showFieldOfStudy ?? true,
  showIntent: c.showIntent ?? true,
  collegeId: c.collegeId,
  companyId: c.companyId,
  fieldOfStudyId: c.fieldOfStudyId,
  passoutYear: c.passoutYear,
  age: c.age,
  birthdate: c.birthdate,
  gender: c.gender,
  intent: c.intent,
  location: c.location,
  latitude: c.latitude,
  longitude: c.longitude,
  distanceKm: c.distanceKm,
  organization: c.organization,
  roleTitle: c.roleTitle,
  fieldOfStudy: c.fieldOfStudy,
  isPassout: Boolean(c.isPassout ?? c.passout),
  personaType: c.personaType,
  headline: c.headline,
  college: c.college,
  course: c.course,
  interests: Array.isArray(c.interests) ? c.interests : [],
  availablePhotos: c.availablePhotos || [],
  allowedMediaUrls: c.allowedMediaUrls || [],
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

export const mapExpandedProfileResponse = (e: any): ExpandedDiscoveryProfile => ({
  user: mapUserResponseToProfile(e.user),
  discoveryBio: e.discoveryBio,
  mainPhotoUrl: e.mainPhotoUrl,
  photoGallery: e.photoGallery || [],
  college: e.college,
  course: e.course,
  interests: Array.isArray(e.interests) ? e.interests : [],
  showCollege: e.showCollege ?? true,
  showCourse: e.showCourse ?? true,
  showInterests: e.showInterests ?? true,
  isConnected: Boolean(e.isConnected),
  hasPendingRequest: Boolean(e.hasPendingRequest),
  existingConnectionId: e.existingConnectionId,
  existingRequestId: e.existingRequestId,
});

export const fetchMyDiscoverCardApi = async (userId?: string): Promise<DiscoverCard> => {
  const res = await api.get('/discovery/card/me', { params: { userId } });
  return mapDiscoverCardResponse(res.data.data);
};

export const updateMyDiscoverCardApi = async (
  payload: UpdateDiscoverCardPayload,
  userId?: string
): Promise<DiscoverCard> => {
  const res = await api.put('/discovery/card/me', payload, { params: { userId } });
  return mapDiscoverCardResponse(res.data.data);
};

export const fetchDiscoveryFeedApi = async (
  userId?: string,
  includePassedOrFilters: boolean | DiscoveryFeedFilterParams = false
): Promise<DiscoverCard[]> => {
  let params: any = { userId };
  if (typeof includePassedOrFilters === 'boolean') {
    params.includePassed = includePassedOrFilters;
  } else if (includePassedOrFilters) {
    params = { ...params, ...includePassedOrFilters };
  }
  const res = await api.get('/discovery/feed', { params });
  return (res.data.data || []).map(mapDiscoverCardResponse);
};

export const fetchExpandedDiscoveryProfileApi = async (
  targetUserId: string,
  userId?: string
): Promise<ExpandedDiscoveryProfile> => {
  const res = await api.get(`/discovery/cards/${targetUserId}/expanded`, { params: { userId } });
  return mapExpandedProfileResponse(res.data.data);
};

// ==========================================
// Catalog Autocomplete Endpoints
// ==========================================

export const searchCollegesApi = async (query?: string, limit = 20): Promise<College[]> => {
  const res = await api.get('/catalogs/colleges', { params: { q: query, limit } });
  return res.data;
};

export const createCollegeApi = async (payload: { name: string; city?: string; state?: string }): Promise<College> => {
  const res = await api.post('/catalogs/colleges', payload);
  return res.data;
};

export const searchCompaniesApi = async (query?: string, limit = 20): Promise<Company[]> => {
  const res = await api.get('/catalogs/companies', { params: { q: query, limit } });
  return res.data;
};

export const createCompanyApi = async (payload: { name: string; industry?: string }): Promise<Company> => {
  const res = await api.post('/catalogs/companies', payload);
  return res.data;
};

export const searchFieldsOfStudyApi = async (query?: string, limit = 20): Promise<FieldOfStudy[]> => {
  const res = await api.get('/catalogs/fields-of-study', { params: { q: query, limit } });
  return res.data;
};

export const createFieldOfStudyApi = async (payload: { name: string; category?: string }): Promise<FieldOfStudy> => {
  const res = await api.post('/catalogs/fields-of-study', payload);
  return res.data;
};


