import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Instagram,
  Pencil,
  Settings,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  UserPlus,
  UserMinus,
  PlusCircle,
  Image as ImageIcon,
  Heart,
  Trash2,
  Upload,
  Loader2,
  X,
  Lock,
  Share2,
  Check,
  Grid,
  Info,
  Play,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Sliders,
  Camera,
  Layers,
  Film,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { UserProfile, Connection, UserPost, DiscoverCard, PostMediaItem } from '../types';
import { uploadImageApi, uploadMediaApi, fetchMyDiscoverCardApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { EditProfileModal } from '../components/EditProfileModal';
import { SettingsModal } from '../components/SettingsModal';
import { ImageViewerModal, ImageViewerData } from '../components/ImageViewerModal';
import { EditDiscoverCardModal } from '../components/EditDiscoverCardModal';
import { DiscoveryCard } from '../components/DiscoveryCard';
import { EditPostModal } from '../components/EditPostModal';
import { Avatar } from '../components/Avatar';
import { ImageEditorModal } from '../components/ImageEditorModal';
import { convertHeicToJpeg, processMediaFiles } from '../utils/heicConverter';

interface ProfileViewProps {
  user: UserProfile;
  currentUser?: UserProfile;
  connections?: Connection[];
  posts?: UserPost[];
  pendingRequestsCount?: number;
  onUpdateProfile: (updated: UserProfile) => Promise<void>;
  onNavigateTab: (tab: 'discovery' | 'requests' | 'chat' | 'moments' | 'admin' | 'profile') => void;
  onOpenChatWithConnection?: (connectionId: string) => void;
  onSendConnectRequest?: (user: UserProfile) => void;
  onViewProfile?: (user: UserProfile) => void;
  onRemoveConnection?: (connectionId: string, user: UserProfile) => void;
  onCreatePost?: (caption: string, imageUrl: string, media?: PostMediaItem[]) => Promise<void> | void;
  onEditPost?: (postId: string, caption: string, media?: PostMediaItem[]) => Promise<void> | void;
  onDeletePost?: (postId: string) => Promise<void> | void;
  onLikePost?: (postId: string) => Promise<void> | void;
  onBack?: () => void;
  onLogout?: () => void;
}

type ProfileContentTab = 'POSTS' | 'SPOTLIGHT' | 'ABOUT';

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  connections = [],
  posts = [],
  pendingRequestsCount: _pendingRequestsCount = 0,
  onUpdateProfile,
  onNavigateTab,
  onOpenChatWithConnection,
  onSendConnectRequest,
  onViewProfile: _onViewProfile,
  onRemoveConnection,
  onCreatePost,
  onEditPost,
  onDeletePost,
  onLikePost,
  onBack,
  onLogout,
}) => {
  const { theme } = useTheme();
  const isOwnProfile = !currentUser || String(currentUser.id) === String(user.id);
  const isConnected = isOwnProfile || connections.some((c) => String(c.user.id) === String(user.id));
  const existingConn = connections.find((c) => String(c.user.id) === String(user.id));

  // Modal visibility states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editDiscoverCardOpen, setEditDiscoverCardOpen] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<ProfileContentTab>('POSTS');
  const [shareCopied, setShareCopied] = useState(false);

  // Discover card for spotlight preview & setup review
  const [myDiscoverCard, setMyDiscoverCard] = useState<DiscoverCard | null>(null);
  const [_loadingCard, setLoadingCard] = useState(false);

  useEffect(() => {
    if (isOwnProfile && activeContentTab === 'SPOTLIGHT') {
      let isMounted = true;
      setLoadingCard(true);
      fetchMyDiscoverCardApi(user.id)
        .then((card) => {
          if (isMounted) setMyDiscoverCard(card);
        })
        .catch((err) => {
          console.warn('Could not fetch discover card for setup review:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingCard(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [isOwnProfile, activeContentTab, user.id]);

  // Spotlight Setup Review Computation
  const activeCard: DiscoverCard = myDiscoverCard || {
    id: user.id,
    user,
    isDiscoverable: true,
    mainPhotoUrl: user.photos?.[0] || user.avatar,
    discoveryBio: user.bio || '',
    college: user.college,
    course: user.major,
    interests: user.interests || [],
    showCollege: true,
    showCourse: true,
    showInterests: true,
    availablePhotos: [user.avatar, ...(user.photos || [])].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i),
  };

  const setupAudit = (() => {
    // 1. Photo Check (25 pts)
    const hasPhoto = Boolean(activeCard.mainPhotoUrl || user.avatar);
    const photoScore = hasPhoto ? 25 : 0;

    // 2. Spotlight Bio Check (25 pts)
    const bioText = (activeCard.discoveryBio || '').trim();
    const bioLen = bioText.length;
    let bioScore = 0;
    let bioStatus: 'optimal' | 'short' | 'long' | 'missing' = 'missing';
    let bioFeedback = 'No custom discovery bio set. Add 1-2 punchy sentences.';

    if (bioLen === 0) {
      bioScore = 0;
      bioStatus = 'missing';
      bioFeedback = 'No discovery bio. Add a punchy 1-2 sentence hook.';
    } else if (bioLen < 25) {
      bioScore = 15;
      bioStatus = 'short';
      bioFeedback = 'Bio is a bit short. Add a bit more about your campus passions.';
    } else if (bioLen <= 150) {
      bioScore = 25;
      bioStatus = 'optimal';
      bioFeedback = 'Optimal length! Concise and easy to read during card swiping.';
    } else {
      bioScore = 20;
      bioStatus = 'long';
      bioFeedback = 'Slightly long; swipe cards may truncate lines on smaller screens.';
    }

    // 3. Academic Info Check (20 pts)
    const collegeVisible = Boolean(activeCard.showCollege && (activeCard.college || user.college));
    const courseVisible = Boolean(activeCard.showCourse && (activeCard.course || user.major));
    let academicScore = 0;
    if (collegeVisible && courseVisible) academicScore = 20;
    else if (collegeVisible || courseVisible) academicScore = 10;
    else academicScore = 0;

    // 4. Campus Interests Check (20 pts)
    const activeInterests = (activeCard.showInterests && activeCard.interests) ? activeCard.interests : [];
    let interestsScore = 0;
    if (activeInterests.length >= 3) interestsScore = 20;
    else if (activeInterests.length >= 1) interestsScore = 10;
    else interestsScore = 0;

    // 5. Verification Badge Check (10 pts)
    const isVerified = user.status === 'VERIFIED';
    const isGrace = user.status === 'GRACE_PERIOD';
    const verifyScore = isVerified ? 10 : (isGrace ? 5 : 0);

    const totalScore = photoScore + bioScore + academicScore + interestsScore + verifyScore;

    let ratingLabel = 'All-Star Setup 🚀';
    let ratingColor = '#10B981';
    let ratingDescription = 'Exceptional setup! Your card is primed for maximum visibility and high connection conversion.';

    if (totalScore >= 90) {
      ratingLabel = 'All-Star Setup 🚀';
      ratingColor = '#10B981';
      ratingDescription = 'Exceptional setup! Your card is primed for maximum visibility and high connection conversion.';
    } else if (totalScore >= 75) {
      ratingLabel = 'Strong Setup ⭐';
      ratingColor = '#3B82F6';
      ratingDescription = 'Great card! A couple minor adjustments can help you hit 100% discoverability.';
    } else if (totalScore >= 50) {
      ratingLabel = 'Growing Setup ⚡';
      ratingColor = '#F59E0B';
      ratingDescription = 'Solid foundation. Boost your profile by adding more interests and refining your bio.';
    } else {
      ratingLabel = 'Setup In Progress 🛠️';
      ratingColor = '#EF4444';
      ratingDescription = 'Essential details are missing. Complete your setup to get noticed on campus.';
    }

    // Suggestions list
    const suggestions: string[] = [];
    if (!hasPhoto) suggestions.push('Upload a high-quality portrait photo as your main card image.');
    if (bioStatus === 'missing') suggestions.push('Write a short, engaging Discovery Bio to introduce yourself.');
    else if (bioStatus === 'short') suggestions.push('Expand your bio to 30-100 characters for higher reply rates.');
    else if (bioStatus === 'long') suggestions.push('Trim your bio slightly so it stays fully visible without scrolling.');
    if (!collegeVisible || !courseVisible) suggestions.push('Turn on College and Major visibility to find peers in your field.');
    if (activeInterests.length < 3) suggestions.push('Add at least 3 campus interests or hobby tags (#coding, #music, #sports).');
    if (!isVerified) suggestions.push('Verify your student account to earn the verified badge.');

    return {
      totalScore,
      ratingLabel,
      ratingColor,
      ratingDescription,
      hasPhoto,
      photoScore,
      bioScore,
      bioFeedback,
      collegeVisible,
      courseVisible,
      academicScore,
      activeInterests,
      interestsScore,
      isVerified,
      verifyScore,
      suggestions,
    };
  })();

  // Change Profile Photo Modal state
  const [changePhotoOpen, setChangePhotoOpen] = useState(false);
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [photoSelectedFile, setPhotoSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploadMode, setPhotoUploadMode] = useState<'upload' | 'url'>('upload');
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChangePhoto = () => {
    setPhotoInputUrl(user.avatar || '');
    setPhotoPreview(user.avatar || '');
    setPhotoSelectedFile(null);
    setPhotoError(null);
    setChangePhotoOpen(true);
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    e.target.value = '';
    setPhotoError(null);
    try {
      const file = await convertHeicToJpeg(rawFile);
      setPhotoSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } catch (err) {
      console.warn('Failed to process photo file:', err);
      setPhotoSelectedFile(rawFile);
      setPhotoPreview(URL.createObjectURL(rawFile));
    }
  };

  const handleSavePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoSaving(true);
    setPhotoError(null);

    let finalAvatarUrl = photoInputUrl.trim();

    try {
      if (photoUploadMode === 'upload' && photoSelectedFile) {
        try {
          finalAvatarUrl = await uploadImageApi(photoSelectedFile);
        } catch (uploadErr: any) {
          if (!uploadErr.response && photoPreview) {
            console.warn('Backend offline, using local preview URL', uploadErr);
            finalAvatarUrl = photoPreview;
          } else {
            throw uploadErr;
          }
        }
      } else if (photoUploadMode === 'url') {
        if (!finalAvatarUrl) {
          setPhotoError('Please provide a valid image URL.');
          setPhotoSaving(false);
          return;
        }
      }

      if (!finalAvatarUrl) {
        setPhotoError('No photo selected or entered.');
        setPhotoSaving(false);
        return;
      }

      await onUpdateProfile({
        ...user,
        avatar: finalAvatarUrl,
      });

      setChangePhotoOpen(false);
    } catch (err: any) {
      console.error('Failed to update profile photo', err);
      setPhotoError(err.response?.data?.message || err.message || 'Failed to update profile photo.');
    } finally {
      setPhotoSaving(false);
    }
  };

  // Post creation & editing modal state
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<UserPost | null>(null);
  const [postCaption, setPostCaption] = useState('');
  const [createMediaItems, setCreateMediaItems] = useState<
    { file?: File; previewUrl: string; type: 'IMAGE' | 'VIDEO'; remoteUrl?: string }[]
  >([]);
  const [createPreviewIdx, setCreatePreviewIdx] = useState(0);
  const [createViewMode, setCreateViewMode] = useState<'edit' | 'preview'>('edit');
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedViewerData, setSelectedViewerData] = useState<ImageViewerData | null>(null);
  const [editingImageItem, setEditingImageItem] = useState<{ url: string; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock background scroll when any modal in ProfileView is open
  const isAnyModalOpen =
    editProfileOpen ||
    settingsOpen ||
    editDiscoverCardOpen ||
    changePhotoOpen ||
    createPostOpen ||
    Boolean(editingPost) ||
    Boolean(selectedViewerData) ||
    Boolean(editingImageItem);

  useEffect(() => {
    if (isAnyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isAnyModalOpen]);

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.includes('/video/');
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}?profile=${user.handle}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const handleCreateFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    const processedFiles = await processMediaFiles(rawFiles);
    const newItems: { file: File; previewUrl: string; type: 'IMAGE' | 'VIDEO' }[] = [];
    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i];
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(file.name);
      newItems.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type: isVideo ? 'VIDEO' : 'IMAGE',
      });
    }
    setCreateMediaItems((prev) => [...prev, ...newItems]);
  };

  const handleAddCustomMediaUrl = () => {
    if (!customMediaUrl.trim()) return;
    const url = customMediaUrl.trim();
    const isVideo = isVideoUrl(url);
    setCreateMediaItems((prev) => [
      ...prev,
      { previewUrl: url, remoteUrl: url, type: isVideo ? 'VIDEO' : 'IMAGE' },
    ]);
    setCustomMediaUrl('');
  };

  const handleRemoveCreateMedia = (index: number) => {
    setCreateMediaItems((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (createPreviewIdx >= next.length && next.length > 0) {
        setCreatePreviewIdx(next.length - 1);
      }
      return next;
    });
  };

  const handleMoveCreateMedia = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= createMediaItems.length) return;
    const updated = [...createMediaItems];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setCreateMediaItems(updated);
    setCreatePreviewIdx(targetIdx);
  };

  const handleOpenImageEditor = (idx: number) => {
    const item = createMediaItems[idx];
    if (item && item.type === 'IMAGE') {
      setEditingImageItem({ url: item.previewUrl, index: idx });
    }
  };

  const handleApplyImageEdit = (editedFile: File, editedPreviewUrl: string) => {
    if (!editingImageItem) return;
    const idx = editingImageItem.index;
    setCreateMediaItems((prev) => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          file: editedFile,
          previewUrl: editedPreviewUrl,
          remoteUrl: undefined,
        };
      }
      return updated;
    });
    setEditingImageItem(null);
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postCaption.trim() || createMediaItems.length === 0) return;

    setUploading(true);
    const finalMedia: PostMediaItem[] = [];

    try {
      for (const item of createMediaItems) {
        if (item.file) {
          const uploaded = await uploadMediaApi(item.file);
          finalMedia.push(uploaded);
        } else if (item.remoteUrl || item.previewUrl) {
          finalMedia.push({
            url: item.remoteUrl || item.previewUrl,
            type: item.type,
          });
        }
      }

      if (finalMedia.length === 0) return;

      if (onCreatePost) {
        await onCreatePost(postCaption.trim(), finalMedia[0].url, finalMedia);
      }

      setPostCaption('');
      setCreateMediaItems([]);
      setCreatePreviewIdx(0);
      setCreateViewMode('edit');
      setCreatePostOpen(false);
    } catch (err) {
      console.error('Create post failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-6 px-4 transition-colors duration-200"
      style={{
        backgroundColor: theme.background,
        color: theme.primaryText,
      }}
    >
      <div className="max-w-2xl mx-auto pb-24">
        {/* ========================================================================= */}
        {/* 1. TOP NAVIGATION BAR                                                    */}
        {/* ========================================================================= */}
        <header
          className="flex items-center justify-between pb-4 mb-6 border-b"
          style={{ borderColor: theme.border }}
        >
          {/* Left: Orbitly Logo and Name (or Back button when inspecting peer profile) */}
          {isOwnProfile ? (
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
              onClick={() => onNavigateTab('discovery')}
              title="Orbitly - Discovery"
            >
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: theme.accent,
                  boxShadow: `0 4px 15px ${theme.accentMuted}`,
                  color: theme.isDark ? '#000000' : '#ffffff',
                }}
              >
                <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <h1
                className="font-extrabold text-base sm:text-lg tracking-tight transition-colors"
                style={{ color: theme.primaryText }}
              >
                Orbitly
              </h1>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  onNavigateTab('discovery');
                }
              }}
              className="p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.secondaryText,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Share Profile Icon */}
            <button
              type="button"
              onClick={handleShareProfile}
              className="p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-semibold"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: shareCopied ? theme.accent : theme.secondaryText,
              }}
              title="Share profile link"
            >
              {shareCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {shareCopied && <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline">Copied!</span>}
            </button>

            {/* Post Update (if own profile) */}
            {isOwnProfile && onCreatePost && (
              <button
                type="button"
                onClick={() => setCreatePostOpen(true)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.isDark ? '#000000' : '#ffffff',
                }}
                title="Create a post"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Post</span>
              </button>
            )}

            {/* Settings Icon (if own profile) */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-xl border transition-colors"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.secondaryText,
                }}
                title="Profile & Theme Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. LARGE, CENTERED, CIRCULAR PROFILE PICTURE                              */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className="relative cursor-pointer group select-none"
            onClick={() => {
              const allPhotos = [user.avatar, ...(user.photos || [])].filter(
                (v, i, a) => Boolean(v) && a.indexOf(v) === i
              );
              setSelectedViewerData({
                imageUrl: user.avatar,
                images: allPhotos,
                currentIndex: 0,
                caption: `${user.displayName} (@${user.handle})`,
                author: user,
              });
            }}
            title="Click to view full photo"
          >
            <div
              className="p-1 rounded-full transition-transform duration-300 group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentMuted})`,
                boxShadow: `0 8px 30px ${theme.accentMuted}`,
              }}
            >
              <Avatar
                src={user.avatar}
                name={user.displayName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4"
                style={{
                  borderColor: theme.background,
                  backgroundColor: theme.card,
                }}
                iconClassName="text-3xl font-extrabold"
              />
            </div>

            {user.status === 'VERIFIED' && (
              <div
                className={`absolute bottom-1 ${isOwnProfile ? 'left-1' : 'right-1'} p-1.5 rounded-full border shadow-lg cursor-pointer group/ver z-20`}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
                title="Insta Verified"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/ver:flex items-center px-2 py-0.5 text-[10px] font-bold text-white bg-zinc-900 border border-zinc-700 rounded-md shadow-xl whitespace-nowrap pointer-events-none z-30">
                  Insta Verified
                </span>
              </div>
            )}

            {isOwnProfile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenChangePhoto();
                }}
                className="absolute bottom-1 right-1 p-2 rounded-full border shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 z-20 group/cam"
                style={{
                  backgroundColor: theme.accent,
                  borderColor: theme.background,
                  color: theme.isDark ? '#000000' : '#ffffff',
                }}
                title="Change profile photo"
              >
                <Camera className="w-4 h-4 transition-transform group-hover/cam:rotate-12" />
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. USER'S FULL NAME                                                      */}
          {/* ========================================================================= */}
          <h1
            className="text-2xl sm:text-3xl font-black mt-3.5 tracking-tight"
            style={{ color: theme.primaryText }}
          >
            {user.displayName}
          </h1>

          {/* ========================================================================= */}
          {/* 4. USERNAME                                                              */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-center mt-1">
            <span
              className="text-xs sm:text-sm font-semibold tracking-wide"
              style={{ color: theme.secondaryText }}
            >
              @{user.handle}
            </span>
          </div>

          {/* ========================================================================= */}
          {/* 5. SOCIAL STATISTICS ROW (POSTS, CONNECTIONS)                            */}
          {/* ========================================================================= */}
          <div
            className={`flex items-center justify-center ${isOwnProfile ? 'gap-6 sm:gap-16 px-6 sm:px-12' : 'px-8 sm:px-14'} my-5 py-3 rounded-2xl border`}
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <div className="text-center min-w-[70px]">
              <div className="text-base sm:text-lg font-black" style={{ color: theme.primaryText }}>
                {isConnected ? posts.length : '🔒'}
              </div>
              <div className="text-[11px] sm:text-xs font-semibold" style={{ color: theme.secondaryText }}>
                Posts
              </div>
            </div>

            {isOwnProfile && (
              <>
                <div className="h-7 w-[1px]" style={{ backgroundColor: theme.border }} />

                <div className="text-center min-w-[70px]">
                  <div className="text-base sm:text-lg font-black" style={{ color: theme.primaryText }}>
                    {connections.length}
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold" style={{ color: theme.secondaryText }}>
                    Connections
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 6. SHORT PROFILE BIO (CENTER-ALIGNED)                                    */}
          {/* ========================================================================= */}
          <p
            className="max-w-md mx-auto text-center text-xs sm:text-sm leading-relaxed whitespace-pre-wrap px-2 mb-6 font-normal"
            style={{ color: theme.primaryText }}
          >
            {user.bio || 'Campus community member excited to connect with classmates.'}
          </p>

          {/* ========================================================================= */}
          {/* 9. ACTION BUTTONS (EDIT PROFILE, SHARE PROFILE, CONNECT, CHAT)           */}
          {/* ========================================================================= */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8 w-full max-w-md">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-95"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.20)',
                    color: theme.primaryText,
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditDiscoverCardOpen(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-95"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.20)',
                    color: theme.primaryText,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                  <span>Edit Discover Card</span>
                </button>
              </>
            ) : existingConn ? (
              <>
                {onOpenChatWithConnection && (
                  <button
                    type="button"
                    onClick={() => onOpenChatWithConnection(existingConn.id)}
                    className="flex-1 py-2.5 px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.isDark ? '#000000' : '#ffffff',
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat Now</span>
                  </button>
                )}

                {onRemoveConnection && (
                  <button
                    type="button"
                    onClick={() => onRemoveConnection(existingConn.id, user)}
                    className="py-2.5 px-4 rounded-xl border text-xs font-semibold hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border-slate-700 transition-colors flex items-center gap-1.5"
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    }}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Unfollow</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.secondaryText,
                  }}
                  title="Share Profile"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                {onSendConnectRequest && (
                  <button
                    type="button"
                    onClick={() => onSendConnectRequest(user)}
                    className="flex-1 py-2.5 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.isDark ? '#000000' : '#ffffff',
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Send Connect Request</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.secondaryText,
                  }}
                  title="Share Profile"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 10. CONTENT NAVIGATION TABS (POSTS, SPOTLIGHT CARD, ABOUT)                */}
        {/* ========================================================================= */}
        <div
          className="flex items-center justify-center border-t border-b mb-6 select-none"
          style={{ borderColor: theme.border }}
        >
          <button
            type="button"
            onClick={() => setActiveContentTab('POSTS')}
            className="flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all relative"
            style={{
              color: activeContentTab === 'POSTS' ? theme.accent : theme.secondaryText,
            }}
          >
            <Grid className="w-4 h-4" />
            <span>Posts ({isConnected ? posts.length : '—'})</span>
            {activeContentTab === 'POSTS' && (
              <span
                className="absolute bottom-0 inset-x-8 h-0.5 rounded-full"
                style={{ backgroundColor: theme.accent }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveContentTab('SPOTLIGHT')}
            className="flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all relative"
            style={{
              color: activeContentTab === 'SPOTLIGHT' ? theme.accent : theme.secondaryText,
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Spotlight Card</span>
            {activeContentTab === 'SPOTLIGHT' && (
              <span
                className="absolute bottom-0 inset-x-8 h-0.5 rounded-full"
                style={{ backgroundColor: theme.accent }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveContentTab('ABOUT')}
            className="flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all relative"
            style={{
              color: activeContentTab === 'ABOUT' ? theme.accent : theme.secondaryText,
            }}
          >
            <Info className="w-4 h-4" />
            <span>Details</span>
            {activeContentTab === 'ABOUT' && (
              <span
                className="absolute bottom-0 inset-x-8 h-0.5 rounded-full"
                style={{ backgroundColor: theme.accent }}
              />
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 11. TAB 1: THREE-COLUMN PHOTO & VIDEO GRID                               */}
        {/* ========================================================================= */}
        {activeContentTab === 'POSTS' && (
          <div>
            {!isConnected ? (
              <div
                className="p-8 text-center rounded-3xl border shadow-xl"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    backgroundColor: theme.card,
                    color: theme.accent,
                  }}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold" style={{ color: theme.primaryText }}>
                  Student Posts are Private
                </h3>
                <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: theme.secondaryText }}>
                  @{user.handle}'s posts and photo updates are only visible to confirmed connections.
                </p>
                {onSendConnectRequest && (
                  <button
                    type="button"
                    onClick={() => onSendConnectRequest(user)}
                    className="mt-4 px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-lg transition-all active:scale-95"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.isDark ? '#000000' : '#ffffff',
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Connect to Unlock Profile</span>
                  </button>
                )}
              </div>
            ) : posts.length === 0 ? (
              <div
                className="p-10 text-center rounded-3xl border shadow-xl"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" style={{ color: theme.secondaryText }} />
                <h3 className="text-sm font-bold" style={{ color: theme.primaryText }}>
                  No posts shared on profile yet
                </h3>
                <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: theme.secondaryText }}>
                  {isOwnProfile
                    ? 'Share achievements, campus photos, project updates, or student life moments!'
                    : 'This student has not published any personal profile posts yet.'}
                </p>
                {isOwnProfile && onCreatePost && (
                  <button
                    type="button"
                    onClick={() => setCreatePostOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold border transition-colors inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.accent,
                      color: theme.accent,
                    }}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Publish First Post</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {posts.map((post) => {
                  const isVideo = isVideoUrl(post.imageUrl);
                  const hasMultiMedia = Boolean(post.media && post.media.length > 1);
                  const postMediaCount = post.media?.length || 1;

                  const postViewerItems = post.media && post.media.length > 0
                    ? post.media.map((m) => ({
                        imageUrl: m.url,
                        caption: post.caption,
                        author: user,
                        createdAt: post.createdAt,
                        likesCount: post.likesCount,
                        isLiked: post.isLiked,
                        onLike: () => onLikePost?.(post.id),
                      }))
                    : [{
                        imageUrl: post.imageUrl,
                        caption: post.caption,
                        author: user,
                        createdAt: post.createdAt,
                        likesCount: post.likesCount,
                        isLiked: post.isLiked,
                        onLike: () => onLikePost?.(post.id),
                      }];

                  return (
                    <div
                      key={post.id}
                      onClick={() =>
                        setSelectedViewerData({
                          imageUrl: post.imageUrl,
                          items: postViewerItems,
                          caption: post.caption,
                          author: user,
                          createdAt: post.createdAt,
                          likesCount: post.likesCount,
                          isLiked: post.isLiked,
                          onLike: () => onLikePost?.(post.id),
                        })
                      }
                      className="relative aspect-square overflow-hidden rounded-xl sm:rounded-2xl group cursor-zoom-in border transition-all"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      }}
                    >
                      {isVideo ? (
                        <video
                          src={post.imageUrl}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={post.imageUrl}
                          alt={post.caption}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}

                      {/* Top Badges: Multi-photo or Video */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 pointer-events-none">
                        {hasMultiMedia && (
                          <div className="px-1.5 py-0.5 rounded-lg bg-black/65 text-white backdrop-blur-sm shadow-md flex items-center gap-1 text-[10px] font-bold">
                            <Layers className="w-3 h-3 text-white" />
                            <span>{postMediaCount}</span>
                          </div>
                        )}
                        {isVideo && (
                          <div className="p-1 rounded-lg bg-black/65 text-white backdrop-blur-sm shadow-md">
                            <Play className="w-3 h-3 fill-white" />
                          </div>
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                        <div className="flex justify-end gap-1.5">
                          {isOwnProfile && onEditPost && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPost(post);
                              }}
                              className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white transition-all shadow-md"
                              title="Edit post"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isOwnProfile && onDeletePost && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePost(post.id);
                              }}
                              className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white transition-all shadow-md"
                              title="Delete post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] text-white font-medium line-clamp-2 leading-tight">
                            {post.caption}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-white/90 mt-1 font-semibold">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                              <span>{post.likesCount || 0}</span>
                            </div>
                            {post.updatedAt && (
                              <span className="text-[9px] text-slate-300 italic">
                                (Edited)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 11. TAB 2: SPOTLIGHT DISCOVER CARD PREVIEW & SETUP REVIEW                 */}
        {/* ========================================================================= */}
        {activeContentTab === 'SPOTLIGHT' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div
              className="p-5 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold" style={{ color: theme.primaryText }}>Campus Discover Card</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: theme.accentMuted,
                      borderColor: theme.accent,
                      color: theme.accent,
                    }}
                  >
                    Spotlight Preview & Setup Review
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.secondaryText }}>
                  Live preview of how your card appears to students swiping on campus, with an automated audit of your profile strength.
                </p>
              </div>

              {isOwnProfile && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenChangePhoto}
                    className="px-3 py-2 rounded-xl font-bold text-xs border transition-all active:scale-95 flex items-center gap-1.5"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.primaryText,
                    }}
                    title="Change Profile Photo"
                  >
                    <Camera className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                    <span>Change Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDiscoverCardOpen(true)}
                    className="px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.isDark ? '#000000' : '#ffffff',
                    }}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Customize Card</span>
                  </button>
                </div>
              )}
            </div>

            {/* If looking at own profile: 2-column layout with Card Preview + Setup Review */}
            {isOwnProfile ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Swipe Card Simulator */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="w-full max-w-sm">
                    <div className="flex items-center justify-between text-xs font-bold mb-2 px-1" style={{ color: theme.secondaryText }}>
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                        Card Appearance
                      </span>
                      <span className="text-[11px] font-normal">Swipe Simulator</span>
                    </div>

                    <DiscoveryCard
                      card={activeCard}
                      previewMode
                    />

                    <p className="text-[11px] text-center mt-3" style={{ color: theme.secondaryText }}>
                      Interactive full-bleed card displayed in Discovery swipe stack
                    </p>
                  </div>
                </div>

                {/* Right Column: Setup Review & Strength Score */}
                <div className="lg:col-span-7 space-y-4">
                  {/* 1. Score & Rating Header Card */}
                  <div
                    className="p-5 rounded-3xl border shadow-xl relative overflow-hidden"
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: theme.secondaryText }}>
                          Card Strength & Setup Review
                        </span>
                        <h4 className="text-xl font-black mt-0.5 flex items-center gap-2" style={{ color: theme.primaryText }}>
                          <span>{setupAudit.ratingLabel}</span>
                        </h4>
                      </div>

                      {/* Numerical Score Pill */}
                      <div
                        className="px-3.5 py-1.5 rounded-2xl border flex items-center gap-2 shadow-inner"
                        style={{
                          backgroundColor: theme.card,
                          borderColor: setupAudit.ratingColor,
                        }}
                      >
                        <TrendingUp className="w-4 h-4" style={{ color: setupAudit.ratingColor }} />
                        <span className="text-lg font-black" style={{ color: setupAudit.ratingColor }}>
                          {setupAudit.totalScore}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3.5 w-full bg-black/20 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${setupAudit.totalScore}%`,
                          backgroundColor: setupAudit.ratingColor,
                        }}
                      />
                    </div>

                    <p className="text-xs mt-3 leading-relaxed" style={{ color: theme.secondaryText }}>
                      {setupAudit.ratingDescription}
                    </p>
                  </div>

                  {/* 2. Setup Audit Checklist */}
                  <div
                    className="p-5 rounded-3xl border shadow-xl space-y-3"
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.border }}>
                      <h5 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.secondaryText }}>
                        Setup Audit Checklist
                      </h5>
                      <span className="text-[11px] font-semibold" style={{ color: theme.accent }}>
                        5 Verification Points
                      </span>
                    </div>

                    {/* Item 1: Photo */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ backgroundColor: theme.card }}>
                      {setupAudit.hasPhoto ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: theme.primaryText }}>Hero Photo Quality</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5" style={{ color: theme.accent }}>
                            {setupAudit.photoScore}/25 pts
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: theme.secondaryText }}>
                          {setupAudit.hasPhoto
                            ? 'High-resolution photo set as card background.'
                            : 'No portrait photo configured. Cards without photos get passed over.'}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleOpenChangePhoto}
                            className="text-[11px] font-bold flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
                            style={{ color: theme.accent }}
                          >
                            <Camera className="w-3 h-3" />
                            <span>Change Photo</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item 2: Bio */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ backgroundColor: theme.card }}>
                      {setupAudit.bioScore === 25 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : setupAudit.bioScore > 0 ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: theme.primaryText }}>Spotlight Bio</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5" style={{ color: theme.accent }}>
                            {setupAudit.bioScore}/25 pts
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: theme.secondaryText }}>
                          {setupAudit.bioFeedback}
                        </p>
                      </div>
                    </div>

                    {/* Item 3: Academic Presence */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ backgroundColor: theme.card }}>
                      {setupAudit.academicScore === 20 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : setupAudit.academicScore > 0 ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: theme.primaryText }}>Campus & Major Visibility</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5" style={{ color: theme.accent }}>
                            {setupAudit.academicScore}/20 pts
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: theme.secondaryText }}>
                          {setupAudit.collegeVisible && setupAudit.courseVisible
                            ? `Displaying ${activeCard.college || user.college || 'College'} and ${activeCard.course || user.major}.`
                            : 'College or Major badge hidden. Enabling both increases connection acceptance by 2.5x.'}
                        </p>
                      </div>
                    </div>

                    {/* Item 4: Campus Interests */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ backgroundColor: theme.card }}>
                      {setupAudit.interestsScore === 20 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: theme.primaryText }}>Interest Hashtags</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5" style={{ color: theme.accent }}>
                            {setupAudit.interestsScore}/20 pts
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: theme.secondaryText }}>
                          {setupAudit.activeInterests.length >= 3
                            ? `${setupAudit.activeInterests.length} interest tags visible. Drives matching with shared interest groups.`
                            : `${setupAudit.activeInterests.length} interest tags visible. Recommended: at least 3 tags.`}
                        </p>
                      </div>
                    </div>

                    {/* Item 5: Instagram Verification */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ backgroundColor: theme.card }}>
                      {setupAudit.isVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: theme.primaryText }}>Instagram Verification</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5" style={{ color: theme.accent }}>
                            {setupAudit.verifyScore}/10 pts
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: theme.secondaryText }}>
                          {setupAudit.isVerified
                            ? 'Insta Verified badge displayed on card.'
                            : 'Unverified Instagram status. Verified users get a badge.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Actionable Recommendations */}
                  {setupAudit.suggestions.length > 0 && (
                    <div
                      className="p-5 rounded-3xl border shadow-xl space-y-2.5"
                      style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" style={{ color: theme.accent }} />
                        <h5 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.primaryText }}>
                          Recommendations to Improve Setup
                        </h5>
                      </div>

                      <ul className="space-y-1.5 pl-1">
                        {setupAudit.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs flex items-start gap-2" style={{ color: theme.secondaryText }}>
                            <span className="text-xs font-bold mt-0.5" style={{ color: theme.accent }}>•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditDiscoverCardOpen(true)}
                          className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                          style={{
                            backgroundColor: theme.accent,
                            color: theme.isDark ? '#000000' : '#ffffff',
                          }}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Optimize Card Now</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* If viewing someone else's profile: centered card preview */
              <div className="flex justify-center pt-2">
                <DiscoveryCard
                  card={activeCard}
                  previewMode
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 11. TAB 3: DETAILS & CAMPUS ACADEMIC INFO                                 */}
        {/* ========================================================================= */}
        {activeContentTab === 'ABOUT' && (
          <div className="space-y-4">
            <div
              className="p-5 rounded-3xl border shadow-xl space-y-4"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: theme.secondaryText }}>
                  About & Bio
                </span>
                <p className="text-xs leading-relaxed" style={{ color: theme.primaryText }}>
                  {user.bio || 'No extended biography provided yet.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: theme.border }}>
                <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.secondaryText }}>
                    Field of Study
                  </div>
                  <div className="text-xs font-bold" style={{ color: theme.primaryText }}>{user.major}</div>
                </div>

                <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.secondaryText }}>
                    Graduation Year
                  </div>
                  <div className="text-xs font-bold" style={{ color: theme.primaryText }}>{user.year}</div>
                </div>

                <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.secondaryText }}>
                    Institution
                  </div>
                  <div className="text-xs font-bold" style={{ color: theme.primaryText }}>{user.college || 'Campus Community'}</div>
                </div>

                <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.secondaryText }}>
                    Instagram Account
                  </div>
                  <div className="text-xs font-bold flex items-center gap-1" style={{ color: theme.accent }}>
                    <Instagram className="w-3.5 h-3.5" />
                    <span>@{user.handle}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                   */}
      {/* ========================================================================= */}

      {/* 1. Edit Profile Modal */}
      {editProfileOpen && (
        <EditProfileModal
          isOpen={editProfileOpen}
          profile={user}
          onClose={() => setEditProfileOpen(false)}
          onSave={onUpdateProfile}
        />
      )}

      {/* 2. Settings Modal with Themes */}
      {settingsOpen && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
          onLogout={() => {
            setSettingsOpen(false);
            onLogout?.();
          }}
          onEditProfile={() => {
            setSettingsOpen(false);
            setEditProfileOpen(true);
          }}
        />
      )}

      {/* 3. Edit Discover Card Modal */}
      {editDiscoverCardOpen && (
        <EditDiscoverCardModal
          user={user}
          onClose={() => setEditDiscoverCardOpen(false)}
          onSaved={(updatedCard) => {
            setEditDiscoverCardOpen(false);
            if (updatedCard) {
              setMyDiscoverCard(updatedCard);
              if (onUpdateProfile) {
                const mergedUser: UserProfile = {
                  ...user,
                  ...(updatedCard.user || {}),
                  isPassout: updatedCard.isPassout ?? updatedCard.user?.isPassout ?? user.isPassout,
                  college: updatedCard.college || updatedCard.user?.college || user.college,
                  fieldOfStudy: updatedCard.fieldOfStudy || updatedCard.user?.fieldOfStudy || user.fieldOfStudy,
                  organization: updatedCard.organization || updatedCard.user?.organization || user.organization,
                  roleTitle: updatedCard.roleTitle || updatedCard.user?.roleTitle || user.roleTitle,
                  interests: Array.isArray(updatedCard.interests) ? updatedCard.interests : (updatedCard.user?.interests || user.interests),
                };
                onUpdateProfile(mergedUser);
              }
            }
          }}
        />
      )}

      {/* 4. Fullscreen Media Viewer Modal */}
      {selectedViewerData && (
        <ImageViewerModal
          isOpen={Boolean(selectedViewerData)}
          onClose={() => setSelectedViewerData(null)}
          data={selectedViewerData}
        />
      )}

      {/* 5. Create Post Modal */}
      {createPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain">
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border overscroll-contain animate-in fade-in duration-200"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.primaryText,
            }}
          >
            <div className="flex items-center justify-between pb-3.5 border-b mb-4" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center border"
                  style={{
                    backgroundColor: theme.accentMuted,
                    borderColor: theme.accent,
                    color: theme.accent,
                  }}
                >
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: theme.primaryText }}>Post</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle: Compose / Preview */}
                <div className="flex rounded-xl p-0.5 border" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                  <button
                    type="button"
                    onClick={() => setCreateViewMode('edit')}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all"
                    style={{
                      backgroundColor: createViewMode === 'edit' ? theme.accent : 'transparent',
                      color: createViewMode === 'edit' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                    }}
                  >
                    Compose
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateViewMode('preview')}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                    style={{
                      backgroundColor: createViewMode === 'preview' ? theme.accent : 'transparent',
                      color: createViewMode === 'preview' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            </div>

            {createViewMode === 'preview' ? (
              /* ================= LIVE PREVIEW CARD ================= */
              <div className="space-y-4">
                <div
                  className="rounded-2xl border overflow-hidden shadow-xl"
                  style={{ backgroundColor: theme.card, borderColor: theme.border }}
                >
                  {/* Author Header */}
                  <div className="p-3 flex items-center justify-between border-b" style={{ borderColor: theme.border }}>
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={user.avatar}
                        name={user.displayName}
                        className="w-8 h-8 rounded-full border"
                        style={{ borderColor: theme.accent }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold leading-tight" style={{ color: theme.primaryText }}>
                            {user.displayName}
                          </span>
                        </div>
                        <span className="text-[10px]" style={{ color: theme.accent }}>
                          @{user.handle} • Just now
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 font-semibold text-slate-400">
                      Preview
                    </span>
                  </div>

                  {/* Media Carousel Preview */}
                  {createMediaItems.length > 0 ? (
                    <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center group">
                      {createMediaItems[createPreviewIdx]?.type === 'VIDEO' ? (
                        <video
                          key={createMediaItems[createPreviewIdx].previewUrl}
                          src={createMediaItems[createPreviewIdx].previewUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div
                          onClick={() => handleOpenImageEditor(createPreviewIdx)}
                          className="w-full h-full relative cursor-pointer group/img flex items-center justify-center select-none"
                          title="Click on photo to edit (crop, filters, adjustments)"
                        >
                          <img
                            key={createMediaItems[createPreviewIdx]?.previewUrl}
                            src={createMediaItems[createPreviewIdx]?.previewUrl}
                            alt="Preview"
                            className="w-full h-full object-contain transition-transform duration-200 group-hover/img:scale-[1.01]"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="px-3.5 py-2 rounded-full bg-black/85 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-2 shadow-2xl">
                              <Sliders className="w-3.5 h-3.5 text-pink-400" />
                              <span>Click to Edit Photo</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Edit Photo Quick Pill (Top-Left) */}
                      {createMediaItems[createPreviewIdx]?.type === 'IMAGE' && (
                        <button
                          type="button"
                          onClick={() => handleOpenImageEditor(createPreviewIdx)}
                          className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 text-[11px] font-bold flex items-center gap-1.5 shadow-xl transition-all active:scale-95"
                          title="Edit Photo (crop & filters)"
                        >
                          <Sliders className="w-3 h-3 text-pink-400" />
                          <span>Edit Photo</span>
                        </button>
                      )}

                      {/* Top-Right Counter Pill */}
                      {createMediaItems.length > 1 && (
                        <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                          {createPreviewIdx + 1} / {createMediaItems.length}
                        </div>
                      )}

                      {/* Left / Right Carousel Buttons */}
                      {createMediaItems.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setCreatePreviewIdx((p) => (p > 0 ? p - 1 : createMediaItems.length - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all active:scale-95"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreatePreviewIdx((p) => (p < createMediaItems.length - 1 ? p + 1 : 0))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all active:scale-95"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Bottom Dots Indicator */}
                      {createMediaItems.length > 1 && (
                        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                          {createMediaItems.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                idx === createPreviewIdx ? 'bg-white scale-125' : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center text-xs text-slate-500">
                      No media selected yet
                    </div>
                  )}

                  {/* Caption & Likes Preview */}
                  <div className="p-3.5 space-y-1.5">
                    <p className="text-xs leading-relaxed" style={{ color: theme.primaryText }}>
                      <span className="font-bold mr-1.5" style={{ color: theme.primaryText }}>
                        {user.handle}
                      </span>
                      {postCaption || <span className="italic text-slate-500">No caption written yet...</span>}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateViewMode('edit')}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs border transition-colors"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.secondaryText,
                    }}
                  >
                    Back to Compose
                  </button>
                  <button
                    type="button"
                    onClick={handleCreatePostSubmit}
                    disabled={uploading || createMediaItems.length === 0 || !postCaption.trim()}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs btn-theme-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <span>Publish Now</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* ================= COMPOSE MODE FORM ================= */
              <form onSubmit={handleCreatePostSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: theme.secondaryText }}>
                    Caption
                  </label>
                  <textarea
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    placeholder="Share a campus moment, achievement, project, or story..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-colors resize-none"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.secondaryText,
                    }}
                    required
                  />
                </div>

                {/* Multi-Media Selection Tray */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.secondaryText }}>
                      Media Slides ({createMediaItems.length} selected)
                    </label>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.heic,.heif,.HEIC,.HEIF"
                    onChange={handleCreateFilesSelected}
                    className="hidden"
                  />

                  {/* Upload button */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.accent,
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Select Photos & Videos (Multiple allowed)</span>
                    </button>
                  </div>

                  {/* Add via URL row */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="url"
                      value={customMediaUrl}
                      onChange={(e) => setCustomMediaUrl(e.target.value)}
                      placeholder="Or paste media URL (photo or video)..."
                      className="flex-1 px-3 py-1.5 rounded-xl border text-xs outline-none"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomMediaUrl}
                      disabled={!customMediaUrl.trim()}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Media items carousel preview list */}
                  {createMediaItems.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {createMediaItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl border transition-all"
                          style={{ backgroundColor: theme.card, borderColor: theme.border }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0 flex items-center justify-center">
                              {item.type === 'VIDEO' ? (
                                <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={item.previewUrl} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                              )}
                              <div className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white">
                                {item.type === 'VIDEO' ? (
                                  <Film className="w-2.5 h-2.5 text-pink-400" />
                                ) : (
                                  <ImageIcon className="w-2.5 h-2.5 text-blue-400" />
                                )}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold" style={{ color: theme.primaryText }}>
                                  Slide {idx + 1}
                                </span>
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                                  {item.type}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate max-w-[180px] sm:max-w-xs">
                                {item.file?.name || item.previewUrl}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveCreateMedia(idx, 'left')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                              title="Move Earlier"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCreateMedia(idx, 'right')}
                              disabled={idx === createMediaItems.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                              title="Move Later"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCreateMedia(idx)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                              title="Remove slide"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                      style={{
                        borderColor: theme.border,
                        backgroundColor: theme.card,
                        color: theme.secondaryText,
                      }}
                    >
                      <Upload className="w-6 h-6" style={{ color: theme.accent }} />
                      <span className="text-xs font-semibold">Select one or more photos / videos</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreatePostOpen(false)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs border transition-colors flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.secondaryText,
                    }}
                  >
                    <span>Cancel</span>
                  </button>

                  <button
                    type="submit"
                    disabled={uploading || createMediaItems.length === 0 || !postCaption.trim()}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs btn-theme-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading Media...</span>
                      </>
                    ) : (
                      <span>Publish to Profile</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Change Profile Photo Modal */}
      {changePhotoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl relative border overscroll-contain"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.primaryText,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b mb-5" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                  style={{
                    backgroundColor: theme.accentMuted,
                    borderColor: theme.accent,
                    color: theme.accent,
                  }}
                >
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black" style={{ color: theme.primaryText }}>Change Profile Photo</h3>
                  <p className="text-xs" style={{ color: theme.secondaryText }}>Update your public campus portrait</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangePhotoOpen(false)}
                className="p-2 rounded-xl transition-colors"
                style={{
                  backgroundColor: theme.card,
                  color: theme.secondaryText,
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {photoError && (
              <div className="p-3 mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {/* Avatar Live Preview */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div
                className="p-1 rounded-full relative group shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentMuted})`,
                }}
              >
                <Avatar
                  src={photoPreview || user.avatar}
                  name={user.displayName}
                  className="w-28 h-28 rounded-full border-4"
                  style={{
                    borderColor: theme.background,
                    backgroundColor: theme.card,
                  }}
                  iconClassName="text-3xl font-extrabold"
                />
              </div>
              <span className="text-[11px] mt-2 font-medium" style={{ color: theme.secondaryText }}>
                Circular profile photo preview
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div
              className="flex items-center p-1 rounded-2xl mb-4 border"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              <button
                type="button"
                onClick={() => setPhotoUploadMode('upload')}
                className="flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: photoUploadMode === 'upload' ? theme.accent : 'transparent',
                  color: photoUploadMode === 'upload' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setPhotoUploadMode('url')}
                className="flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: photoUploadMode === 'url' ? theme.accent : 'transparent',
                  color: photoUploadMode === 'url' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                }}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image Link</span>
              </button>
            </div>

            <form onSubmit={handleSavePhotoSubmit} className="space-y-4">
              {photoUploadMode === 'upload' ? (
                <div>
                  <input
                    ref={photoFileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif,.HEIC,.HEIF"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                  {photoSelectedFile ? (
                    <div
                      className="p-3.5 rounded-2xl border flex items-center justify-between"
                      style={{ backgroundColor: theme.card, borderColor: theme.border }}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <ImageIcon className="w-4 h-4 shrink-0" style={{ color: theme.accent }} />
                        <span className="text-xs truncate font-medium" style={{ color: theme.primaryText }}>
                          {photoSelectedFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoSelectedFile(null);
                          setPhotoPreview(user.avatar || '');
                        }}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => photoFileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:border-current"
                      style={{
                        borderColor: theme.border,
                        backgroundColor: theme.card,
                        color: theme.secondaryText,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.accentMuted, color: theme.accent }}
                      >
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold" style={{ color: theme.primaryText }}>
                        Click to browse photo from device
                      </span>
                      <span className="text-[11px]" style={{ color: theme.secondaryText }}>
                        PNG, JPG, WEBP up to 10MB
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: theme.secondaryText }}>
                    Image Link / Web URL
                  </label>
                  <input
                    type="url"
                    value={photoInputUrl}
                    onChange={(e) => {
                      setPhotoInputUrl(e.target.value);
                      setPhotoPreview(e.target.value);
                    }}
                    placeholder="https://... or paste image link"
                    className="w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-colors"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.primaryText,
                    }}
                  />
                  <p className="text-[11px] mt-1" style={{ color: theme.secondaryText }}>
                    Paste a direct image URL from Unsplash or cloud storage
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePhotoOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs border transition-colors"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.secondaryText,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={photoSaving || (!photoSelectedFile && !photoInputUrl.trim())}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs btn-theme-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {photoSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Photo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Photo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          isOpen={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          currentUser={currentUser || user}
          onSave={async (postId, caption, media) => {
            if (onEditPost) {
              await onEditPost(postId, caption, media);
            }
            setEditingPost(null);
          }}
          theme={theme}
        />
      )}

      {/* 8. Image Editor Modal (Crop, Filters, Adjustments) */}
      {editingImageItem && (
        <ImageEditorModal
          isOpen={Boolean(editingImageItem)}
          imageUrl={editingImageItem.url}
          onClose={() => setEditingImageItem(null)}
          onApply={handleApplyImageEdit}
        />
      )}
    </div>
  );
};
