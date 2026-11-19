import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  GraduationCap,
  BookOpen,
  CheckCircle,
  Flag,
  UserX,
  Sparkles,
  Loader2,
  Send,
  ArrowLeft,
  UserMinus,
} from 'lucide-react';
import { DiscoverCard, ExpandedDiscoveryProfile, UserProfile } from '../types';
import { fetchExpandedDiscoveryProfileApi } from '../services/api';
import { ImageViewerModal, ImageViewerData } from './ImageViewerModal';

interface ExpandedDiscoveryProfileModalProps {
  card: DiscoverCard;
  currentUserId?: string;
  onClose: () => void;
  onConnect: (user: UserProfile, note?: string) => void;
  onOpenChat?: (connectionId: string) => void;
  onBlock?: (user: UserProfile) => void;
  onReport?: (user: UserProfile) => void;
  onRemoveConnection?: (connectionId: string, user: UserProfile) => void;
}

export const ExpandedDiscoveryProfileModal: React.FC<ExpandedDiscoveryProfileModalProps> = ({
  card,
  currentUserId,
  onClose,
  onConnect,
  onOpenChat,
  onBlock,
  onReport,
  onRemoveConnection,
}) => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ExpandedDiscoveryProfile | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [connectNote, setConnectNote] = useState('');
  const [selectedViewerData, setSelectedViewerData] = useState<ImageViewerData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await fetchExpandedDiscoveryProfileApi(card.user.id, currentUserId);
        if (isMounted) {
          setProfileData(data);
        }
      } catch (err) {
        console.error('Failed to load expanded profile', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [card.user.id, currentUserId]);

  // Assemble photo gallery with valid uploaded photos only
  const photos = (
    profileData?.photoGallery && profileData.photoGallery.length > 0
      ? profileData.photoGallery
      : card.mainPhotoUrl
      ? [card.mainPhotoUrl, ...(card.user.photos || [])].filter((v, i, a) => a.indexOf(v) === i)
      : card.user.photos && card.user.photos.length > 0
      ? card.user.photos
      : card.user.avatar
      ? [card.user.avatar]
      : []
  ).filter((p): p is string => Boolean(p && typeof p === 'string' && p.trim() !== ''));

  const [activePhotoError, setActivePhotoError] = useState(false);
  const currentPhoto = photos[activePhotoIdx] || photos[0];
  const hasValidPhoto = Boolean(currentPhoto && !activePhotoError);

  const getInitials = (str?: string) => {
    if (!str) return '';
    const clean = str.replace(/^@/, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const user = profileData?.user || card.user;
  const isVerified = user.status === 'VERIFIED';
  const college = profileData?.college || card.college || 'Campus Community';
  const course = profileData?.course || card.course || user.major;
  const interests =
    profileData?.interests && profileData.interests.length > 0
      ? profileData.interests
      : card.interests && card.interests.length > 0
      ? card.interests
      : user.interests;

  const discoveryBio = profileData?.discoveryBio || card.discoveryBio;
  const isConnected = profileData?.isConnected;
  const hasPending = profileData?.hasPendingRequest;

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleSendConnect = () => {
    onConnect(user, connectNote.trim() ? connectNote.trim() : undefined);
    setShowNoteInput(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl border border-[#34302C] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        style={{ backgroundColor: '#121212' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Bar for Navigation Back to Discovery Feed */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 bg-[#211E1B]/95 backdrop-blur-md border-b border-[#34302C]">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#A9A198] hover:text-[#F5F1E8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#C2526A]" />
            <span>Back to Discovery</span>
          </button>

          <div className="flex items-center gap-1.5">
            {loading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#A9A198] mr-2">
                <Loader2 className="w-3.5 h-3.5 text-[#C2526A] animate-spin" />
                <span className="hidden sm:inline">Loading details...</span>
              </span>
            )}
            {onReport && (
              <button
                type="button"
                onClick={() => onReport(user)}
                className="p-1.5 rounded-full text-[#A9A198] hover:text-amber-400 hover:bg-[#34302C] transition-colors"
                title="Report profile"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            {onBlock && (
              <button
                type="button"
                onClick={() => onBlock(user)}
                className="p-1.5 rounded-full text-[#A9A198] hover:text-rose-400 hover:bg-[#34302C] transition-colors"
                title="Block user"
              >
                <UserX className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-[#A9A198] hover:text-[#F5F1E8] hover:bg-[#34302C] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Swipeable Photo Gallery Container */}
          <div className="relative w-full h-[400px] sm:h-[460px] bg-black select-none group">
            {hasValidPhoto ? (
              <img
                src={currentPhoto}
                alt={user.displayName}
                onClick={() =>
                  setSelectedViewerData({
                    imageUrl: currentPhoto,
                    images: photos,
                    currentIndex: activePhotoIdx,
                    onIndexChange: (newIdx) => setActivePhotoIdx(newIdx),
                    caption: discoveryBio || `${user.displayName} (@${user.handle})`,
                    author: user,
                  })
                }
                className="w-full h-full object-cover transition-opacity duration-300 cursor-zoom-in"
                title="Click to view full photo in lightbox"
                onError={() => setActivePhotoError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-[#121212] flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-wider">
                  {getInitials(user.displayName || user.handle)}
                </div>
                <span className="text-xs text-zinc-500 font-medium tracking-wide uppercase mt-3">
                  No photo uploaded
                </span>
              </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/30 pointer-events-none" />

            {/* Photo Indicators */}
            {photos.length > 1 && (
              <div className="absolute top-3 inset-x-8 flex gap-1.5 z-20">
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${
                      idx === activePhotoIdx ? 'bg-white shadow' : 'bg-white/35 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Left / Right Carousel Controls */}
            {photos.length > 1 && (
              <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between px-3 pointer-events-none">
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="pointer-events-auto p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-95"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="pointer-events-auto p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-95"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Photo Counter Pill */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 right-4 z-20 px-2.5 py-1 rounded-full bg-black/60 text-[#F5F1E8] text-[11px] font-semibold backdrop-blur-md border border-[#34302C]">
                {activePhotoIdx + 1} / {photos.length} photos
              </div>
            )}

            {/* Header info overlaid over bottom of photo */}
            <div className="absolute bottom-4 left-5 right-20 z-20">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-[#F5F1E8] tracking-tight drop-shadow-md">
                  {user.displayName}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Insta Verified
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-[#C2526A] mt-0.5">
                @{user.handle} {user.year ? `• ${user.year}` : ''}
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-6">
            {/* Discovery Bio Callout */}
            {discoveryBio && (
              <div className="p-4 rounded-2xl bg-[#211E1B] border border-[#34302C]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A9A198] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C2526A]" />
                  Discovery Bio
                </div>
                <p className="text-sm text-[#F5F1E8] font-normal leading-relaxed">
                  "{discoveryBio}"
                </p>
              </div>
            )}

            {/* Academic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {college && (
                <div className="p-3.5 rounded-2xl bg-[#211E1B]/70 border border-[#34302C] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#34302C] flex items-center justify-center text-[#C2526A] shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#A9A198] font-medium">College / University</div>
                    <div className="text-xs font-semibold text-[#F5F1E8] truncate">{college}</div>
                  </div>
                </div>
              )}

              {course && (
                <div className="p-3.5 rounded-2xl bg-[#211E1B]/70 border border-[#34302C] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#34302C] flex items-center justify-center text-indigo-400 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#A9A198] font-medium">Course / Program</div>
                    <div className="text-xs font-semibold text-[#F5F1E8] truncate">{course}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Interests and Hobbies */}
            {interests && interests.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#A9A198] mb-2.5">
                  Interests & Hobbies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#211E1B] text-[#F5F1E8] border border-[#34302C]"
                    >
                      #{item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* General Profile About Me */}
            {user.bio && user.bio !== discoveryBio && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#A9A198] mb-1.5">
                  About
                </h3>
                <p className="text-sm text-[#A9A198] leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Note input if user toggles note */}
            {showNoteInput && (
              <div className="p-4 rounded-2xl bg-[#211E1B] border border-[#C2526A]/40 space-y-3 animate-in fade-in">
                <div className="text-xs font-bold text-[#F5F1E8]">Add an optional introductory note</div>
                <textarea
                  value={connectNote}
                  onChange={(e) => setConnectNote(e.target.value)}
                  placeholder="Hey, loved your interests! Would love to connect..."
                  maxLength={150}
                  rows={2}
                  className="w-full bg-[#121212] border border-[#34302C] rounded-xl p-3 text-xs text-[#F5F1E8] placeholder-[#A9A198]/60 focus:outline-none focus:border-[#C2526A]"
                />
                <div className="flex justify-between items-center text-[10px] text-[#A9A198]">
                  <span>When accepted, this becomes your starter message</span>
                  <span>{connectNote.length}/150</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Prominent Action Bar */}
        <div className="p-4 sm:p-5 bg-[#211E1B] border-t border-[#34302C] flex items-center justify-between gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2 w-full">
              {onRemoveConnection && profileData?.existingConnectionId && (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveConnection(profileData.existingConnectionId!, user);
                    onClose();
                  }}
                  className="py-3.5 px-4 rounded-2xl bg-[#34302C] hover:bg-rose-950/40 text-[#A9A198] hover:text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-[#34302C] hover:border-rose-500/40"
                >
                  <UserMinus className="w-4 h-4" />
                  <span className="hidden sm:inline">Unfollow</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (profileData?.existingConnectionId && onOpenChat) {
                    onOpenChat(profileData.existingConnectionId);
                    onClose();
                  }
                }}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-[#C2526A] hover:bg-[#a93f55] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#C2526A]/20 transition-all active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </div>
          ) : hasPending ? (
            <div className="w-full py-3.5 px-4 rounded-2xl bg-[#34302C] text-[#A9A198] font-bold text-sm text-center border border-[#34302C]">
              Connection Request Pending
            </div>
          ) : showNoteInput ? (
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowNoteInput(false)}
                className="flex-1 py-3 px-4 rounded-2xl btn-theme-secondary font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendConnect}
                className="flex-[2] py-3 px-4 rounded-2xl btn-theme-primary font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Send Request</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowNoteInput(true)}
                className="py-3.5 px-4 rounded-2xl btn-theme-secondary font-semibold text-xs flex items-center gap-2 transition-colors"
                title="Add a note"
              >
                <Send className="w-4 h-4" style={{ color: 'var(--cc-accent)' }} />
                <span className="hidden sm:inline">Add Note</span>
              </button>

              <button
                type="button"
                onClick={handleSendConnect}
                className="flex-1 py-3.5 px-4 rounded-2xl btn-theme-primary font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Connect</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Modal */}
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
