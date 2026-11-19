import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  BookOpen,
  GraduationCap,
  Instagram,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserMinus,
  Flag,
  ExternalLink,
  MessageSquare,
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import { UserProfile, UserPost } from '../types';
import { ImageViewerModal, ImageViewerData } from './ImageViewerModal';

interface UserProfileModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onBlock?: (user: UserProfile) => void;
  onReport?: (user: UserProfile) => void;
  onConnect?: (user: UserProfile) => void;
  onOpenChat?: (user: UserProfile) => void;
  onOpenFullProfile?: (user: UserProfile) => void;
  onRemoveConnection?: (user: UserProfile) => void;
  userPosts?: UserPost[];
  isConnected?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onBlock,
  onReport,
  onConnect,
  onOpenChat,
  onOpenFullProfile,
  onRemoveConnection,
  userPosts = [],
  isConnected = false,
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedViewerData, setSelectedViewerData] = useState<ImageViewerData | null>(null);

  if (!user) return null;

  const [photoError, setPhotoError] = useState(false);
  const photos = (
    user.photos && user.photos.length > 0
      ? user.photos
      : user.avatar
      ? [user.avatar]
      : []
  ).filter((p): p is string => Boolean(p && typeof p === 'string' && p.trim() !== ''));

  const currentPhoto = photos[photoIndex] || photos[0];
  const hasValidPhoto = Boolean(currentPhoto && !photoError);

  const getInitials = (str?: string) => {
    if (!str) return '';
    const clean = str.replace(/^@/, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-all backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Photo Header */}
        <div
          onClick={() => {
            if (hasValidPhoto) {
              setSelectedViewerData({
                imageUrl: currentPhoto,
                images: photos,
                currentIndex: photoIndex,
                onIndexChange: (newIdx) => setPhotoIndex(newIdx),
                caption: `${user.displayName} (@${user.handle})`,
                author: user,
              });
            }
          }}
          className={`relative h-64 sm:h-72 w-full bg-slate-950 flex-shrink-0 group ${
            hasValidPhoto ? 'cursor-zoom-in' : 'cursor-default'
          }`}
          title={hasValidPhoto ? 'Click to view full photo' : user.displayName}
        >
          {hasValidPhoto ? (
            <img
              src={currentPhoto}
              alt={user.displayName}
              onError={() => setPhotoError(true)}
              className="w-full h-full object-cover select-none transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 border border-slate-700/80 shadow-2xl flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white tracking-wider">
                {getInitials(user.displayName || user.handle)}
              </div>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide uppercase mt-2.5">
                No photo uploaded
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent pointer-events-none" />

          {/* Photo Carousel Controls */}
          {photos.length > 1 && (
            <>
              <div className="absolute top-3 inset-x-4 flex gap-1 z-10">
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      idx === photoIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <div className="absolute inset-y-0 inset-x-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                  className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                  className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* User Display Summary */}
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">{user.displayName}</h3>
              {user.status === 'VERIFIED' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  Insta Verified
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-pink-400 mt-0.5 flex items-center gap-1">
              <Instagram className="w-3.5 h-3.5" />
              <span>@{user.handle}</span>
            </div>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Major & Year */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2 text-slate-200">
              <BookOpen className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <span className="truncate">{user.major}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2 text-slate-200">
              <GraduationCap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="truncate">{user.year}</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              About
            </span>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
              {user.bio || 'No bio provided yet.'}
            </p>
          </div>

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Interests & Hobbies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    #{interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Student Posts (Profile Posts Only - Not Memes) */}
          {isConnected ? (
            userPosts && userPosts.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                    Student Posts ({userPosts.length})
                  </span>
                  {onOpenFullProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFullProfile(user);
                      }}
                      className="text-[11px] font-semibold text-pink-400 hover:text-pink-300 transition-colors"
                    >
                      View All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {userPosts.slice(0, 6).map((post) => (
                    <div
                      key={post.id}
                      onClick={() =>
                        setSelectedViewerData({
                          imageUrl: post.imageUrl,
                          caption: post.caption,
                          author: user,
                          createdAt: post.createdAt,
                          likesCount: post.likesCount,
                          isLiked: post.isLiked,
                        })
                      }
                      className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group cursor-zoom-in"
                    >
                      <img
                        src={post.imageUrl}
                        alt={post.caption}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <span className="text-[10px] text-white truncate">{post.caption}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          ) : (
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-2 text-pink-400">
                <Lock className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-200">Posts & Profile Locked</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Connect with @{user.handle} to view their personal student posts and full profile.
              </p>
            </div>
          )}

          {/* View Full Profile Shortcut (Enabled only for connections) */}
          {isConnected && onOpenFullProfile && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullProfile(user);
              }}
              className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
              <span>Open Full Campus Profile</span>
            </button>
          )}

          {/* Connection Rule Notice */}
          {!isConnected && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <span>
                Chat and posts are locked until connection is mutually accepted.
              </span>
            </div>
          )}

          {/* Footer Safety Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {onReport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReport(user);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-amber-400 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              )}
              {onBlock && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBlock(user);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Block</span>
                </button>
              )}
            </div>

            {isConnected ? (
              <div className="flex items-center gap-2">
                {onRemoveConnection && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRemoveConnection(user);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 flex items-center gap-1.5 transition-colors"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Unfollow</span>
                  </button>
                )}
                {onOpenChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChat(user);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold btn-theme-primary flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Chat</span>
                  </button>
                )}
              </div>
            ) : (
              onConnect && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConnect(user);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold btn-theme-primary"
                >
                  Send Connect Request
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Image Viewer Modal */}
      {selectedViewerData && (
        <ImageViewerModal
          isOpen={Boolean(selectedViewerData)}
          onClose={() => setSelectedViewerData(null)}
          data={selectedViewerData}
        />
      )}
    </div>
  );
};
