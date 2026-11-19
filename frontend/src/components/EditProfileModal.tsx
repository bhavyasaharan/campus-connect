import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  X,
  Image,
  AlertCircle,
  Upload,
  Camera,
  Loader2,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { UserProfile } from '../types';
import { uploadImageApi } from '../services/api';
import { Avatar } from './Avatar';
import { convertHeicToJpeg } from '../utils/heicConverter';
import { useTheme } from '../context/ThemeContext';

interface EditProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  // Table 1 & 2: Account credentials and basic public identity
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [interestInput, setInterestInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    e.target.value = '';
    setUploadingAvatar(true);
    setError(null);
    try {
      const file = await convertHeicToJpeg(rawFile);
      const uploadedUrl = await uploadImageApi(file);
      setAvatar(uploadedUrl);
    } catch (err: any) {
      console.error('Failed to upload avatar', err);
      if (!err.response && typeof URL !== 'undefined') {
        try {
          const file = await convertHeicToJpeg(rawFile);
          const localPreview = URL.createObjectURL(file);
          setAvatar(localPreview);
        } catch {
          const localPreview = URL.createObjectURL(rawFile);
          setAvatar(localPreview);
        }
      } else {
        setError(err.response?.data?.message || 'Failed to upload photo. Please verify image format.');
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddInterest = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const clean = interestInput.trim().replace(/^#/, '');
    if (clean && !interests.includes(clean)) {
      setInterests([...interests, clean]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (tagToRemove: string) => {
    setInterests(interests.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated: UserProfile = {
        ...profile,
        displayName: displayName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim(),
        avatar: avatar.trim() || profile.avatar,
        interests,
      };

      await onSave(updated);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto overscroll-contain no-scrollbar">
      <div
        className="w-full max-w-lg border rounded-3xl p-6 shadow-2xl relative my-6 max-h-[92vh] flex flex-col overscroll-contain animate-in fade-in duration-200"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.primaryText,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl border flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.accent,
              }}
            >
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: theme.primaryText }}>Edit Profile</h2>
              <p className="text-xs" style={{ color: theme.secondaryText }}>Basic identity, bio, and contact credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border transition-colors hover:opacity-80"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.secondaryText,
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form: Basic User & Profile Details Only (no visible scrollbar section, scroll still functional) */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto overscroll-contain flex-1 no-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Photo / Avatar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: theme.secondaryText }}>
                Profile Photo
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ color: theme.accent }}
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload photo</span>
                  </>
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif,.HEIC,.HEIF"
              onChange={handleAvatarFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-4">
              <div
                className="relative flex-shrink-0 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                title="Click to change photo"
              >
                <Avatar
                  src={avatar || profile.avatar}
                  name={displayName || profile.displayName}
                  className="w-16 h-16 rounded-2xl ring-1 shadow-md group-hover:opacity-80 transition-opacity"
                  iconClassName="text-xl"
                  style={{ borderColor: theme.border }}
                />
                <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <input
                  type="url"
                  placeholder="Paste image URL or use upload button"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.primaryText,
                  }}
                />
                <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: theme.secondaryText }}>
                  <Image className="w-3 h-3" style={{ color: theme.accent }} />
                  Direct URL or upload from your device
                </p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: theme.secondaryText }}>
              <User className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              Display Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="e.g. Sophia Chen"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.primaryText,
              }}
            />
          </div>

          {/* Contact Fields: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: theme.secondaryText }}>
                <Mail className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                Email
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.primaryText,
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: theme.secondaryText }}>
                <Phone className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                Mobile / Phone
              </label>
              <input
                type="tel"
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.primaryText,
                }}
              />
            </div>
          </div>

          {/* Profile Bio */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.secondaryText }}>
              Personal Bio
            </label>
            <textarea
              maxLength={500}
              rows={3}
              placeholder="Tell others about yourself, your hobbies, or what you enjoy..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border rounded-xl p-3 text-xs resize-none leading-relaxed focus:outline-none no-scrollbar"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.primaryText,
              }}
            />
          </div>

          {/* Profile Interests & Passions */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.secondaryText }}>
              Profile Passions & Interests
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add interest tag (e.g. Design, Tech, Music)..."
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={handleAddInterest}
                className="flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.primaryText,
                }}
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-4 py-2 text-xs font-medium rounded-xl transition-colors border"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.primaryText,
                }}
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {interests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.primaryText,
                  }}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(tag)}
                    className="hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div
            className="pt-3 border-t flex items-center justify-end gap-3 sticky bottom-0 pb-1"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border font-medium text-xs transition-colors hover:opacity-80"
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
              disabled={saving}
              className="px-5 py-2.5 rounded-xl btn-theme-primary font-semibold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
