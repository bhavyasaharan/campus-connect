import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AuthView } from './pages/AuthView';
import { DiscoveryView } from './pages/DiscoveryView';
import { RequestsView } from './pages/RequestsView';
import { ChatView } from './pages/ChatView';
import { MomentsView } from './pages/MomentsView';
import { AdminPortalView } from './pages/AdminPortalView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ProfileView } from './pages/ProfileView';
import { UserProfileModal } from './components/UserProfileModal';
import { ReportModal } from './components/ReportModal';
import { BlockModal } from './components/BlockModal';
import { RemoveConnectionModal } from './components/RemoveConnectionModal';
import {
  passUserApi,
  resetPassesApi,
  sendConnectRequestApi,
  acceptConnectRequestApi,
  declineConnectRequestApi,
  cancelConnectRequestApi,
  fetchPendingReceivedRequestsApi,
  fetchSentRequestsApi,
  fetchConnectionsApi,
  removeConnectionApi,
  removeConnectionWithUserApi,
  fetchMessagesApi,
  sendMessageApi,
  blockUserApi,
  reportUserApi,
  fetchMemesApi,
  createMemeApi,
  deleteMemeApi,
  likeMemeApi,
  fetchUserPostsApi,
  createUserPostApi,
  updateUserPostApi,
  likeUserPostApi,
  deleteUserPostApi,
  updateUserProfileApi,
  mapUserResponseToProfile,
  fetchDiscoveryFeedApi,
  logoutStudentApi,
  logoutAdminApi,
  fetchCurrentUserProfileApi,
  fetchAdminProfileApi,
} from './services/api';
import { webSocketService } from './services/websocket';
import { useTheme } from './context/ThemeContext';
import {
  UserProfile,
  ConnectRequest,
  Connection,
  ChatMessage,
  CampusMeme,
  UserPost,
  PostMediaItem,
  ReportReason,
  DiscoverCard,
  AdminUser,
} from './types';

