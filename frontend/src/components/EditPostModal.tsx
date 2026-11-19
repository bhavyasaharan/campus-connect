import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Film,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Edit3,
  Sliders,
} from 'lucide-react';
import { UserPost, PostMediaItem, UserProfile } from '../types';
import { uploadMediaApi } from '../services/api';
import { Avatar } from './Avatar';
import { ImageEditorModal } from './ImageEditorModal';
import { processMediaFiles } from '../utils/heicConverter';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: UserPost | null;
  currentUser: UserProfile;
  onSave: (postId: string, caption: string, media: PostMediaItem[]) => Promise<void>;
  theme: {
    background: string;
    surface: string;
    card: string;
    border: string;
    primaryText: string;
    secondaryText: string;
    accent: string;
    isDark: boolean;
  };
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
  currentUser,
  onSave,
  theme,
}) => {
  const [caption, setCaption] = useState('');
  const [mediaItems, setMediaItems] = useState<PostMediaItem[]>([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [editingImageItem, setEditingImageItem] = useState<{ url: string; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      setCaption(post.caption || '');
      if (post.media && post.media.length > 0) {
        setMediaItems([...post.media]);
      } else if (post.imageUrl) {
        const isVideo = /\.(mp4|webm|mov|ogg|m4v)$/i.test(post.imageUrl);
        setMediaItems([{ url: post.imageUrl, type: isVideo ? 'VIDEO' : 'IMAGE' }]);
      } else {
        setMediaItems([]);
      }
      setActivePreviewIdx(0);
      setViewMode('edit');
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    const newItems: PostMediaItem[] = [];

    try {
      const files = await processMediaFiles(rawFiles);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await uploadMediaApi(file);
        newItems.push(uploaded);
      }
      setMediaItems((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error('Failed to upload media files:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddCustomUrl = () => {
    if (!customUrl.trim()) return;
    const url = customUrl.trim();
    const isVideo = /\.(mp4|webm|mov|ogg|m4v)$/i.test(url) || url.includes('/video/');
    setMediaItems((prev) => [...prev, { url, type: isVideo ? 'VIDEO' : 'IMAGE' }]);
    setCustomUrl('');
  };

  const handleRemoveMedia = (index: number) => {
    setMediaItems((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (activePreviewIdx >= next.length && next.length > 0) {
        setActivePreviewIdx(next.length - 1);
      }
      return next;
    });
  };

  const handleMoveMedia = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mediaItems.length) return;
    const updated = [...mediaItems];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setMediaItems(updated);
    setActivePreviewIdx(targetIdx);
  };

  const handleOpenImageEditor = (idx: number) => {
    const item = mediaItems[idx];
    if (item && item.type === 'IMAGE') {
      setEditingImageItem({ url: item.url, index: idx });
    }
  };

  const handleApplyImageEdit = async (editedFile: File, editedPreviewUrl: string) => {
    if (!editingImageItem) return;
    const idx = editingImageItem.index;
    setEditingImageItem(null);
    setUploading(true);
    try {
      const uploaded = await uploadMediaApi(editedFile);
      setMediaItems((prev) => {
        const updated = [...prev];
        if (updated[idx]) {
          updated[idx] = uploaded;
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to upload edited image:', err);
      setMediaItems((prev) => {
        const updated = [...prev];
        if (updated[idx]) {
          updated[idx] = { url: editedPreviewUrl, type: 'IMAGE' };
        }
        return updated;
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || mediaItems.length === 0) return;

    setSaving(true);
    try {
      await onSave(post.id, caption.trim(), mediaItems);
      onClose();
    } catch (err) {
      console.error('Failed to update post:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentMedia = mediaItems[activePreviewIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl border shadow-2xl p-5 sm:p-6 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.primaryText,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b mb-4" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight" style={{ color: theme.primaryText }}>
                Edit Profile Post
              </h3>
              <p className="text-[11px]" style={{ color: theme.secondaryText }}>
                Update caption, add or remove photos & videos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Edit / Preview */}
            <div className="flex rounded-xl p-0.5 border" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all"
                style={{
                  backgroundColor: viewMode === 'edit' ? theme.accent : 'transparent',
                  color: viewMode === 'edit' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                style={{
                  backgroundColor: viewMode === 'preview' ? theme.accent : 'transparent',
                  color: viewMode === 'preview' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                }}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: theme.secondaryText }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {viewMode === 'preview' ? (
            /* ================= LIVE POST PREVIEW CARD ================= */
            <div
              className="rounded-2xl border overflow-hidden shadow-xl"
              style={{ backgroundColor: theme.card, borderColor: theme.border }}
            >
              {/* Post Author Header */}
              <div className="p-3 flex items-center justify-between border-b" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={currentUser.avatar}
                    name={currentUser.displayName}
                    className="w-8 h-8 rounded-full border"
                    style={{ borderColor: theme.accent }}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold leading-tight" style={{ color: theme.primaryText }}>
                        {currentUser.displayName}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: theme.accent }}>
                      @{currentUser.handle} • Just now (Edited)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 font-semibold text-slate-400">
                  Preview
                </span>
              </div>

              {/* Media Carousel Preview */}
              {mediaItems.length > 0 ? (
                <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center group">
                  {currentMedia?.type === 'VIDEO' ? (
                    <video
                      key={currentMedia.url}
                      src={currentMedia.url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div
                      onClick={() => handleOpenImageEditor(activePreviewIdx)}
                      className="w-full h-full relative cursor-pointer group/img flex items-center justify-center select-none"
                      title="Click on photo to edit (crop, filters, adjustments)"
                    >
                      <img
                        key={currentMedia?.url}
                        src={currentMedia?.url}
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
                  {currentMedia?.type === 'IMAGE' && (
                    <button
                      type="button"
                      onClick={() => handleOpenImageEditor(activePreviewIdx)}
                      className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 text-[11px] font-bold flex items-center gap-1.5 shadow-xl transition-all active:scale-95"
                      title="Edit Photo (crop & filters)"
                    >
                      <Sliders className="w-3 h-3 text-pink-400" />
                      <span>Edit Photo</span>
                    </button>
                  )}

                  {/* Top-Right Counter Pill */}
                  {mediaItems.length > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                      {activePreviewIdx + 1} / {mediaItems.length}
                    </div>
                  )}

                  {/* Left / Right Carousel Buttons */}
                  {mediaItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActivePreviewIdx((p) => (p > 0 ? p - 1 : mediaItems.length - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePreviewIdx((p) => (p < mediaItems.length - 1 ? p + 1 : 0))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all active:scale-95"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Bottom Dots Indicator */}
                  {mediaItems.length > 1 && (
                    <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                      {mediaItems.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            idx === activePreviewIdx ? 'bg-white scale-125' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center text-xs text-slate-500">
                  No media selected
                </div>
              )}

              {/* Caption Preview */}
              <div className="p-3.5 space-y-1.5">
                <p className="text-xs leading-relaxed" style={{ color: theme.primaryText }}>
                  <span className="font-bold mr-1.5" style={{ color: theme.primaryText }}>
                    {currentUser.handle}
                  </span>
                  {caption || <span className="italic text-slate-500">No caption written yet...</span>}
                </p>
              </div>
            </div>
          ) : (
            /* ================= EDIT MODE FORM ================= */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Caption Input */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: theme.secondaryText }}>
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Update your post caption..."
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

              {/* Multi-Media Management */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.secondaryText }}>
                    Media Carousel ({mediaItems.length} items)
                  </label>
                </div>

                {/* Upload Picker & Custom URL */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.heic,.heif,.HEIC,.HEIF"
                  onChange={handleFilesSelected}
                  className="hidden"
                />

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.accent,
                    }}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{uploading ? 'Uploading Media...' : 'Upload Photos / Videos'}</span>
                  </button>
                </div>

                {/* Add via URL row */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
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
                    onClick={handleAddCustomUrl}
                    disabled={!customUrl.trim()}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Media Items List with Thumbnails & Controls */}
                {mediaItems.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {mediaItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                          idx === activePreviewIdx ? 'ring-1 ring-pink-500' : ''
                        }`}
                        style={{ backgroundColor: theme.card, borderColor: theme.border }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0 flex items-center justify-center">
                            {item.type === 'VIDEO' ? (
                              <video src={item.url} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={item.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
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
                              {item.url}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveMedia(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                            title="Move Earlier"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveMedia(idx, 'right')}
                            disabled={idx === mediaItems.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                            title="Move Later"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(idx)}
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
                    <Plus className="w-6 h-6 text-pink-400" />
                    <span className="text-xs font-semibold">Select at least 1 image or video</span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
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
                  disabled={saving || uploading || mediaItems.length === 0 || !caption.trim()}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs btn-theme-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Image Editor Modal (Crop, Filters, Adjustments) */}
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
