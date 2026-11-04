import { UserProfile, ConnectRequest, Connection, ChatMessage, FeedPost } from '../types';

export const currentUser: UserProfile | null = null;

export const sampleProfiles: UserProfile[] = [];

export const initialRequests: ConnectRequest[] = [];

export const initialConnections: Connection[] = [];

export const initialMessages: Record<string, ChatMessage[]> = {};

export const sampleMoments: FeedPost[] = [];
