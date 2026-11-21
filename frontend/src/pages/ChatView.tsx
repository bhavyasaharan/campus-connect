import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Lock,
  ShieldCheck,
  CheckCheck,
  MoreVertical,
  Flag,
  UserX,
  UserMinus,
  ArrowLeft,
  MessageSquare,
  Eye
} from 'lucide-react';
import { Connection, ChatMessage, UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from '../components/Avatar';

interface ChatViewProps {
  connections: Connection[];
  activeConnectionId: string | null;
  setActiveConnectionId: (id: string) => void;
  messages: Record<string, ChatMessage[]>;
  onSendMessage: (connectionId: string, content: string) => void;
  currentUser: UserProfile;
  wsConnected?: boolean;
  onViewProfile?: (user: UserProfile) => void;
  onOpenFullProfile?: (user: UserProfile) => void;
  onBlockUser?: (user: UserProfile) => void;
  onReportUser?: (user: UserProfile) => void;
  onRemoveConnection?: (connectionId: string, user: UserProfile) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  connections,
  activeConnectionId,
  setActiveConnectionId,
  messages,
  onSendMessage,
  currentUser,
  wsConnected = false,
  onViewProfile,
  onOpenFullProfile,
  onBlockUser,
  onReportUser,
  onRemoveConnection,
}) => {
  const { theme } = useTheme();
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mobileShowingChat, setMobileShowingChat] = useState<boolean>(Boolean(activeConnectionId));
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeConn = activeConnectionId ? (connections.find((c) => c.id === activeConnectionId) || null) : null;
  const activeMessages = activeConn ? messages[activeConn.id] || [] : [];

  // Deduplicate messages and suppress temporary optimistic duplicates once confirmed
  const displayMessages = React.useMemo(() => {
    return activeMessages.filter((msg, idx, arr) => {
      // 1. Ensure unique message IDs
      const firstIdx = arr.findIndex((m) => m.id === msg.id);
      if (firstIdx !== idx) return false;

      // 2. If this is a pending temporary message, omit it if a confirmed message with same sender and content exists
      if (msg.id.startsWith('temp_') || msg.id.startsWith('msg_')) {
        const hasConfirmed = arr.some(
          (other) =>
            !other.id.startsWith('temp_') &&
            !other.id.startsWith('msg_') &&
            String(other.senderId) === String(msg.senderId) &&
            other.content === msg.content
        );
        if (hasConfirmed) return false;
      }
      return true;
    });
  }, [activeMessages]);

  // When activeConnectionId changes externally, show or hide chat view on mobile
  useEffect(() => {
    setMobileShowingChat(Boolean(activeConnectionId));
  }, [activeConnectionId]);

  // Lock body scrolling while ChatView is active to eliminate background scroll
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConn) return;
    onSendMessage(activeConn.id, inputText.trim());
    setInputText('');
  };

  if (connections.length === 0) {
    return (
      <div
        className="w-full flex-1 min-h-0 flex items-center justify-center p-4"
        style={{ backgroundColor: theme.background }}
      >
        <div className="max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-full border mx-auto flex items-center justify-center mb-4"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.accent,
            }}
          >
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: theme.primaryText }}>No Active Conversations Yet</h3>
          <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: theme.secondaryText }}>
            Direct messaging is strictly unlocked only after a Connection Request is sent and mutually accepted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full flex-1 h-full min-h-0 flex overflow-hidden"
      style={{ backgroundColor: theme.background }}
    >
      {/* Sidebar: Started Conversations List */}
      <div
        className={`w-full md:w-88 lg:w-96 flex-shrink-0 border-r flex flex-col overflow-hidden h-full min-h-0 ${
          mobileShowingChat ? 'hidden md:flex' : 'flex'
        }`}
        style={{
          backgroundColor: theme.background,
          borderColor: theme.border,
        }}
      >
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between flex-shrink-0"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <div>
            <h2 className="text-xl font-black flex items-center gap-2" style={{ color: theme.primaryText }}>
              Conversations <MessageSquare className="w-5 h-5" style={{ color: theme.accent }} />
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.secondaryText }}>
              Direct messages with mutual connections ({connections.length})
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-3 sm:p-4 space-y-3">
          {connections.map((conn) => {
            const isSelected = activeConn?.id === conn.id;
            const connMsgs = messages[conn.id] || [];
            const lastMsg = connMsgs.length > 0 ? connMsgs[connMsgs.length - 1].content : (conn.lastMessage || 'Conversation started!');

            return (
              <div
                key={conn.id}
                onClick={() => {
                  setActiveConnectionId(conn.id);
                  setMobileShowingChat(true);
                  setShowMenu(false);
                  setOpenMenuId(null);
                }}
                className="relative rounded-2xl p-4 sm:p-5 border shadow-lg flex items-center justify-between gap-3 transition-all cursor-pointer pr-12 group/card hover:scale-[1.01]"
                style={{
                  backgroundColor: isSelected ? theme.card : theme.surface,
                  borderColor: isSelected ? theme.accent : theme.border,
                  boxShadow: isSelected
                    ? `0 0 0 2px ${theme.accent}, 0 4px 18px ${theme.accentMuted}`
                    : `0 4px 14px ${theme.isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.06)'}`,
                }}
                title={`Chat with ${conn.user.displayName}`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenFullProfile) {
                        onOpenFullProfile(conn.user);
                      } else if (onViewProfile) {
                        onViewProfile(conn.user);
                      }
                    }}
                    className="relative cursor-pointer group flex-shrink-0"
                    title="Click to view full profile"
                  >
                    <Avatar
                      src={conn.user.avatar}
                      name={conn.user.displayName}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-2 group-hover:scale-105 transition-transform"
                      style={{ borderColor: theme.accent }}
                    />
                    {conn.user.status === 'VERIFIED' && (
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: theme.surface }}
                      >
                        <ShieldCheck className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className="text-base font-bold transition-colors leading-tight truncate"
                        style={{ color: theme.primaryText }}
                      >
                        {conn.user.displayName}
                      </h4>
                      <span className="text-[11px] font-medium flex-shrink-0" style={{ color: theme.secondaryText }}>
                        {conn.lastMessageTime || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: theme.accent }}>
                      @{conn.user.handle}
                    </p>
                    <p className="text-xs truncate mt-1 leading-snug" style={{ color: theme.secondaryText }}>
                      {lastMsg}
                    </p>
                  </div>
                </div>

                <div
                  className="absolute top-3.5 right-3.5 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === `chat-conn-${conn.id}` ? null : `chat-conn-${conn.id}`);
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:scale-105"
                    style={{ color: theme.secondaryText }}
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === `chat-conn-${conn.id}` && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div
                        className="absolute right-0 top-full mt-1.5 w-48 border rounded-xl shadow-2xl py-1.5 z-30"
                        style={{
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        }}
                      >
                        {onViewProfile && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onViewProfile(conn.user);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors"
                            style={{ color: theme.primaryText }}
                          >
                            <Eye className="w-4 h-4" style={{ color: theme.secondaryText }} />
                            <span>View Card</span>
                          </button>
                        )}

                        {onOpenFullProfile && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onOpenFullProfile(conn.user);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors border-t"
                            style={{ color: theme.primaryText, borderColor: theme.border }}
                          >
                            <Eye className="w-4 h-4" style={{ color: theme.secondaryText }} />
                            <span>View Full Profile</span>
                          </button>
                        )}

                        {onRemoveConnection && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onRemoveConnection(conn.id, conn.user);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:text-rose-400 flex items-center gap-2.5 transition-colors border-t"
                            style={{
                              color: theme.secondaryText,
                              borderColor: theme.border,
                            }}
                          >
                            <UserMinus className="w-4 h-4" style={{ color: theme.secondaryText }} />
                            <span>Unfollow</span>
                          </button>
                        )}

                        {onReportUser && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onReportUser(conn.user);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:text-amber-400 flex items-center gap-2.5 transition-colors"
                            style={{ color: theme.secondaryText }}
                          >
                            <Flag className="w-4 h-4" style={{ color: theme.secondaryText }} />
                            <span>Report User</span>
                          </button>
                        )}

                        {onBlockUser && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onBlockUser(conn.user);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:text-rose-400 flex items-center gap-2.5 transition-colors"
                            style={{ color: theme.secondaryText }}
                          >
                            <UserX className="w-4 h-4" style={{ color: theme.secondaryText }} />
                            <span>Block User</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Conversation Window */}
      {activeConn ? (
        <div
          className={`w-full md:flex-1 flex flex-col overflow-hidden relative h-full min-h-0 ${
            mobileShowingChat ? 'flex' : 'hidden md:flex'
          }`}
          style={{
            backgroundColor: theme.background,
          }}
        >
          {/* Header */}
          <div
            className="p-3 sm:p-3.5 px-3 sm:px-5 border-b flex items-center justify-between flex-shrink-0"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Back Button to return to Conversations */}
              <button
                type="button"
                onClick={() => {
                  setActiveConnectionId('');
                  setMobileShowingChat(false);
                }}
                className="md:hidden p-1.5 -ml-1 rounded-xl transition-colors flex-shrink-0 hover:opacity-80"
                style={{ color: theme.secondaryText }}
                title="Back to conversations"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div
                onClick={() => {
                  if (onOpenFullProfile) {
                    onOpenFullProfile(activeConn.user);
                  } else if (onViewProfile) {
                    onViewProfile(activeConn.user);
                  }
                }}
                className="cursor-pointer group flex-shrink-0"
                title="View Full Profile"
              >
                <Avatar
                  src={activeConn.user.avatar}
                  name={activeConn.user.displayName}
                  className="w-10 h-10 rounded-xl ring-1 group-hover:scale-105 transition-transform"
                  style={{ borderColor: theme.border }}
                />
              </div>
              <div className="min-w-0">
                <h4
                  onClick={() => {
                    if (onOpenFullProfile) {
                      onOpenFullProfile(activeConn.user);
                    } else if (onViewProfile) {
                      onViewProfile(activeConn.user);
                    }
                  }}
                  className="text-sm font-bold cursor-pointer transition-colors leading-tight truncate hover:opacity-80"
                  style={{ color: theme.primaryText }}
                >
                  {activeConn.user.displayName}
                </h4>
                <p className="text-xs font-medium mt-0.5 truncate" style={{ color: theme.accent }}>
                  @{activeConn.user.handle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.15)',
                  borderColor: theme.isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.3)',
                  color: theme.isDark ? '#34d399' : '#059669',
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chat Unlocked</span>
              </div>

              <div
                className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border"
                style={{
                  color: wsConnected ? theme.accent : theme.secondaryText,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
                title={wsConnected ? 'Real-time WebSocket connected' : 'WebSocket connecting'}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: wsConnected ? theme.accent : (theme.isDark ? '#64748b' : '#94a3b8'),
                  }}
                />
                <span>{wsConnected ? 'Live Socket' : 'Polling'}</span>
              </div>

              {/* More Actions Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                  style={{ color: theme.secondaryText }}
                  title="Conversation Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowMenu(false)}
                    />
                    <div
                      className="absolute right-0 top-full mt-1.5 w-44 rounded-xl shadow-2xl py-1.5 z-30 border"
                      style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      }}
                    >
                      {onReportUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onReportUser(activeConn.user);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:opacity-80 flex items-center gap-2"
                          style={{ color: theme.isDark ? '#fbbf24' : '#d97706' }}
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Report User</span>
                        </button>
                      )}

                      {onRemoveConnection && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onRemoveConnection(activeConn.id, activeConn.user);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:opacity-80 flex items-center gap-2 border-t"
                          style={{ borderColor: theme.border, color: '#f43f5e' }}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Unfollow</span>
                        </button>
                      )}

                      {onBlockUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onBlockUser(activeConn.user);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:opacity-80 flex items-center gap-2"
                          style={{ color: '#e11d48' }}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Block User</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            className="flex-1 min-h-0 p-4 overflow-y-auto overscroll-y-contain space-y-3"
            style={{ backgroundColor: theme.background }}
          >
            <div className="text-center my-2">
              <span
                className="text-[11px] px-3 py-1 rounded-full border inline-flex items-center gap-1.5"
                style={{
                  color: theme.secondaryText,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <ShieldCheck
                  className="w-3.5 h-3.5"
                  style={{ color: theme.isDark ? '#34d399' : '#059669' }}
                />
                Mutual connection accepted. Direct messages are unlocked and private.
              </span>
            </div>

            {displayMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const sentTextColor = theme.id === 'obsidian-emerald' ? '#081a12' : '#ffffff';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className="max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed"
                    style={
                      isMe
                        ? {
                            backgroundColor: theme.accent,
                            color: sentTextColor,
                            borderBottomRightRadius: '0px',
                            boxShadow: `0 4px 14px ${theme.accentMuted}`,
                          }
                        : {
                            backgroundColor: theme.surface,
                            color: theme.primaryText,
                            borderColor: theme.border,
                            borderWidth: '1px',
                            borderBottomLeftRadius: '0px',
                          }
                    }
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] px-1" style={{ color: theme.secondaryText }}>
                    <span>{msg.sentAt}</span>
                    {isMe && <CheckCheck className="w-3 h-3" style={{ color: theme.accent }} />}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t flex items-center gap-2 transition-colors flex-shrink-0"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeConn.user.displayName}...`}
              autoComplete="off"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm transition-colors border focus:outline-none"
              style={{
                backgroundColor: theme.card,
                color: theme.primaryText,
                borderColor: theme.border,
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl btn-theme-primary disabled:opacity-40 font-bold transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div
          className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center"
          style={{ backgroundColor: theme.background }}
        >
          <div
            className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 shadow-sm"
            style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.accent }}
          >
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: theme.primaryText }}>Your Messages</h3>
          <p className="text-xs max-w-xs leading-relaxed" style={{ color: theme.secondaryText }}>
            Select a connection from the list to view conversations or send a message.
          </p>
        </div>
      )}
    </div>
  );
};
