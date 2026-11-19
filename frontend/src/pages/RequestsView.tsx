import React, { useState } from 'react';
import {
  HeartHandshake,
  Check,
  X,
  Clock,
  UserCheck,
  Send,
  Eye,
  UserX,
  UserMinus,
  Flag,
  ShieldCheck,
  MoreVertical
} from 'lucide-react';
import { ConnectRequest, Connection, UserProfile } from '../types';
import { Avatar } from '../components/Avatar';
import { useTheme } from '../context/ThemeContext';

interface RequestsViewProps {
  connections: Connection[];
  incomingRequests: ConnectRequest[];
  outgoingRequests: ConnectRequest[];
  onAccept: (request: ConnectRequest) => void;
  onDecline: (requestId: string) => void;
  onCancelSent: (requestId: string) => void;
  onOpenChatWithConnection: (connectionId: string) => void;
  onViewProfile: (user: UserProfile) => void;
  onBlockUser?: (user: UserProfile) => void;
  onReportUser?: (user: UserProfile) => void;
  onRemoveConnection?: (connectionId: string, user: UserProfile) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  connections,
  incomingRequests,
  outgoingRequests,
  onAccept,
  onDecline,
  onCancelSent,
  onOpenChatWithConnection,
  onViewProfile,
  onBlockUser,
  onReportUser,
  onRemoveConnection,
}) => {
  const { theme } = useTheme();
  const [tab, setTab] = useState<'connections' | 'incoming' | 'sent'>('connections');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleTabChange = (newTab: 'connections' | 'incoming' | 'sent') => {
    setTab(newTab);
    setOpenMenuId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: theme.primaryText }}>
            Orbit Network & Requests <HeartHandshake className="w-5 h-5 text-pink-400" />
          </h2>
          <p className="text-xs" style={{ color: theme.secondaryText }}>
            Manage your mutual connections, review incoming invites, and track sent requests.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          className="w-full sm:w-auto grid grid-cols-3 sm:flex p-1 rounded-2xl border"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          <button
            onClick={() => handleTabChange('connections')}
            className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
              tab === 'connections'
                ? 'btn-theme-pill-active'
                : 'hover:opacity-90'
            }`}
            style={{
              color: tab === 'connections' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
            }}
          >
            <UserCheck className="w-3.5 h-3.5 hidden xs:inline sm:inline" />
            <span className="truncate">Matches ({connections.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('incoming')}
            className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 relative text-center ${
              tab === 'incoming'
                ? 'btn-theme-pill-active'
                : 'hover:opacity-90'
            }`}
            style={{
              color: tab === 'incoming' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
            }}
          >
            <HeartHandshake className="w-3.5 h-3.5 hidden xs:inline sm:inline" />
            <span className="truncate">Inbox ({incomingRequests.length})</span>
            {incomingRequests.length > 0 && (
              <span
                className="w-2 h-2 rounded-full absolute top-1.5 right-1.5"
                style={{ backgroundColor: 'var(--cc-accent)' }}
              />
            )}
          </button>

          <button
            onClick={() => handleTabChange('sent')}
            className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
              tab === 'sent'
                ? 'btn-theme-pill-active'
                : 'hover:opacity-90'
            }`}
            style={{
              color: tab === 'sent' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
            }}
          >
            <Send className="w-3.5 h-3.5 hidden xs:inline sm:inline" />
            <span className="truncate">Sent ({outgoingRequests.length})</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: MUTUAL CONNECTIONS */}
      {/* ==================================================================== */}
      {tab === 'connections' && (
        <div className="space-y-3">
          {connections.length === 0 ? (
            <div
              className="rounded-3xl border p-12 text-center"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 text-slate-500"
                style={{ backgroundColor: theme.card }}
              >
                <UserCheck className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold" style={{ color: theme.primaryText }}>No mutual connections yet</h4>
              <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: theme.secondaryText }}>
                Explore student profiles in Discovery and send connect requests. Once accepted, your connection and private chat unlock here!
              </p>
            </div>
          ) : (
            connections.map((conn) => (
              <div
                key={conn.id}
                onClick={() => onOpenChatWithConnection(conn.id)}
                className="relative rounded-2xl p-4 sm:p-5 border shadow-lg flex items-center justify-between gap-3 transition-all cursor-pointer pr-12 group/card"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
                title="Click to open chat"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile(conn.user);
                    }}
                    className="relative cursor-pointer group flex-shrink-0"
                    title="Click to view profile"
                  >
                    <Avatar
                      src={conn.user.avatar}
                      name={conn.user.displayName}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-2 group-hover:scale-105 transition-transform"
                      style={{ borderColor: theme.accent }}
                    />
                    {conn.user.status === 'VERIFIED' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                        <ShieldCheck className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold transition-colors leading-tight truncate" style={{ color: theme.primaryText }}>
                      {conn.user.displayName}
                    </h4>
                    <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: theme.accent }}>
                      @{conn.user.handle}
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
                      setOpenMenuId(openMenuId === `conn-${conn.id}` ? null : `conn-${conn.id}`);
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:scale-105"
                    style={{ color: theme.secondaryText }}
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                    {openMenuId === `conn-${conn.id}` && (
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
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onViewProfile(conn.user);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors"
                            style={{ color: theme.primaryText }}
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                            <span>View Profile</span>
                          </button>

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
                              <UserMinus className="w-4 h-4 text-slate-400" />
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
                                <Flag className="w-4 h-4 text-slate-400" />
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
                                <UserX className="w-4 h-4 text-slate-400" />
                                <span>Block User</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: RECEIVED REQUESTS */}
      {/* ==================================================================== */}
      {tab === 'incoming' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div
              className="rounded-3xl border p-12 text-center"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 text-slate-500"
                style={{ backgroundColor: theme.card }}
              >
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold" style={{ color: theme.primaryText }}>No pending received requests</h4>
              <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: theme.secondaryText }}>
                When other students send you a connection request, their profile and intro note will appear here for your review.
              </p>
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.id}
                className="relative rounded-2xl p-4 sm:p-5 border shadow-lg flex items-center justify-between gap-3 transition-all pr-12"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    onClick={() => onViewProfile(req.fromUser)}
                    className="cursor-pointer group flex-shrink-0"
                    title="Click to view profile"
                  >
                    <Avatar
                      src={req.fromUser.avatar}
                      name={req.fromUser.displayName}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-2 group-hover:scale-105 transition-transform"
                      style={{ borderColor: theme.accent }}
                    />
                  </div>

                  <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <h4
                        onClick={() => onViewProfile(req.fromUser)}
                        className="text-base font-bold cursor-pointer transition-colors leading-tight truncate"
                        style={{ color: theme.primaryText }}
                      >
                        {req.fromUser.displayName}
                      </h4>
                      <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: theme.accent }}>
                        @{req.fromUser.handle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onDecline(req.id)}
                        className="py-2 px-3 rounded-xl border font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
                        style={{
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                          color: theme.secondaryText,
                        }}
                        title="Decline request"
                      >
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => onAccept(req)}
                        className="btn-theme-primary py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Chat</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="absolute top-3.5 right-3.5 z-10">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === `req-${req.id}` ? null : `req-${req.id}`)}
                    className="p-1.5 rounded-lg transition-colors hover:scale-105"
                    style={{ color: theme.secondaryText }}
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                    {openMenuId === `req-${req.id}` && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div
                          className="absolute right-0 top-full mt-1.5 w-44 border rounded-xl shadow-2xl py-1.5 z-30"
                          style={{
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onViewProfile(req.fromUser);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors"
                            style={{ color: theme.primaryText }}
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                            <span>View Profile</span>
                          </button>

                          {onReportUser && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onReportUser(req.fromUser);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:text-amber-400 flex items-center gap-2.5 transition-colors border-t"
                              style={{
                                color: theme.secondaryText,
                                borderColor: theme.border,
                              }}
                            >
                              <Flag className="w-4 h-4 text-slate-400" />
                              <span>Report User</span>
                            </button>
                          )}

                            {onBlockUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onBlockUser(req.fromUser);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:text-rose-400 flex items-center gap-2.5 transition-colors"
                                style={{ color: theme.secondaryText }}
                              >
                                <UserX className="w-4 h-4 text-slate-400" />
                                <span>Block User</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: SENT REQUESTS */}
      {/* ==================================================================== */}
      {tab === 'sent' && (
        <div className="space-y-3">
          {outgoingRequests.length === 0 ? (
            <div
              className="rounded-3xl border p-12 text-center"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 text-slate-500"
                style={{ backgroundColor: theme.card }}
              >
                <Send className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold" style={{ color: theme.primaryText }}>No outgoing requests pending</h4>
              <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: theme.secondaryText }}>
                When you send a connect request to a classmate, it will be listed here until they accept or decline.
              </p>
            </div>
          ) : (
            outgoingRequests.map((req) => {
              const target = req.toUser || req.fromUser;
              return (
                <div
                  key={req.id}
                  className="rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      src={target.avatar}
                      name={target.displayName}
                      onClick={() => onViewProfile(target)}
                      className="w-12 h-12 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                    />
                    <div>
                      <h5
                        onClick={() => onViewProfile(target)}
                        className="text-base font-bold cursor-pointer transition-colors leading-tight"
                        style={{ color: theme.primaryText }}
                      >
                        {target.displayName}
                      </h5>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: theme.accent }}>
                        @{target.handle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Acceptance
                    </span>

                    <button
                      onClick={() => onCancelSent(req.id)}
                      className="p-1.5 px-2.5 rounded-xl border text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.secondaryText,
                      }}
                      title="Cancel Request"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
