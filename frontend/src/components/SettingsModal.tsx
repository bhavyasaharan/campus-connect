import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  ShieldAlert,
  LogOut,
  Instagram,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Grid2x2,
  Palette,
  Check
} from 'lucide-react';
import { UserProfile } from '../types';
import { changePasswordApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from './Avatar';

const PROFILE_LAYOUT_KEY = 'campus-connect-profile-grid-cols';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogout: () => void;
  onEditProfile: () => void;
}

type SettingsTab = 'APPEARANCE' | 'SECURITY' | 'ACCOUNT';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onEditProfile,
}) => {
  const { theme, themeId, setThemeId, themes } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('APPEARANCE');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Preference state for grid columns
  const [preferredCols, setPreferredCols] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_LAYOUT_KEY);
      return saved ? Number(saved) : 3;
    } catch {
      return 3;
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePasswordApi(newPassword.trim(), currentPassword.trim() || undefined, user.id);
      setPasswordSuccess('Password updated successfully! Use your new password on your next login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password. Please check your current password.';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSelectCols = (cols: number) => {
    setPreferredCols(cols);
    try {
      localStorage.setItem(PROFILE_LAYOUT_KEY, String(cols));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain">
      <div
        className="w-full max-w-xl rounded-3xl p-6 shadow-2xl relative animate-in fade-in duration-200 border max-h-[92vh] flex flex-col overscroll-contain"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.primaryText,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b flex-shrink-0" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border"
              style={{
                backgroundColor: theme.accentMuted,
                borderColor: theme.accent,
                color: theme.accent,
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black" style={{ color: theme.primaryText }}>Settings & Appearance</h2>
              <p className="text-xs" style={{ color: theme.secondaryText }}>Themes, security & profile controls</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{
              backgroundColor: theme.card,
              color: theme.secondaryText,
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex p-1 rounded-2xl border mt-4 mb-4 flex-shrink-0"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('APPEARANCE')}
            className="flex-1 min-w-0 py-2 px-1 sm:px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center text-center gap-1 sm:gap-1.5 select-none"
            style={{
              backgroundColor: activeTab === 'APPEARANCE' ? theme.accent : 'transparent',
              color: activeTab === 'APPEARANCE' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
            }}
          >
            <Palette className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate text-center">Themes & Display</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className="flex-1 min-w-0 py-2 px-1 sm:px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center text-center gap-1 sm:gap-1.5 select-none"
            style={{
              backgroundColor: activeTab === 'SECURITY' ? theme.accent : 'transparent',
              color: activeTab === 'SECURITY' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
            }}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate text-center">Password</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACCOUNT')}
            className="flex-1 min-w-0 py-2 px-1 sm:px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center text-center gap-1 sm:gap-1.5 select-none"
            style={{
              backgroundColor: activeTab === 'ACCOUNT' ? theme.accent : 'transparent',
              color: activeTab === 'ACCOUNT' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate text-center">Account</span>
          </button>
        </div>

        {/* Tab Body Container */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* ========================================================================= */}
          {/* TAB 1: APPEARANCE & THEMES                                               */}
          {/* ========================================================================= */}
          {activeTab === 'APPEARANCE' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.secondaryText }}>
                    Choose App & Profile Theme
                  </h3>
                  <span className="text-[11px] font-semibold" style={{ color: theme.accent }}>
                    {theme.name} Active
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: theme.secondaryText }}>
                  Select from 6 bespoke color palettes designed for Orbitly. Themes apply instantly across your profile and all app screens.
                </p>

                {/* 6 Theme Preview Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themes.map((t) => {
                    const isSelected = themeId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setThemeId(t.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-offset-2 scale-[1.01]'
                            : 'opacity-85 hover:opacity-100 hover:scale-[1.01]'
                        }`}
                        style={{
                          backgroundColor: t.surface,
                          borderColor: isSelected ? t.accent : t.border,
                          boxShadow: isSelected ? `0 4px 20px ${t.accentMuted}` : 'none',
                        }}
                      >
                        {/* Title & Active Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-bold leading-tight" style={{ color: t.primaryText }}>
                              {t.name}
                            </h4>
                            <p className="text-[10px] leading-tight line-clamp-1" style={{ color: t.secondaryText }}>
                              {t.description}
                            </p>
                          </div>
                          {isSelected && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shrink-0"
                              style={{
                                backgroundColor: t.accent,
                                color: t.isDark ? '#000000' : '#ffffff',
                              }}
                            >
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>

                        {/* Mini Component Live Sample */}
                        <div
                          className="p-2.5 rounded-xl mb-2.5 flex items-center justify-between gap-2 border"
                          style={{
                            backgroundColor: t.card,
                            borderColor: t.border,
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0"
                              style={{
                                backgroundColor: t.accent,
                                color: t.isDark ? '#000000' : '#ffffff',
                              }}
                            >
                              CC
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold leading-none truncate" style={{ color: t.primaryText }}>
                                @{user.handle}
                              </div>
                              <div className="text-[10px] leading-none mt-1 truncate" style={{ color: t.secondaryText }}>
                                Orbitly
                              </div>
                            </div>
                          </div>
                          <div
                            className="px-2 py-1 rounded-lg text-[10px] font-bold shrink-0"
                            style={{
                              backgroundColor: t.accent,
                              color: t.isDark ? '#000000' : '#ffffff',
                            }}
                          >
                            Button
                          </div>
                        </div>

                        {/* Color Swatch Circles */}
                        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: t.border }}>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.background }} title="Background" />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.surface }} title="Surface" />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.card }} title="Card" />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: t.accent }} title="Accent" />
                          </div>
                          <span className="text-[10px] uppercase font-bold" style={{ color: t.accent }}>
                            {t.isDark ? 'Dark Mode' : 'Light Mode'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Photo Grid Columns Preference */}
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Grid2x2 className="w-4 h-4" style={{ color: theme.accent }} />
                  <span className="text-xs font-bold" style={{ color: theme.primaryText }}>
                    Default Moments & Posts Grid
                  </span>
                </div>
                <p className="text-xs mb-3" style={{ color: theme.secondaryText }}>
                  Preferred columns when viewing photo galleries:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => handleSelectCols(cols)}
                      className="py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: preferredCols === cols ? theme.accent : theme.surface,
                        borderColor: preferredCols === cols ? theme.accent : theme.border,
                        color: preferredCols === cols ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                      }}
                    >
                      <span>{cols} Columns</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PASSWORD & SECURITY                                               */}
          {/* ========================================================================= */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4">
              <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                {passwordSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: theme.secondaryText }}>
                    Current Password (Optional if first time)
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-colors pr-10"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: theme.secondaryText }}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-colors pr-10"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: theme.secondaryText }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-colors"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.primaryText,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.isDark ? '#000000' : '#ffffff',
                  }}
                >
                  {passwordLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ACCOUNT & VERIFICATION                                            */}
          {/* ========================================================================= */}
          {activeTab === 'ACCOUNT' && (
            <div className="space-y-4">
              {/* User Profile Summary */}
              <div
                className="p-4 rounded-2xl border flex items-center justify-between"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.avatar}
                    name={user.displayName}
                    className="w-12 h-12 rounded-2xl border"
                    style={{ borderColor: theme.accent }}
                  />
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: theme.primaryText }}>{user.displayName}</h4>
                    <p className="text-xs flex items-center gap-1 font-semibold" style={{ color: theme.accent }}>
                      <Instagram className="w-3 h-3" />
                      @{user.handle}
                    </p>
                    <p className="text-[11px]" style={{ color: theme.secondaryText }}>{user.major} • {user.year}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditProfile();
                  }}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.primaryText,
                  }}
                >
                  Edit
                </button>
              </div>

              {/* Campus Verification Status */}
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: theme.secondaryText }}>
                  Campus Verification Status
                </span>
                <div className="flex items-center gap-2.5">
                  {user.status === 'VERIFIED' ? (
                    <>
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-emerald-300">Insta Verified</h5>
                        <p className="text-[11px]" style={{ color: theme.secondaryText }}>Instagram verification confirmed.</p>
                      </div>
                    </>
                  ) : user.status === 'GRACE_PERIOD' ? (
                    <>
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-amber-300">Grace Period Active</h5>
                        <p className="text-[11px]" style={{ color: theme.secondaryText }}>Verification check in progress.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-rose-300">Action Required</h5>
                        <p className="text-[11px]" style={{ color: theme.secondaryText }}>Verify your campus account to maintain access.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Safety & Messaging Note */}
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: theme.secondaryText }}>
                  Student Safety Policy
                </span>
                <p className="text-xs leading-relaxed" style={{ color: theme.secondaryText }}>
                  Direct messages remain locked until both students mutually connect. You can pass, block, or report accounts anytime.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Logout Action */}
        <div className="pt-4 mt-3 border-t flex-shrink-0" style={{ borderColor: theme.border }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out of Orbitly</span>
          </button>
        </div>
      </div>
    </div>
  );
};
