import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthView } from './pages/AuthView';
import { DiscoveryView } from './pages/DiscoveryView';
import { RequestsView } from './pages/RequestsView';
import { ChatView } from './pages/ChatView';
import { MomentsView } from './pages/MomentsView';
import { FollowerSyncAdmin } from './pages/FollowerSyncAdmin';
import { ProfileView } from './pages/ProfileView';
import { fetchUsers, fetchMomentsApi } from './services/api';
import { UserProfile, ConnectRequest, Connection, ChatMessage, FeedPost, SyncStats } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'discovery' | 'requests' | 'chat' | 'moments' | 'admin' | 'profile'>('discovery');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ConnectRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Fetch community data only when user is authenticated, without recurring polling loops
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const loadAppData = async () => {
      try {
        const [remoteUsers, remoteMoments] = await Promise.all([
          fetchUsers(),
          fetchMomentsApi().catch(() => [] as FeedPost[]),
        ]);
        if (isMounted) {
          setBackendOnline(true);
          setProfiles(remoteUsers);
          setPosts(remoteMoments);
        }
      } catch (err) {
        if (isMounted) {
          setBackendOnline(false);
          console.debug('Backend unreachable or error loading initial data');
        }
      }
    };

    loadAppData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogin = (newUser: UserProfile, token: string) => {
    localStorage.setItem('campus_connect_jwt', token);
    setUser(newUser);
    setCurrentTab('discovery');
  };

  const handleLogout = () => {
    localStorage.removeItem('campus_connect_jwt');
    setUser(null);
  };

  // If no user is logged in, show the new Instagram DM Auth screen
  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

  // Send a Connect Request to a profile
  const handleSendRequest = (targetProfile: UserProfile, note?: string) => {
    const newOutgoing: ConnectRequest = {
      id: `out_${Date.now()}`,
      fromUser: targetProfile,
      toUserId: targetProfile.id,
      note,
      status: 'PENDING',
      createdAt: 'Just now',
    };
    setOutgoingRequests((prev) => [newOutgoing, ...prev]);
  };

  // Accept an incoming Connect Request -> UNLOCKS CHAT
  const handleAcceptRequest = (request: ConnectRequest) => {
    const newConnId = `conn_${Date.now()}`;
    const newConnection: Connection = {
      id: newConnId,
      user: request.fromUser,
      connectedAt: 'Just now',
      lastMessage: request.note ? `Connected! "${request.note}"` : 'Connection accepted! Say hi 👋',
      lastMessageTime: 'Just now',
      unreadCount: 0,
    };

    setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
    setConnections((prev) => [newConnection, ...prev]);

    // Initial greeting in the chat
    const initialChatMessages: ChatMessage[] = [
      {
        id: `m_intro_${Date.now()}`,
        connectionId: newConnId,
        senderId: request.fromUser.id,
        senderName: request.fromUser.displayName,
        content: request.note
          ? `Hey ${user.displayName.split(' ')[0]}! ${request.note}`
          : `Hey ${user.displayName.split(' ')[0]}! Glad we connected on CampusConnect! 👋`,
        sentAt: 'Just now',
      },
    ];

    setMessages((prev) => ({
      ...prev,
      [newConnId]: initialChatMessages,
    }));

    setActiveConnectionId(newConnId);
    setCurrentTab('chat');
  };

  // Decline request
  const handleDeclineRequest = (requestId: string) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  // Send message in active chat
  const handleSendMessage = (connectionId: string, content: string) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      connectionId,
      senderId: user.id,
      senderName: user.displayName,
      content,
      sentAt: 'Just now',
    };

    setMessages((prev) => ({
      ...prev,
      [connectionId]: [...(prev[connectionId] || []), newMsg],
    }));

    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, lastMessage: content, lastMessageTime: 'Just now' } : c
      )
    );

    // Realistic auto-reply from classmate after 1.5s
    const targetConn = connections.find((c) => c.id === connectionId);
    if (targetConn) {
      setTimeout(() => {
        const autoReplies = [
          'Awesome! Are you around the quad or engineering building today?',
          'Sounds great! Let’s definitely link up after classes.',
          'Haha totally agree! By the way, check out the new campus moment I just shared.',
        ];
        const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];

        const replyMsg: ChatMessage = {
          id: `reply_${Date.now()}`,
          connectionId,
          senderId: targetConn.user.id,
          senderName: targetConn.user.displayName,
          content: replyText,
          sentAt: 'Just now',
        };

        setMessages((prev) => ({
          ...prev,
          [connectionId]: [...(prev[connectionId] || []), replyMsg],
        }));

        setConnections((prev) =>
          prev.map((c) =>
            c.id === connectionId ? { ...c, lastMessage: replyText, lastMessageTime: 'Just now' } : c
          )
        );
      }, 1500);
    }
  };

  // Like a post
  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1,
          };
        }
        return p;
      })
    );
  };

  // Add new post to campus moments
  const handleAddPost = (caption: string, imageUrl: string) => {
    const newPost: FeedPost = {
      id: `post_${Date.now()}`,
      author: user,
      imageUrl,
      caption,
      likesCount: 1,
      isLiked: true,
      commentsCount: 0,
      createdAt: 'Just now',
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  // Complete Follower Reconciliation Sync
  const handleSyncComplete = (verifiedHandles: Set<string>, _stats: SyncStats) => {
    if (verifiedHandles.has(user?.handle.toLowerCase() || '')) {
      setUser((prev) => (prev ? { ...prev, status: 'VERIFIED' } : null));
    } else {
      setUser((prev) => (prev ? { ...prev, status: 'RESTRICTED' } : null));
    }

    setProfiles((prev) =>
      prev.map((p) => {
        if (verifiedHandles.has(p.handle.toLowerCase())) {
          return { ...p, status: 'VERIFIED' };
        } else {
          return { ...p, status: p.status === 'GRACE_PERIOD' ? 'GRACE_PERIOD' : 'RESTRICTED' };
        }
      })
    );
  };

  const allAuditedUsers = user ? [user, ...profiles] : profiles;
  const unreadCount = connections.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab: string) => setCurrentTab(tab as any)}
        pendingRequestsCount={incomingRequests.length}
        unreadMessagesCount={unreadCount}
        user={user}
        backendOnline={backendOnline}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'discovery' && (
          <DiscoveryView profiles={profiles} onSendRequest={handleSendRequest} />
        )}

        {currentTab === 'requests' && (
          <RequestsView
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            onOpenChatWithUser={(uid) => {
              const c = connections.find((conn) => conn.user.id === uid);
              if (c) {
                setActiveConnectionId(c.id);
                setCurrentTab('chat');
              }
            }}
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
          />
        )}

        {currentTab === 'moments' && (
          <MomentsView
            posts={posts}
            currentUser={user}
            onLikePost={handleLikePost}
            onAddPost={handleAddPost}
          />
        )}

        {currentTab === 'admin' && (
          <FollowerSyncAdmin
            users={allAuditedUsers}
            onSyncComplete={handleSyncComplete}
          />
        )}

        {currentTab === 'profile' && <ProfileView user={user} />}
      </main>
    </div>
  );
};
