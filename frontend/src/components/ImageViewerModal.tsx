import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  X,
  Heart,
  Share2,
  Download,
  ZoomIn,
  ZoomOut,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Check,
} from 'lucide-react';
import { UserProfile } from '../types';

export interface ImageViewerItem {
  imageUrl: string;
  caption?: string;
  author?: UserProfile;
  createdAt?: string;
  likesCount?: number;
  isLiked?: boolean;
  onLike?: () => void;
}

export interface ImageViewerData {
  imageUrl: string;
  images?: string[];
  items?: ImageViewerItem[];
  currentIndex?: number;
  caption?: string;
  author?: UserProfile;
  createdAt?: string;
  likesCount?: number;
  isLiked?: boolean;
  onLike?: () => void;
  onIndexChange?: (newIndex: number) => void;
  onSelectPhoto?: (photoUrl: string) => void;
  selectPhotoLabel?: string;
}

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ImageViewerData | null;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Normalize items list from items, images, or single imageUrl
  const resolvedItems: ImageViewerItem[] = useMemo(() => {
    if (!data) return [];
    if (data.items && data.items.length > 0) {
      return data.items;
    }
    if (data.images && data.images.length > 0) {
      return data.images.map((img) => ({
        imageUrl: img,
        caption: data.caption,
        author: data.author,
        createdAt: data.createdAt,
        likesCount: data.likesCount,
        isLiked: data.isLiked,
        onLike: data.onLike,
      }));
    }
    return [
      {
        imageUrl: data.imageUrl,
        caption: data.caption,
        author: data.author,
        createdAt: data.createdAt,
        likesCount: data.likesCount,
        isLiked: data.isLiked,
        onLike: data.onLike,
      },
    ];
  }, [data]);

  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    if (!data) return 0;
    if (
      typeof data.currentIndex === 'number' &&
      data.currentIndex >= 0 &&
      data.currentIndex < (data.items?.length || data.images?.length || 1)
    ) {
      return data.currentIndex;
    }
    return 0;
  });

  useEffect(() => {
    if (data) {
      if (
        typeof data.currentIndex === 'number' &&
        data.currentIndex >= 0 &&
        data.currentIndex < resolvedItems.length
      ) {
        setCurrentIdx(data.currentIndex);
      } else {
        const found = resolvedItems.findIndex((it) => it.imageUrl === data.imageUrl);
        setCurrentIdx(found >= 0 ? found : 0);
      }
      setZoomLevel(1);
    }
  }, [data, resolvedItems]);

  const handleNextPhoto = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (resolvedItems.length <= 1) return;
      setCurrentIdx((prev) => {
        const next = (prev + 1) % resolvedItems.length;
        if (data?.onIndexChange) {
          data.onIndexChange(next);
        }
        return next;
      });
      setZoomLevel(1);
    },
    [resolvedItems.length, data]
  );

  const handlePrevPhoto = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (resolvedItems.length <= 1) return;
      setCurrentIdx((prev) => {
        const next = (prev - 1 + resolvedItems.length) % resolvedItems.length;
        if (data?.onIndexChange) {
          data.onIndexChange(next);
        }
        return next;
      });
      setZoomLevel(1);
    },
    [resolvedItems.length, data]
  );

  const handleSelectPhoto = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (idx < 0 || idx >= resolvedItems.length) return;
    setCurrentIdx(idx);
    setZoomLevel(1);
    if (data?.onIndexChange) {
      data.onIndexChange(idx);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, handleNextPhoto, handlePrevPhoto]);

  if (!isOpen || !data || resolvedItems.length === 0) return null;

  const currentItem = resolvedItems[currentIdx] || resolvedItems[0];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentItem.imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentItem.imageUrl;
    link.download = `campus-photo-${Date.now()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX !== null && e.changedTouches.length === 1) {
      const deltaX = touchStartX - e.changedTouches[0].clientX;
      if (deltaX > 45) {
        handleNextPhoto();
      } else if (deltaX < -45) {
        handlePrevPhoto();
      }
    }
    setTouchStartX(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Top Floating Controls */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-6 flex items-center justify-between z-30 pointer-events-none">
        {/* Left side: Author pill & photo count indicator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {currentItem.author ? (
            <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/60 shadow-xl">
              <img
                src={currentItem.author.avatar}
                alt={currentItem.author.displayName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-pink-500/30"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white leading-tight">
                    {currentItem.author.displayName}
                  </span>
                  {currentItem.author.status === 'VERIFIED' && (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-pink-400">@{currentItem.author.handle}</p>
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Photo Counter Pill (if multiple photos) */}
          {resolvedItems.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-xs font-bold text-slate-200 shadow-xl">
              <ImageIcon className="w-3.5 h-3.5 text-[#C2526A]" />
              <span>
                {currentIdx + 1} / {resolvedItems.length}
              </span>
            </div>
          )}

          {/* Optional Action Button to Select/Use this photo (e.g. for card editing) */}
          {data.onSelectPhoto && (
            <button
              type="button"
              onClick={() => data.onSelectPhoto?.(currentItem.imageUrl)}
              className="px-3.5 py-2 rounded-2xl bg-[#C2526A] hover:bg-[#a93f55] text-white text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{data.selectPhotoLabel || 'Set as Main Photo'}</span>
            </button>
          )}
        </div>

        {/* Right side: Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-700/60 p-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.75}
              title="Zoom Out"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-40"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="px-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5}
              title="Zoom In"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-40"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            title={copied ? 'Image Link Copied!' : 'Copy Image Link'}
            className="p-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all shadow-xl"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Open / Download Image"
            className="p-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all shadow-xl"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="p-2.5 rounded-2xl bg-slate-900/85 hover:bg-rose-600/80 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all shadow-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Next / Previous Buttons */}
      {resolvedItems.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrevPhoto}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white border border-slate-700/70 backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95 group pointer-events-auto"
            aria-label="Previous photo"
            title="Previous photo (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform text-[#F5F1E8]" />
          </button>

          <button
            type="button"
            onClick={handleNextPhoto}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white border border-slate-700/70 backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95 group pointer-events-auto"
            aria-label="Next photo"
            title="Next photo (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform text-[#F5F1E8]" />
          </button>
        </>
      )}

      {/* Main Image Container */}
      <div
        className="w-full h-full flex flex-col items-center justify-center overflow-auto p-4 pt-16 pb-28 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-150 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(currentItem.imageUrl) ? (
            <video
              key={currentItem.imageUrl}
              src={currentItem.imageUrl}
              controls
              autoPlay
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl ring-1 ring-slate-800"
            />
          ) : (
            <img
              key={currentItem.imageUrl}
              src={currentItem.imageUrl}
              alt={currentItem.caption || 'Campus Photo'}
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl ring-1 ring-slate-800 cursor-zoom-in animate-in fade-in duration-150"
              onClick={handleZoomIn}
            />
          )}
        </div>
      </div>

      {/* Bottom Thumbnail Strip & Caption / Reaction Bar */}
      <div className="absolute bottom-4 left-0 right-0 mx-auto max-w-xl w-full px-4 z-30 flex flex-col items-center pointer-events-none">
        {/* Interactive Thumbnail Carousel Strip if multiple photos */}
        {resolvedItems.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-2 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 max-w-full overflow-x-auto select-none pointer-events-auto shadow-2xl">
            {resolvedItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleSelectPhoto(idx, e)}
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                  idx === currentIdx
                    ? 'border-[#C2526A] scale-105 shadow-md shadow-[#C2526A]/40 ring-1 ring-[#C2526A]'
                    : 'border-transparent opacity-50 hover:opacity-90 hover:scale-100'
                }`}
                title={`Change to photo ${idx + 1}`}
              >
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Caption & Reaction Card */}
        <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-3.5 shadow-2xl flex items-center justify-between gap-4 pointer-events-auto">
          <div className="flex-1 min-w-0">
            {currentItem.caption && (
              <p className="text-xs sm:text-sm text-slate-100 font-medium line-clamp-2 leading-relaxed">
                {currentItem.caption}
              </p>
            )}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>{currentItem.createdAt || 'Orbitly'}</span>
              {copied && <span className="text-emerald-400 font-bold">• Link copied!</span>}
            </div>
          </div>

          {/* Reaction & Like button (if enabled) */}
          {currentItem.onLike && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={currentItem.onLike}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                style={{
                  backgroundColor: currentItem.isLiked ? 'var(--cc-accent-muted)' : 'rgb(30 41 59)',
                  borderColor: currentItem.isLiked ? 'var(--cc-accent)' : 'rgb(51 65 85)',
                  color: currentItem.isLiked ? 'var(--cc-accent)' : 'rgb(203 213 225)',
                }}
              >
                <Heart
                  className="w-3.5 h-3.5"
                  style={{
                    fill: currentItem.isLiked ? 'var(--cc-accent)' : 'none',
                    color: currentItem.isLiked ? 'var(--cc-accent)' : 'currentColor',
                  }}
                />
                <span>{currentItem.likesCount ?? 0}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
