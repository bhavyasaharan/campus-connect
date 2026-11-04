import axios from 'axios';
import {
  UserProfile,
  ConnectRequest,
  Connection,
  ChatMessage,
  FeedPost,
  SyncStats,
  InstagramChallenge,
  InstagramVerificationStatus,
} from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campus_connect_jwt');
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
    user: data.user
      ? {
          id: String(data.user.id),
          handle: data.user.handle,
          displayName: data.user.displayName,
          major: data.user.department || 'Campus Member',
          year: data.user.graduationYear || 'Class of 2026',
          bio: data.user.bio || '',
          interests: ['Verified Student', 'Instagram Follower'],
          photos: [data.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'],
          avatar: data.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          status: data.user.verificationStatus,
        }
      : undefined,
    expiresAt: data.expiresAt,
    limitationNotice: data.limitationNotice,
  };
};

export const loginWithVerifiedChallenge = async (challengeId: string): Promise<{ token: string; user: UserProfile }> => {
  const res = await api.post('/auth/instagram/login', { challengeId });
  const data = res.data.data;
  return {
    token: data.token,
    user: {
      id: String(data.user.id),
      handle: data.user.handle,
      displayName: data.user.displayName,
      major: data.user.department || 'Campus Member',
      year: data.user.graduationYear || 'Class of 2026',
      bio: data.user.bio || '',
      interests: ['Verified Student', 'Instagram Follower'],
      photos: [data.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'],
      avatar: data.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      status: data.user.verificationStatus,
    },
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
// Core Social Endpoints
// ==========================================

export const fetchUsers = async (): Promise<UserProfile[]> => {
  const res = await api.get('/users');
  const userList = res.data.data || [];
  return userList.map((u: any) => ({
    id: String(u.id),
    handle: u.handle,
    displayName: u.displayName,
    major: u.department || 'General Studies',
    year: u.graduationYear || 'Class of 2026',
    bio: u.bio || '',
    interests: ['Campus', 'Student'],
    photos: [u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800'],
    avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    status: u.verificationStatus,
    gracePeriodExpiresAt: u.gracePeriodExpiresAt,
  }));
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
    fromUser: {
      id: String(data.sender.id),
      handle: data.sender.handle,
      displayName: data.sender.displayName,
      major: data.sender.department,
      year: data.sender.graduationYear,
      bio: data.sender.bio,
      interests: [],
      photos: [],
      avatar: data.sender.avatarUrl,
      status: data.sender.verificationStatus,
    },
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
    user: {
      id: String(data.peerUser.id),
      handle: data.peerUser.handle,
      displayName: data.peerUser.displayName,
      major: data.peerUser.department,
      year: data.peerUser.graduationYear,
      bio: data.peerUser.bio,
      interests: [],
      photos: [],
      avatar: data.peerUser.avatarUrl,
      status: data.peerUser.verificationStatus,
    },
    connectedAt: 'Just now',
    lastMessage: 'Connection accepted!',
  };
};

export const fetchMessagesApi = async (connectionId: string, userId: string): Promise<ChatMessage[]> => {
  const res = await api.get(`/connections/${connectionId}/messages?userId=${userId}`);
  const list = res.data.data || [];
  return list.map((m: any) => ({
    id: String(m.id),
    connectionId: String(connectionId),
    senderId: String(m.senderId),
    senderName: m.senderName,
    content: m.content,
    sentAt: new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));
};

export const sendMessageApi = async (connectionId: string, senderId: string, content: string): Promise<ChatMessage> => {
  const res = await api.post(`/connections/${connectionId}/messages`, {
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

export const fetchMomentsApi = async (): Promise<FeedPost[]> => {
  const res = await api.get('/moments');
  const list = res.data.data || [];
  return list.map((p: any) => ({
    id: String(p.id),
    author: {
      id: String(p.author.id),
      handle: p.author.handle,
      displayName: p.author.displayName,
      avatar: p.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      status: p.author.verificationStatus,
      major: p.author.department,
      year: p.author.graduationYear,
      bio: p.author.bio,
      interests: [],
      photos: [],
    },
    imageUrl: p.imageUrl,
    caption: p.caption,
    likesCount: p.likesCount,
    commentsCount: p.commentsCount,
    createdAt: 'Recent',
  }));
};

export const uploadFollowersFileApi = async (file: File): Promise<SyncStats> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/admin/sync-followers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