export const App: React.FC = () => {
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState<'discovery' | 'requests' | 'chat' | 'moments' | 'profile'>('discovery');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [discoveryCards, setDiscoveryCards] = useState<DiscoverCard[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ConnectRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [memes, setMemes] = useState<CampusMeme[]>([]);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [inspectUserPosts, setInspectUserPosts] = useState<UserPost[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Modal States
  const [inspectUser, setInspectUser] = useState<UserProfile | null>(null);
  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfile | null>(null);
  const [profileReturnState, setProfileReturnState] = useState<{
    tab: 'discovery' | 'requests' | 'chat' | 'moments';
    connectionId?: string | null;
  } | null>(null);
  const [userToReport, setUserToReport] = useState<UserProfile | null>(null);
  const [userToBlock, setUserToBlock] = useState<UserProfile | null>(null);
  const [connectionToRemove, setConnectionToRemove] = useState<{ connectionId?: string; user: UserProfile } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dedicated Admin State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Auth Session Restoration state
  const [isRestoringAuth, setIsRestoringAuth] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('campus_connect_jwt') || localStorage.getItem('campus_connect_admin_jwt'));
  });

  // Restore authenticated session on page refresh/load
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const studentToken = localStorage.getItem('campus_connect_jwt');
      const adminToken = localStorage.getItem('campus_connect_admin_jwt');

      if (adminToken) {
        try {
          const admin = await fetchAdminProfileApi();
          if (isMounted) {
            setAdminUser(admin);
            setIsAdminPortalOpen(true);
          }
        } catch (err) {
          console.debug('Failed to restore admin session', err);
          localStorage.removeItem('campus_connect_admin_jwt');
          if (isMounted) {
            setAdminUser(null);
          }
        }
      }

      if (studentToken) {
        try {
          const profile = await fetchCurrentUserProfileApi();
          if (isMounted) {
            setUser(profile);
            setBackendOnline(true);
          }
        } catch (err) {
          console.debug('Failed to restore student session', err);
          localStorage.removeItem('campus_connect_jwt');
          if (isMounted) {
            setUser(null);
          }
        }
      }

      if (isMounted) {
        setIsRestoringAuth(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdmin = () => {
    if (adminUser) {
      setIsAdminPortalOpen(true);
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setAdminUser(admin);
    setShowAdminLoginModal(false);
    setIsAdminPortalOpen(true);
    showToast(`Welcome to Admin Console, ${admin.fullName}!`);
  };

  const handleAdminLogout = async () => {
    try {
      await logoutAdminApi();
    } catch (err) {
      console.debug('Admin logout API error', err);
    }
    localStorage.removeItem('campus_connect_admin_jwt');
    setAdminUser(null);
    setIsAdminPortalOpen(false);
    showToast('Administrator signed out.');
  };

  // ==========================================
  // On-Demand Tab Loaders (Called Strictly on Click / Selection)
  // ==========================================

  // 1. Discovery Feed Loader (Called on Discovery click)
  const loadDiscoveryData = useCallback(async () => {
    if (!user) return;
    try {
      const remoteCards = await fetchDiscoveryFeedApi(user.id);
      setBackendOnline(true);
      setDiscoveryCards(remoteCards);
      setProfiles(remoteCards.map((c) => c.user));
    } catch (err) {
      console.debug('Failed to load discovery feed', err);
      setBackendOnline(false);
    }
  }, [user?.id]);

  // 2. Requests & Connections Loader (Called on Requests click)
  const loadRequestsData = useCallback(async () => {
    if (!user) return;
    try {
      const [remoteConnections, remoteIncoming, remoteSent] = await Promise.all([
        fetchConnectionsApi(user.id).catch(() => [] as Connection[]),
        fetchPendingReceivedRequestsApi(user.id).catch(() => [] as ConnectRequest[]),
        fetchSentRequestsApi(user.id).catch(() => [] as ConnectRequest[]),
      ]);
      setConnections(remoteConnections);
      setIncomingRequests(remoteIncoming);
      setOutgoingRequests(remoteSent);
    } catch (err) {
      console.debug('Failed to load requests data', err);
    }
  }, [user?.id]);

  // 3. Chat Conversations Loader (Called on Chat click)
  const loadChatData = useCallback(async () => {
    if (!user) return;
    try {
      const remoteConnections = await fetchConnectionsApi(user.id).catch(() => [] as Connection[]);
      setConnections(remoteConnections);
    } catch (err) {
      console.debug('Failed to load chat data', err);
    }
  }, [user?.id]);

  // 4. Memes / Humor Loader (Called on Memes click)
  const loadMemesData = useCallback(async () => {
    try {
      const remoteMemes = await fetchMemesApi(undefined, user?.id).catch(() => [] as CampusMeme[]);
      setMemes(remoteMemes);
    } catch (err) {
      console.debug('Failed to load memes', err);
    }
  }, [user?.id]);

  // 5. Profile & Posts Loader (Called on Profile click)
  const loadProfileData = useCallback(async () => {
    if (!user) return;
    try {
      if (!viewingProfileUser || String(viewingProfileUser.id) === String(user.id)) {
        // Own profile: fetch fresh profile details, own posts, connections, and incoming requests
        const [freshProfile, ownPosts, remoteConnections, remoteIncoming] = await Promise.all([
          fetchCurrentUserProfileApi().catch(() => null),
          fetchUserPostsApi(user.id, user.id).catch(() => [] as UserPost[]),
          fetchConnectionsApi(user.id).catch(() => [] as Connection[]),
          fetchPendingReceivedRequestsApi(user.id).catch(() => [] as ConnectRequest[]),
        ]);
        if (freshProfile) {
          setUser(freshProfile);
        }
        setUserPosts(ownPosts);
        setConnections(remoteConnections);
        setIncomingRequests(remoteIncoming);
      } else {
        // Viewing another student's profile: only load their posts if connected
        const isTargetConnected = connections.some((c) => String(c.user.id) === String(viewingProfileUser.id));
        if (isTargetConnected) {
          const targetPosts = await fetchUserPostsApi(viewingProfileUser.id, user.id).catch(() => [] as UserPost[]);
          setUserPosts(targetPosts);
        } else {
          setUserPosts([]);
        }
      }
    } catch (err) {
      console.debug('Failed to load profile data', err);
    }
  }, [user?.id, viewingProfileUser, connections]);

  // Tab navigation handler: called directly on tab click
  const handleTabChange = useCallback((tab: 'discovery' | 'requests' | 'chat' | 'moments' | 'profile', targetChatConnId?: string) => {
    if (tab !== 'profile') {
      setViewingProfileUser(null);
      setProfileReturnState(null);
    }
    if (tab === 'chat') {
      setActiveConnectionId(targetChatConnId || null);
    }
    setCurrentTab(tab);

    switch (tab) {
      case 'discovery':
        loadDiscoveryData();
        break;
      case 'requests':
        loadRequestsData();
        break;
      case 'chat':
        loadChatData();
        break;
      case 'moments':
        loadMemesData();
        break;
      case 'profile':
        loadProfileData();
        break;
    }
  }, [loadDiscoveryData, loadRequestsData, loadChatData, loadMemesData, loadProfileData]);

  // Open student full profile while remembering the screen we came from
  const handleOpenStudentProfile = useCallback((targetUser: UserProfile) => {
    if (user && String(targetUser.id) === String(user.id)) {
      setViewingProfileUser(null);
      setProfileReturnState(null);
      setCurrentTab('profile');
      return;
    }
    if (currentTab !== 'profile') {
      setProfileReturnState({ tab: currentTab as any, connectionId: activeConnectionId });
    }
    setInspectUser(null);
    setViewingProfileUser(targetUser);
    setCurrentTab('profile');
  }, [currentTab, activeConnectionId, user]);

  // Active tab effect: only triggers loader for the active tab (e.g. Discovery upon initial login)
  useEffect(() => {
    if (!user) return;

    if (currentTab === 'discovery') {
      loadDiscoveryData();
    } else if (currentTab === 'requests') {
      loadRequestsData();
    } else if (currentTab === 'chat') {
      loadChatData();
    } else if (currentTab === 'moments') {
      loadMemesData();
    } else if (currentTab === 'profile') {
      loadProfileData();
    }
  }, [user?.id, currentTab, viewingProfileUser]);

  // Load profile posts whenever inspecting a user modal opens (not memes)
  useEffect(() => {
    if (!inspectUser || !user) {
      setInspectUserPosts([]);
      return;
    }
    const isTargetConnected = String(inspectUser.id) === String(user.id) || connections.some((c) => String(c.user.id) === String(inspectUser.id));
    if (!isTargetConnected) {
      setInspectUserPosts([]);
      return;
    }
    fetchUserPostsApi(inspectUser.id, user.id)
      .then((res) => setInspectUserPosts(res))
      .catch(() => setInspectUserPosts([]));
  }, [inspectUser, user, connections]);

  // Real-time WebSocket connection and user-level subscriptions
  useEffect(() => {
    if (!user) {
      webSocketService.disconnect();
      setWsConnected(false);
      return;
    }

    const unsubStatus = webSocketService.addStatusListener(setWsConnected);

    webSocketService.connect().catch((err) => {
      console.warn('[WebSocket] Connection failed, will retry automatically', err);
    });

    // 1. Subscribe to user-level incoming direct messages
    const unsubUserMsgs = webSocketService.subscribeToUserMessages(user.id, (incoming: any) => {
      const connId = String(incoming.connectionId);
      const newMsg: ChatMessage = {
        id: String(incoming.id),
        connectionId: connId,
        senderId: String(incoming.senderId),
        senderName: incoming.senderName,
        content: incoming.content,
        sentAt: incoming.sentAt
          ? new Date(incoming.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now',
      };

      setMessages((prev) => {
        const existing = prev[connId] || [];
        if (existing.some((m) => m.id === newMsg.id)) return prev;

        // Reconcile optimistic message matching this sender and content
        const pendingIndex = existing.findIndex(
          (m) =>
            (m.id.startsWith('temp_') || m.id.startsWith('msg_')) &&
            String(m.senderId) === String(newMsg.senderId) &&
            m.content === newMsg.content
        );

        if (pendingIndex !== -1) {
          const updated = [...existing];
          updated[pendingIndex] = newMsg;
          return {
            ...prev,
            [connId]: updated,
          };
        }

        return {
          ...prev,
          [connId]: [...existing, newMsg],
        };
      });

      setConnections((prev) =>
        prev.map((c) => {
          if (c.id === connId) {
            const isViewingThisChat = activeConnectionId === connId && currentTab === 'chat';
            return {
              ...c,
              lastMessage: incoming.content,
              lastMessageTime: 'Just now',
              unreadCount: isViewingThisChat ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );

      // Toast notification if sender is someone else and not looking at this conversation
      if (String(incoming.senderId) !== String(user.id)) {
        if (activeConnectionId !== connId || currentTab !== 'chat') {
          showToast(`New message from ${incoming.senderName}: "${incoming.content.slice(0, 32)}"`);
        }
      }
    });

    // 2. Subscribe to user-level real-time unlocked connections
    const unsubUserConns = webSocketService.subscribeToUserConnections(user.id, (newConnDto: any) => {
      const incomingConnId = String(newConnDto.id);
      const incomingOtherUser = mapUserResponseToProfile(newConnDto.user);

      const formattedConn: Connection = {
        id: incomingConnId,
        user: incomingOtherUser,
        connectedAt: 'Just now',
        lastMessage: newConnDto.lastMessage || 'Connection accepted! Chat unlocked.',
        lastMessageTime: 'Just now',
        unreadCount: 0,
      };

      setConnections((prev) => {
        if (prev.some((c) => c.id === incomingConnId)) return prev;
        return [formattedConn, ...prev];
      });

      setIncomingRequests((prev) => prev.filter((r) => r.fromUser.id !== incomingOtherUser.id));
      setOutgoingRequests((prev) =>
        prev.filter((r) => (r.toUser ? r.toUser.id !== incomingOtherUser.id : r.toUserId !== incomingOtherUser.id))
      );

      showToast(`Connection accepted with ${incomingOtherUser.displayName}! Conversation unlocked.`);
    });

    return () => {
      unsubStatus();
      unsubUserMsgs();
      unsubUserConns();
    };
  }, [user, activeConnectionId, currentTab]);

  // Subscribe to connection topic and fetch messages when activeConnectionId changes
  useEffect(() => {
    if (!activeConnectionId || !user) return;

    if (/^\d+$/.test(String(activeConnectionId))) {
      fetchMessagesApi(activeConnectionId, user.id)
        .then((msgs) => {
          if (msgs && msgs.length > 0) {
            setMessages((prev) => ({ ...prev, [activeConnectionId]: msgs }));
          }
        })
        .catch((err) => console.debug('Failed to fetch messages for conn', activeConnectionId, err));
    }

    const unsubConnMsgs = webSocketService.subscribeToConnectionMessages(activeConnectionId, (incoming: any) => {
      const connId = String(incoming.connectionId);
      const newMsg: ChatMessage = {
        id: String(incoming.id),
        connectionId: connId,
        senderId: String(incoming.senderId),
        senderName: incoming.senderName,
        content: incoming.content,
        sentAt: incoming.sentAt
          ? new Date(incoming.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now',
      };

      setMessages((prev) => {
        const existing = prev[connId] || [];
        if (existing.some((m) => m.id === newMsg.id)) return prev;

        const pendingIndex = existing.findIndex(
          (m) =>
            (m.id.startsWith('temp_') || m.id.startsWith('msg_')) &&
            String(m.senderId) === String(newMsg.senderId) &&
            m.content === newMsg.content
        );

        if (pendingIndex !== -1) {
          const updated = [...existing];
          updated[pendingIndex] = newMsg;
          return {
            ...prev,
            [connId]: updated,
          };
        }

        return {
          ...prev,
          [connId]: [...existing, newMsg],
        };
      });
    });

    return () => {
      unsubConnMsgs();
    };
  }, [activeConnectionId, user]);

  const handleLogin = (newUser: UserProfile, token: string) => {
    localStorage.setItem('campus_connect_jwt', token);
    setUser(newUser);
    setCurrentTab('discovery');
    showToast(`Welcome back, ${newUser.displayName}! Instagram verification active.`);
  };

  const handleLogout = async () => {
    if (user) {
      try {
        await logoutStudentApi(user.id);
      } catch (err) {
        console.debug('Logout API error', err);
      }
    }
    localStorage.removeItem('campus_connect_jwt');
    webSocketService.disconnect();
    setUser(null);
  };

  // 1. Pass Action (Swipe / Skip in Discovery)
  const handlePass = async (targetProfile: UserProfile) => {
    setDiscoveryCards((prev) => prev.filter((c) => c.user.id !== targetProfile.id));
    setProfiles((prev) => prev.filter((p) => p.id !== targetProfile.id));

    if (backendOnline && user) {
      try {
        await passUserApi(user.id, targetProfile.id);
      } catch (err) {
        console.debug('Pass API error', err);
      }
    }
  };

  // Reset Passes to re-explore
  const handleResetPasses = async () => {
    if (backendOnline && user) {
      try {
        await resetPassesApi(user.id);
        const refreshedCards = await fetchDiscoveryFeedApi(user.id);
        setDiscoveryCards(refreshedCards);
        setProfiles(refreshedCards.map((c) => c.user));
        showToast('Pass history reset! Profiles are back in Discovery.');
        return;
      } catch (err) {
        console.debug('Reset passes error', err);
      }
    }
    setDiscoveryCards([]);
    setProfiles([]);
    showToast('Pass history reset.');
  };

  // 2. Connect Action (Send Request)
  const handleSendRequest = async (targetProfile: UserProfile, note?: string) => {
    const tempRequestId = `out_${Date.now()}`;
    const newOutgoing: ConnectRequest = {
      id: tempRequestId,
      fromUser: user!,
      toUser: targetProfile,
      toUserId: targetProfile.id,
      note,
      status: 'PENDING',
      createdAt: 'Just now',
    };

    // Optimistically update UI
    setOutgoingRequests((prev) => [newOutgoing, ...prev]);
    setDiscoveryCards((prev) => prev.filter((c) => c.user.id !== targetProfile.id));
    setProfiles((prev) => prev.filter((p) => p.id !== targetProfile.id));
    showToast(`Connect request sent to ${targetProfile.displayName}!`);

    if (backendOnline && user) {
      try {
        const result = await sendConnectRequestApi(user.id, targetProfile.id, note);
        setOutgoingRequests((prev) =>
          prev.map((r) => (r.id === tempRequestId ? { ...r, id: result.id } : r))
        );
      } catch (err: any) {
        console.error('Send request error', err);
        showToast(err.response?.data?.message || 'Error sending request.');
      }
    }
  };

  // 3. Accept Request Action -> MUTUAL CONNECTION & CHAT UNLOCKED
  const handleAcceptRequest = async (request: ConnectRequest) => {
    const newConnId = `conn_${Date.now()}`;
    const newConnection: Connection = {
      id: newConnId,
      user: request.fromUser,
      connectedAt: 'Just now',
      lastMessage: request.note ? `Intro: "${request.note}"` : 'Connection accepted! Chat unlocked.',
      lastMessageTime: 'Just now',
      unreadCount: 0,
    };

    // Remove from incoming requests and add to active connections
    setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
    setConnections((prev) => [newConnection, ...prev]);

    // Initial conversation starter
    const starterMessages: ChatMessage[] = [
      {
        id: `m_intro_${Date.now()}`,
        connectionId: newConnId,
        senderId: request.fromUser.id,
        senderName: request.fromUser.displayName,
        content: request.note
          ? `Hey ${user?.displayName.split(' ')[0]}! ${request.note}`
          : `Hey ${user?.displayName.split(' ')[0]}! Glad we connected on Orbitly! 👋`,
        sentAt: 'Just now',
      },
    ];

    setMessages((prev) => ({
      ...prev,
      [newConnId]: starterMessages,
    }));

    setActiveConnectionId(newConnId);
    setCurrentTab('chat');
    showToast(`Connection accepted with ${request.fromUser.displayName}! Conversation started.`);

    if (backendOnline && user) {
      try {
        const savedConn = await acceptConnectRequestApi(request.id, user.id);
        const realConnId = String(savedConn.id);
        // Sync real backend connection ID
        setConnections((prev) =>
          prev.map((c) => (c.id === newConnId ? { ...c, id: realConnId } : c))
        );
        setActiveConnectionId(realConnId);
        // Migrate initial local messages from newConnId to realConnId
        setMessages((prev) => {
          const oldMsgs = prev[newConnId] || [];
          const existingReal = prev[realConnId] || [];
          const updatedOldMsgs = oldMsgs.map((m) => ({ ...m, connectionId: realConnId }));
          const next = { ...prev };
          delete next[newConnId];
          next[realConnId] = existingReal.length > 0 ? existingReal : updatedOldMsgs;
          return next;
        });

        if (/^\d+$/.test(realConnId)) {
          const remoteMsgs = await fetchMessagesApi(realConnId, user.id);
          if (remoteMsgs && remoteMsgs.length > 0) {
            setMessages((prev) => ({
              ...prev,
              [realConnId]: remoteMsgs,
            }));
          }
        }
      } catch (err: any) {
        console.error('Accept connect error', err);
        setConnections((prev) => prev.filter((c) => c.id !== newConnId));
        setIncomingRequests((prev) => [request, ...prev]);
        showToast(err.response?.data?.message || 'Error accepting request.');
      }
    }
  };

  // 4. Decline Request Action
  const handleDeclineRequest = async (requestId: string) => {
    const target = incomingRequests.find((r) => r.id === requestId);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    showToast('Connection request declined.');

    if (backendOnline && user) {
      try {
        await declineConnectRequestApi(requestId, user.id);
      } catch (err: any) {
        console.error('Decline error', err);
        if (target) setIncomingRequests((prev) => [target, ...prev]);
        showToast(err.response?.data?.message || 'Error declining request.');
      }
    }
  };

  // 5. Cancel Sent Request Action
  const handleCancelSentRequest = async (requestId: string) => {
    const target = outgoingRequests.find((r) => r.id === requestId);
    setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
    showToast('Outgoing connection request cancelled.');

    if (backendOnline && user) {
      try {
        await cancelConnectRequestApi(requestId, user.id);
      } catch (err: any) {
        console.error('Cancel sent request error', err);
        if (target) setOutgoingRequests((prev) => [target, ...prev]);
        showToast(err.response?.data?.message || 'Error cancelling request.');
      }
    }
  };

  // Remove Connection Action
  const handleConfirmRemoveConnection = async (connectionId: string, targetUser: UserProfile) => {
    // Optimistically remove from state
    setConnections((prev) =>
      prev.filter((c) => (connectionId ? c.id !== connectionId : c.user.id !== targetUser.id))
    );
    if (activeConnectionId === connectionId) {
      setActiveConnectionId(null);
    }
    showToast(`Removed connection with @${targetUser.handle}.`);

    if (backendOnline && user) {
      try {
        if (connectionId) {
          await removeConnectionApi(connectionId, user.id);
        } else {
          await removeConnectionWithUserApi(targetUser.id, user.id);
        }
      } catch (err: any) {
        console.error('Remove connection error', err);
        showToast(err.response?.data?.message || 'Error removing connection.');
      }
    }
  };

  // 6. Messaging Action (Unlocked Conversation)
  const handleSendMessage = async (connectionId: string, content: string) => {
    if (!user) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      connectionId,
      senderId: user.id,
      senderName: user.displayName,
      content,
      sentAt: 'Just now',
    };

    setMessages((prev) => ({
      ...prev,
      [connectionId]: [...(prev[connectionId] || []), optimisticMsg],
    }));

    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, lastMessage: content, lastMessageTime: 'Just now' } : c
      )
    );

    if (backendOnline) {
      try {
        const savedMsg = await sendMessageApi(connectionId, user.id, content);
        setMessages((prev) => {
          const current = prev[connectionId] || [];
          const hasReal = current.some((m) => m.id === savedMsg.id);
          if (hasReal) {
            // Already added or replaced via WebSocket, remove temp message
            return {
              ...prev,
              [connectionId]: current.filter((m) => m.id !== tempId),
            };
          }
          // Replace temp with savedMsg
          return {
            ...prev,
            [connectionId]: current.map((m) => (m.id === tempId ? savedMsg : m)),
          };
        });
      } catch (err: any) {
        console.error('Send message error', err);
        setMessages((prev) => ({
          ...prev,
          [connectionId]: (prev[connectionId] || []).filter((m) => m.id !== tempId),
        }));
        showToast(err.response?.data?.message || 'Error delivering message.');
      }
    }
  };

  // 7. Block User Action
  const handleBlockUser = async (targetUser: UserProfile, reason?: string) => {
    if (!user) return;

    // Remove user everywhere from state
    setConnections((prev) => prev.filter((c) => c.user.id !== targetUser.id));
    setIncomingRequests((prev) => prev.filter((r) => r.fromUser.id !== targetUser.id));
    setOutgoingRequests((prev) =>
      prev.filter((r) => (r.toUser ? r.toUser.id !== targetUser.id : r.toUserId !== targetUser.id))
    );
    setProfiles((prev) => prev.filter((p) => p.id !== targetUser.id));
    setDiscoveryCards((prev) => prev.filter((c) => c.user.id !== targetUser.id));

    // Reset active connection if it was with this user
    setActiveConnectionId((prev) => {
      const active = connections.find((c) => c.id === prev);
      return active && active.user.id === targetUser.id ? null : prev;
    });

    showToast(`@${targetUser.handle} has been blocked.`);

    if (backendOnline) {
      try {
        await blockUserApi(user.id, targetUser.id, reason);
      } catch (err: any) {
        console.error('Block user error', err);
        showToast(err.response?.data?.message || 'Error blocking user.');
      }
    }
  };

  // 8. Report User Action
  const handleReportUser = async (targetUser: UserProfile, reason: ReportReason, details?: string) => {
    if (!user) return;

    if (backendOnline) {
      try {
        await reportUserApi(user.id, targetUser.id, reason, details);
        showToast(`Report received for @${targetUser.handle}. Safety team notified.`);
      } catch (err: any) {
        console.error('Report user error', err);
        showToast(err.response?.data?.message || 'Error submitting report.');
      }
    } else {
      showToast(`Report received for @${targetUser.handle}. Safety team notified.`);
    }
  };

  // 9. Profile Update Action (Social-Room feature)
  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    showToast('Profile updated successfully!');

    if (backendOnline && user) {
      try {
        const saved = await updateUserProfileApi({
          displayName: updatedProfile.displayName,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          college: updatedProfile.college,
          course: updatedProfile.course || updatedProfile.major,
          department: updatedProfile.major,
          graduationYear: updatedProfile.year,
          bio: updatedProfile.bio,
          avatarUrl: updatedProfile.avatar,
          interests: updatedProfile.interests,
          personaType: updatedProfile.personaType,
          headline: updatedProfile.headline,
          organization: updatedProfile.organization,
          roleTitle: updatedProfile.roleTitle,
          fieldOfStudy: updatedProfile.fieldOfStudy,
          isPassout: updatedProfile.isPassout,
          age: updatedProfile.age,
          birthdate: updatedProfile.birthdate,
        });
        setUser(saved);
      } catch (err: any) {
        console.error('Update profile error', err);
        showToast(err.response?.data?.message || 'Error saving profile.');
        throw err;
      }
    }
  };

  // ==========================================
  // Student Profile Posts Handlers (Profile Only)
  // ==========================================
  const handleCreatePost = async (caption: string, imageUrl: string, media?: PostMediaItem[]) => {
    if (!user) return;
    const tempId = `post_${Date.now()}`;
    const initialMedia = media && media.length > 0 ? media : (imageUrl ? [{ url: imageUrl, type: 'IMAGE' as const }] : []);
    const newPost: UserPost = {
      id: tempId,
      author: user,
      imageUrl: imageUrl || (initialMedia[0]?.url || ''),
      media: initialMedia,
      caption,
      likesCount: 0,
      isLiked: false,
      createdAt: 'Just now',
    };
    setUserPosts((prev) => [newPost, ...prev]);
    showToast('Post published to your profile! 📸');

    if (backendOnline) {
      try {
        const saved = await createUserPostApi({
          authorId: user.id,
          caption,
          imageUrl: newPost.imageUrl,
          media: newPost.media,
        });
        setUserPosts((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
      } catch (err: any) {
        console.error('Create profile post error', err);
        showToast(err.response?.data?.message || 'Error publishing post.');
      }
    }
  };

  const handleEditPost = async (postId: string, caption: string, media?: PostMediaItem[]) => {
    if (!user) return;
    setUserPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              caption,
              media: media && media.length > 0 ? media : p.media,
              imageUrl: media && media.length > 0 ? media[0].url : p.imageUrl,
              updatedAt: 'Just now',
            }
          : p
      )
    );
    showToast('Post updated successfully! ✨');

    if (backendOnline) {
      try {
        const updated = await updateUserPostApi(postId, {
          caption,
          media,
          userId: user.id,
        });
        setUserPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      } catch (err: any) {
        console.error('Edit profile post error', err);
        showToast(err.response?.data?.message || 'Error updating post.');
      }
    }
  };

  const handleLikePost = async (postId: string) => {
    setUserPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    if (backendOnline && user) {
      try {
        const updated = await likeUserPostApi(postId, user.id);
        setUserPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likesCount: updated.likesCount, isLiked: updated.isLiked } : p
          )
        );
      } catch (err) {
        console.debug('Like post error', err);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast('Profile post deleted.');

    if (backendOnline && user) {
      try {
        await deleteUserPostApi(postId, user.id);
      } catch (err: any) {
        console.error('Delete post error', err);
        showToast(err.response?.data?.message || 'Error deleting post.');
      }
    }
  };

  // ==========================================
  // Campus Memes Handlers (Memes Section Only)
  // ==========================================
  const handleAddMeme = async (caption: string, imageUrl: string, category: string = 'All Memes') => {
    if (!user) return;
    const tempId = `meme_${Date.now()}`;
    const newMeme: CampusMeme = {
      id: tempId,
      author: user,
      imageUrl,
      caption,
      category,
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      createdAt: 'Just now',
    };
    setMemes((prev) => [newMeme, ...prev]);
    showToast('Meme dropped to Campus Memes! 🔥');

    if (backendOnline) {
      try {
        const saved = await createMemeApi(user.id, caption, imageUrl, category);
        setMemes((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      } catch (err: any) {
        console.error('Create meme error', err);
        showToast(err.response?.data?.message || 'Error posting meme.');
      }
    }
  };

  const handleLikeMeme = async (memeId: string) => {
    setMemes((prev) =>
      prev.map((m) => {
        if (m.id === memeId) {
          const isLiked = !m.isLiked;
          return {
            ...m,
            isLiked,
            likesCount: isLiked ? m.likesCount + 1 : Math.max(0, m.likesCount - 1),
          };
        }
        return m;
      })
    );

    if (backendOnline && user) {
      try {
        const updated = await likeMemeApi(memeId, user.id);
        setMemes((prev) =>
          prev.map((m) =>
            m.id === memeId ? { ...m, likesCount: updated.likesCount, isLiked: updated.isLiked } : m
          )
        );
      } catch (err) {
        console.debug('Like meme error', err);
      }
    }
  };

  const handleDeleteMeme = async (memeId: string) => {
    setMemes((prev) => prev.filter((m) => m.id !== memeId));
    showToast('Meme deleted.');

    if (backendOnline && user) {
      try {
        await deleteMemeApi(memeId, user.id);
      } catch (err: any) {
        console.error('Delete meme error', err);
        showToast(err.response?.data?.message || 'Error deleting meme.');
      }
    }
  };

  // Show clean loading state while restoring existing session from JWT
  if (isRestoringAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: theme.background,
          color: theme.primaryText,
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin" />
          <p className="text-xs text-zinc-400 tracking-wider uppercase font-medium">Restoring session...</p>
        </div>
      </div>
    );
  }

  // Dedicated Administrator Portal Screen
  if (isAdminPortalOpen && adminUser) {
    return (
      <AdminPortalView
        admin={adminUser}
        onExit={() => setIsAdminPortalOpen(false)}
        onLogout={handleAdminLogout}
      />
    );
  }

  // If no user is logged in, show Instagram DM Auth screen with staff admin entry
  if (!user) {
    return (
      <>
        <AuthView onLogin={handleLogin} onOpenAdminLogin={handleOpenAdmin} />
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      </>
    );
  }

  const unreadCount = connections.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div
      className={`flex flex-col relative transition-colors duration-200 ${
        currentTab === 'chat' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}
      style={{
        backgroundColor: theme.background,
        color: theme.primaryText,
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border border-pink-500/50 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
          <span className="w-2 h-2 rounded-full bg-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab: string) => handleTabChange(tab as any)}
        pendingRequestsCount={incomingRequests.length}
        unreadMessagesCount={unreadCount}
        user={user}
        backendOnline={backendOnline}
        wsConnected={wsConnected}
        onLogout={handleLogout}
      />

      {/* Main Views */}
      <main className={`flex-1 min-h-0 ${currentTab === 'chat' ? 'overflow-hidden flex flex-col p-0' : 'pb-24 md:pb-8'}`}>
        {currentTab === 'discovery' && (
          <DiscoveryView
            cards={discoveryCards}
            profiles={profiles}
            currentUserId={user.id}
            currentUser={user}
            onSendRequest={handleSendRequest}
            onPass={handlePass}
            onResetPasses={handleResetPasses}
            onBlock={(p) => setUserToBlock(p)}
            onReport={(p) => setUserToReport(p)}
            onViewProfile={(p) => setInspectUser(p)}
            onOpenChatWithConnection={(cid) => {
              setActiveConnectionId(cid);
              handleTabChange('chat', cid);
            }}
            onRemoveConnection={(cid, u) => setConnectionToRemove({ connectionId: cid, user: u })}
          />
        )}

        {currentTab === 'requests' && (
          <RequestsView
            connections={connections}
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            onCancelSent={handleCancelSentRequest}
            onOpenChatWithConnection={(cid) => {
              setActiveConnectionId(cid);
              handleTabChange('chat', cid);
            }}
            onViewProfile={(u) => setInspectUser(u)}
            onOpenFullProfile={handleOpenStudentProfile}
            onBlockUser={(u) => setUserToBlock(u)}
            onReportUser={(u) => setUserToReport(u)}
            onRemoveConnection={(cid, u) => setConnectionToRemove({ connectionId: cid, user: u })}
          />
        )}

        {currentTab === 'chat' && (
          <ChatView
            connections={connections}
            activeConnectionId={activeConnectionId}
            setActiveConnectionId={setActiveConnectionId}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={user}
            wsConnected={wsConnected}
            onViewProfile={(u) => setInspectUser(u)}
            onOpenFullProfile={handleOpenStudentProfile}
            onBlockUser={(u) => setUserToBlock(u)}
            onReportUser={(u) => setUserToReport(u)}
            onRemoveConnection={(cid, u) => setConnectionToRemove({ connectionId: cid, user: u })}
          />
        )}

        {currentTab === 'moments' && (
          <MomentsView
            memes={memes}
            currentUser={user}
            onLikeMeme={handleLikeMeme}
            onAddMeme={handleAddMeme}
            onDeleteMeme={handleDeleteMeme}
            onViewProfile={(u) => setInspectUser(u)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            user={viewingProfileUser || user}
            currentUser={user}
            connections={connections}
            posts={userPosts}
            pendingRequestsCount={incomingRequests.length}
            onUpdateProfile={handleUpdateProfile}
            onCreatePost={handleCreatePost}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onLikePost={handleLikePost}
            onNavigateTab={(tab) => handleTabChange(tab as any)}
            onBack={() => {
              if (viewingProfileUser) {
                setViewingProfileUser(null);
                const returnState = profileReturnState;
                setProfileReturnState(null);
                const returnTab = returnState?.tab || 'discovery';
                handleTabChange(returnTab, returnState?.connectionId || undefined);
              } else {
                handleTabChange('discovery');
              }
            }}
            onOpenChatWithConnection={(cid) => {
              setViewingProfileUser(null);
              setActiveConnectionId(cid);
              handleTabChange('chat', cid);
            }}
            onSendConnectRequest={handleSendRequest}
            onViewProfile={(u) => {
              if (String(u.id) === String(user.id)) {
                setViewingProfileUser(null);
              } else {
                handleOpenStudentProfile(u);
              }
            }}
            onRemoveConnection={(cid, u) => setConnectionToRemove({ connectionId: cid, user: u })}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Profile Inspection Modal */}
      {inspectUser && (
        <UserProfileModal
          user={inspectUser}
          isConnected={connections.some((c) => String(c.user.id) === String(inspectUser.id))}
          userPosts={inspectUserPosts}
          onClose={() => setInspectUser(null)}
          onConnect={(u) => handleSendRequest(u)}
          onOpenChat={(u) => {
            const conn = connections.find((c) => String(c.user.id) === String(u.id));
            if (conn) {
              setInspectUser(null);
              setActiveConnectionId(conn.id);
              handleTabChange('chat', conn.id);
            }
          }}
          onOpenFullProfile={(u) => {
            const isConn = connections.some((c) => String(c.user.id) === String(u.id)) || String(u.id) === String(user?.id);
            if (isConn) {
              handleOpenStudentProfile(u);
            }
          }}
          onRemoveConnection={(u) => {
            const conn = connections.find((c) => c.user.id === u.id);
            setConnectionToRemove({ connectionId: conn?.id, user: u });
          }}
          onBlock={(u) => setUserToBlock(u)}
          onReport={(u) => setUserToReport(u)}
        />
      )}

      {/* Remove Connection Modal */}
      {connectionToRemove && (
        <RemoveConnectionModal
          user={connectionToRemove.user}
          connectionId={connectionToRemove.connectionId}
          onClose={() => setConnectionToRemove(null)}
          onConfirmRemove={handleConfirmRemoveConnection}
        />
      )}

      {/* Block User Modal */}
      {userToBlock && (
        <BlockModal
          user={userToBlock}
          onClose={() => setUserToBlock(null)}
          onConfirmBlock={(u, reason) => handleBlockUser(u, reason)}
        />
      )}

      {/* Report User Modal */}
      {userToReport && (
        <ReportModal
          user={userToReport}
          onClose={() => setUserToReport(null)}
          onSubmitReport={(u, reason, details) => handleReportUser(u, reason, details)}
        />
      )}

      {/* Staff & Admin Console Entry in Footer */}
      {currentTab !== 'chat' && (
        <footer className="py-4 text-center border-t border-slate-900/60 text-xs text-slate-600 hidden md:block">
          <button
            type="button"
            onClick={handleOpenAdmin}
            className="hover:text-purple-400 transition-colors inline-flex items-center gap-1.5 text-[11px]"
          >
            <span>Staff & Administrator Portal</span>
            {adminUser && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
          </button>
        </footer>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
};
