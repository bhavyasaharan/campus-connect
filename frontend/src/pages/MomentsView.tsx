import React, { useState, useRef, useMemo } from 'react';
import {
  Heart,
  PlusCircle,
  Share2,
  CheckCircle,
  Upload,
  Link,
  X,
  Loader2,
  Laugh,
  Maximize2,
  Flame,
  Tag,
  Trash2
} from 'lucide-react';
import { CampusMeme, UserProfile } from '../types';
import { uploadImageApi } from '../services/api';
import { ImageViewerModal, ImageViewerData } from '../components/ImageViewerModal';
import { Avatar } from '../components/Avatar';
import { convertHeicToJpeg } from '../utils/heicConverter';
import { useTheme } from '../context/ThemeContext';

interface MomentsViewProps {
  memes?: CampusMeme[];
  posts?: CampusMeme[];
  currentUser: UserProfile;
  onLikeMeme?: (memeId: string) => void;
  onAddMeme?: (caption: string, imageUrl: string, category?: string) => void;
  onDeleteMeme?: (memeId: string) => void;
  onLikePost?: (postId: string) => void;
  onAddPost?: (caption: string, imageUrl: string) => void;
  onDeletePost?: (postId: string) => void;
  onViewProfile?: (user: UserProfile) => void;
}

const MEME_TAGS = [
  'All Memes',
  'Exams & Viva',
  'Hostel Life',
  'Professors',
  'Tech & Coding',
  'Placements',
  'Relatable'
];

export const MomentsView: React.FC<MomentsViewProps> = ({
  memes,
  posts,
  currentUser,
  onLikeMeme,
  onAddMeme,
  onDeleteMeme,
  onLikePost,
  onAddPost,
  onViewProfile,
  onDeletePost,
}) => {
  const { theme } = useTheme();
  const memeList = memes || posts || [];
  const handleLike = onLikeMeme || onLikePost || (() => {});
  const handleDelete = onDeleteMeme || onDeletePost;
  const handleAdd = (cap: string, img: string, cat: string) => {
    if (onAddMeme) {
      onAddMeme(cap, img, cat);
    } else if (onAddPost) {
      onAddPost(cap, img);
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All Memes');
  const [selectedViewerData, setSelectedViewerData] = useState<ImageViewerData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    try {
      const file = await convertHeicToJpeg(rawFile);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch {
      setSelectedFile(rawFile);
      setPreviewUrl(URL.createObjectURL(rawFile));
    }
    setImageUrl('');
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAppendTag = (tag: string) => {
    const cleanTag = tag.replace(/[^a-zA-Z0-9]/g, '');
    const hashtag = ` #${cleanTag}`;
    if (!caption.includes(hashtag.trim())) {
      setCaption((prev) => prev.trim() + hashtag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;

    let finalImageUrl = imageUrl.trim();

    if (uploadMode === 'upload' && selectedFile) {
      setUploading(true);
      try {
        finalImageUrl = await uploadImageApi(selectedFile);
      } catch (err: any) {
        console.warn('Image upload failed, using preview URL:', err);
        finalImageUrl = previewUrl || '';
      } finally {
        setUploading(false);
      }
    }

    if (!finalImageUrl) return;

    handleAdd(caption.trim(), finalImageUrl, activeCategory);
    setCaption('');
    setImageUrl('');
    handleClearFile();
    setShowModal(false);
  };

  // Filter memes by tag if selected
  const filteredMemes = useMemo(() => {
    if (activeCategory === 'All Memes') return memeList;
    const filterKey = activeCategory.split(' ')[0].toLowerCase();
    return memeList.filter(
      (p) =>
        (p.category && p.category.toLowerCase().includes(activeCategory.toLowerCase())) ||
        p.caption.toLowerCase().includes(filterKey) ||
        p.caption.toLowerCase().includes(activeCategory.toLowerCase())
    );
  }, [memeList, activeCategory]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Memes Hub Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-black flex items-center gap-2" style={{ color: theme.primaryText }}>
              Campus Memes <Laugh className="w-6 h-6 text-amber-400" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-extrabold flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              Meme Zone (Memes Only)
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: theme.secondaryText }}>
            Exclusive campus memes, inside jokes & student humor. Profile posts belong to student profiles.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto py-2.5 px-4 rounded-2xl btn-theme-primary font-extrabold text-xs flex items-center gap-2 active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Meme 🔥</span>
        </button>
      </div>

      {/* Meme Category Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {MEME_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveCategory(tag)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeCategory === tag
                ? 'btn-theme-pill-active border-transparent'
                : 'hover:opacity-90'
            }`}
            style={{
              backgroundColor: activeCategory === tag ? theme.accent : theme.surface,
              color: activeCategory === tag ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
              borderColor: activeCategory === tag ? theme.accent : theme.border,
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredMemes.length === 0 ? (
        <div
          className="rounded-3xl border p-12 text-center"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 text-amber-400"
            style={{ backgroundColor: theme.card }}
          >
            <Laugh className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold" style={{ color: theme.primaryText }}>
            {activeCategory === 'All Memes' ? 'No campus memes yet' : `No memes in "${activeCategory}" yet`}
          </h4>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: theme.secondaryText }}>
            Be the campus legend who posts the first meme to crack everyone up!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-xl btn-theme-primary font-bold text-xs inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Upload First Meme</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMemes.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl border overflow-hidden shadow-xl transition-all"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: theme.border }}>
                <div
                  className={`flex items-center gap-3 ${onViewProfile ? 'cursor-pointer group' : ''}`}
                  onClick={() => onViewProfile && onViewProfile(post.author)}
                >
                  <Avatar
                    src={post.author.avatar}
                    name={post.author.displayName}
                    className="w-10 h-10 rounded-full ring-2 group-hover:scale-105 transition-all"
                    style={{ borderColor: theme.accent }}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold transition-colors" style={{ color: theme.primaryText }}>
                        {post.author.displayName}
                      </h4>
                      {post.author.status === 'VERIFIED' && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs font-semibold" style={{ color: theme.accent }}>
                      @{post.author.handle} • {post.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {handleDelete &&
                    (String(post.author?.id) === String(currentUser?.id) ||
                      post.author?.handle === currentUser?.handle) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        title="Delete Meme"
                        className="p-2 hover:text-rose-400 rounded-xl transition-colors"
                        style={{ color: theme.secondaryText }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(post.imageUrl);
                      }
                    }}
                    title="Share Meme"
                    className="p-2 rounded-xl transition-colors hover:scale-105"
                    style={{ color: theme.secondaryText }}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meme Visual Media (Click to view full image in lightbox) */}
              <div
                className="w-full overflow-hidden cursor-zoom-in relative group max-h-[500px] flex items-center justify-center border-b"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }}
                onClick={() =>
                  setSelectedViewerData({
                    imageUrl: post.imageUrl,
                    items: filteredMemes.map((m) => ({
                      imageUrl: m.imageUrl,
                      caption: m.caption,
                      author: m.author,
                      createdAt: m.createdAt,
                      likesCount: m.likesCount,
                      isLiked: m.isLiked,
                      onLike: () => handleLike(m.id),
                    })),
                    currentIndex: filteredMemes.findIndex((m) => m.id === post.id),
                    caption: post.caption,
                    author: post.author,
                    createdAt: post.createdAt,
                    likesCount: post.likesCount,
                    isLiked: post.isLiked,
                    onLike: () => handleLike(post.id),
                  })
                }
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-auto max-h-[500px] object-contain group-hover:scale-[1.01] transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span
                    className="backdrop-blur-md text-xs font-bold px-3.5 py-2 rounded-2xl border flex items-center gap-2 shadow-2xl"
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.primaryText,
                    }}
                  >
                    <Maximize2 className="w-4 h-4 text-amber-400" />
                    <span>Click to View Full Image</span>
                  </span>
                </div>
              </div>

              {/* Actions & Caption */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95"
                      style={{
                        backgroundColor: post.isLiked ? 'var(--cc-accent-muted)' : theme.card,
                        borderColor: post.isLiked ? 'var(--cc-accent)' : theme.border,
                        color: post.isLiked ? 'var(--cc-accent)' : theme.secondaryText,
                      }}
                    >
                      <Heart
                        className="w-4 h-4 transition-transform group-hover:scale-110"
                        style={{
                          fill: post.isLiked ? 'var(--cc-accent)' : 'none',
                          color: post.isLiked ? 'var(--cc-accent)' : 'currentColor',
                        }}
                      />
                      <span>{post.likesCount}</span>
                      <span className="text-[11px] opacity-60">React</span>
                    </button>

                    <button
                      onClick={() =>
                        setSelectedViewerData({
                          imageUrl: post.imageUrl,
                          items: filteredMemes.map((m) => ({
                            imageUrl: m.imageUrl,
                            caption: m.caption,
                            author: m.author,
                            createdAt: m.createdAt,
                            likesCount: m.likesCount,
                            isLiked: m.isLiked,
                            onLike: () => handleLike(m.id),
                          })),
                          currentIndex: filteredMemes.findIndex((m) => m.id === post.id),
                          caption: post.caption,
                          author: post.author,
                          createdAt: post.createdAt,
                          likesCount: post.likesCount,
                          isLiked: post.isLiked,
                          onLike: () => handleLike(post.id),
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.secondaryText,
                      }}
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>View</span>
                    </button>
                  </div>
                </div>

                {/* Caption / Punchline */}
                <p className="text-sm leading-relaxed font-medium" style={{ color: theme.primaryText }}>
                  <span className="font-bold mr-1.5" style={{ color: theme.accent }}>@{post.author.handle}</span>
                  {post.caption}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Drop a Meme Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="border rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.primaryText,
            }}
          >
            <button
              onClick={() => {
                setShowModal(false);
                handleClearFile();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full transition-colors"
              style={{ color: theme.secondaryText }}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: theme.primaryText }}>
              Drop a Campus Meme <Laugh className="w-5 h-5 text-amber-400" />
            </h3>
            <p className="text-xs mb-4" style={{ color: theme.secondaryText }}>
              Upload a funny meme image or GIF to make your campus laugh
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Upload Mode Selector */}
              <div
                className="flex rounded-xl p-1 border"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }}
              >
                <button
                  type="button"
                  onClick={() => setUploadMode('upload')}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: uploadMode === 'upload' ? theme.accent : 'transparent',
                    color: uploadMode === 'upload' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Meme</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: uploadMode === 'url' ? theme.accent : 'transparent',
                    color: uploadMode === 'url' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                  }}
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Meme URL</span>
                </button>
              </div>

              {/* Mode 1: File Upload */}
              {uploadMode === 'upload' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: theme.secondaryText }}>
                    Select Meme File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif,.HEIC,.HEIF"
                    onChange={handleFileChange}
                    className="hidden"
                    id="meme-file-input"
                  />

                  {previewUrl ? (
                    <div
                      className="relative aspect-video rounded-2xl overflow-hidden border group"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      }}
                    >
                      <img src={previewUrl} alt="Meme Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] text-white">
                        {selectedFile?.name} ({(selectedFile ? selectedFile.size / 1024 : 0).toFixed(0)} KB)
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="meme-file-input"
                      className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer block transition-colors group"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-2xl text-amber-400 mx-auto flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: theme.surface }}
                      >
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold" style={{ color: theme.primaryText }}>Click to upload meme (or drag & drop)</p>
                      <p className="text-[11px] mt-1" style={{ color: theme.secondaryText }}>PNG, JPG, WebP, GIF, HEIC (up to 25MB)</p>
                    </label>
                  )}
                </div>
              )}

              {/* Mode 2: Web Image Link */}
              {uploadMode === 'url' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: theme.secondaryText }}>
                    Meme Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... meme image link"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors border"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.primaryText,
                    }}
                  />
                  {imageUrl && (
                    <div
                      className="relative aspect-video rounded-xl overflow-hidden border mt-2.5"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      }}
                    >
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* Quick Meme Tag Appender */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5" style={{ color: theme.secondaryText }}>
                  <Tag className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                  Meme Topic Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['#Exams', '#HostelLife', '#Professors', '#Placements', '#Canteen', '#Relatable'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAppendTag(t)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors hover:scale-105"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.secondaryText,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: theme.secondaryText }}>
                  Meme Caption / Punchline
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. When the professor says attendance is optional today... 😂"
                  required
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl p-3 text-xs outline-none resize-none transition-colors border"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.primaryText,
                  }}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    handleClearFile();
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-colors"
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
                  disabled={uploading || (!selectedFile && !imageUrl.trim()) || !caption.trim()}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl btn-theme-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Drop Meme 🔥</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
