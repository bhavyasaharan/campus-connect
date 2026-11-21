import React, { useState } from 'react';
import { Sparkles, HeartHandshake, MessageSquare, LogOut, Laugh } from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from './Avatar';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
  user: UserProfile;
  backendOnline?: boolean;
  wsConnected?: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingRequestsCount,
  unreadMessagesCount,
  user,
  onLogout,
}) => {
  const { theme } = useTheme();
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = React.useRef(0);

  // Tabs where mobile view already has its own dedicated header or full-screen layout
  const hideMobileHeader = currentTab === 'chat' || currentTab === 'profile' || currentTab === 'requests';

  // Ensure header is visible when tab changes
  React.useEffect(() => {
    setHeaderVisible(true);
    lastScrollY.current = window.scrollY;
  }, [currentTab]);

  // Context-aware auto-hide when scrolling down on mobile
  React.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY <= 15) {
            setHeaderVisible(true);
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 40) {
            // Scrolling down -> hide on mobile
            setHeaderVisible(false);
          } else if (currentScrollY < lastScrollY.current) {
            // Scrolling up -> show
            setHeaderVisible(true);
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Header - Context-Aware and Dynamic on Mobile */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all duration-300 ${
          hideMobileHeader ? 'hidden md:block' : 'block'
        } ${
          headerVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
        }`}
        style={{
          backgroundColor: `${theme.surface}EE`,
          borderColor: theme.border,
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-12 sm:h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none" onClick={() => setCurrentTab('discovery')}>
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 4px 15px ${theme.accentMuted}`,
                color: theme.isDark ? '#000000' : '#ffffff',
              }}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="font-extrabold text-base sm:text-lg tracking-tight transition-colors"
                  style={{ color: theme.primaryText }}
                >
                  Orbitly
                </h1>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setCurrentTab('discovery')}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: currentTab === 'discovery' ? theme.card : 'transparent',
                color: currentTab === 'discovery' ? theme.accent : theme.secondaryText,
                border: currentTab === 'discovery' ? `1px solid ${theme.border}` : '1px solid transparent',
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Discovery</span>
            </button>

            <button
              onClick={() => setCurrentTab('requests')}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 relative"
              style={{
                backgroundColor: currentTab === 'requests' ? theme.card : 'transparent',
                color: currentTab === 'requests' ? theme.accent : theme.secondaryText,
                border: currentTab === 'requests' ? `1px solid ${theme.border}` : '1px solid transparent',
              }}
            >
              <div className="relative flex items-center justify-center">
                {/* Left corner: Unread messages count */}
                {unreadMessagesCount > 0 && (
                  <span
                    className="absolute -top-1.5 -left-2 min-w-[14px] h-[14px] px-0.5 rounded-full text-white text-[8px] font-extrabold flex items-center justify-center shadow-sm ring-1 ring-slate-900"
                    style={{ backgroundColor: '#3b82f6' }}
                    title={`${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''}`}
                  >
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}

                <HeartHandshake className="w-4 h-4" />

                {/* Right corner: Incoming unseen requests count */}
                {pendingRequestsCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full text-white text-[8px] font-extrabold flex items-center justify-center shadow-sm ring-1 ring-slate-900"
                    style={{ backgroundColor: theme.accent }}
                    title={`${pendingRequestsCount} incoming request${pendingRequestsCount > 1 ? 's' : ''}`}
                  >
                    {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                  </span>
                )}
              </div>
              <span>Requests</span>
            </button>

            <button
              onClick={() => setCurrentTab('chat')}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 relative"
              style={{
                backgroundColor: currentTab === 'chat' ? theme.card : 'transparent',
                color: currentTab === 'chat' ? theme.accent : theme.secondaryText,
                border: currentTab === 'chat' ? `1px solid ${theme.border}` : '1px solid transparent',
              }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
              {unreadMessagesCount > 0 && (
                <span
                  className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: theme.accent }}
                >
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('moments')}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: currentTab === 'moments' ? theme.card : 'transparent',
                color: currentTab === 'moments' ? theme.accent : theme.secondaryText,
                border: currentTab === 'moments' ? `1px solid ${theme.border}` : '1px solid transparent',
              }}
              title="Campus Memes & Humor"
            >
              <Laugh className="w-4 h-4" />
              <span>Memes</span>
            </button>
          </nav>

          {/* Profile & Logout (Desktop only on top bar; mobile uses bottom navigation bar & Profile/Settings) */}
          <div className="hidden md:flex items-center gap-2">
            <div
              onClick={() => setCurrentTab('profile')}
              className="w-9 h-9 rounded-full overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-transform border-2"
              style={{
                borderColor: currentTab === 'profile' ? theme.accent : theme.border,
              }}
              title="My Profile"
            >
              <Avatar
                src={user.avatar}
                name={user.displayName}
                className="w-full h-full"
                iconClassName="text-xs"
              />
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl transition-colors hover:text-rose-400 border border-transparent hover:border-slate-800"
              style={{ color: theme.secondaryText }}
              title="Switch Account / Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile devices) */}
      <nav
        className={`${
          currentTab === 'chat' ? 'order-last relative flex-shrink-0' : 'fixed bottom-0 inset-x-0'
        } z-50 md:hidden border-t backdrop-blur-xl transition-colors duration-200 pb-safe`}
        style={{
          backgroundColor: `${theme.surface}F2`,
          borderColor: theme.border,
          boxShadow: `0 -4px 20px rgba(0,0,0,0.25)`,
        }}
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* 1. Discovery */}
          <button
            type="button"
            onClick={() => setCurrentTab('discovery')}
            className="flex flex-col items-center justify-center py-1 transition-all active:scale-90"
            style={{
              color: currentTab === 'discovery' ? theme.accent : theme.secondaryText,
            }}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                currentTab === 'discovery' ? 'scale-110 shadow-sm' : ''
              }`}
              style={{
                backgroundColor: currentTab === 'discovery' ? theme.accentMuted : 'transparent',
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Discover</span>
          </button>

          {/* 2. Requests */}
          <button
            type="button"
            onClick={() => setCurrentTab('requests')}
            className="flex flex-col items-center justify-center py-1 transition-all active:scale-90 relative"
            style={{
              color: currentTab === 'requests' ? theme.accent : theme.secondaryText,
            }}
          >
            <div
              className={`p-1.5 rounded-xl transition-all relative ${
                currentTab === 'requests' ? 'scale-110 shadow-sm' : ''
              }`}
              style={{
                backgroundColor: currentTab === 'requests' ? theme.accentMuted : 'transparent',
              }}
            >
              {/* Left corner: Unread messages count */}
              {unreadMessagesCount > 0 && (
                <span
                  className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[9px] font-extrabold flex items-center justify-center ring-2 shadow-sm"
                  style={{
                    backgroundColor: '#3b82f6',
                    borderColor: theme.surface,
                  }}
                  title={`${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''}`}
                >
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}

              <HeartHandshake className="w-5 h-5" />

              {/* Right corner: Incoming unseen requests count */}
              {pendingRequestsCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[9px] font-extrabold flex items-center justify-center ring-2 shadow-sm"
                  style={{
                    backgroundColor: theme.accent,
                    borderColor: theme.surface,
                  }}
                  title={`${pendingRequestsCount} incoming request${pendingRequestsCount > 1 ? 's' : ''}`}
                >
                  {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Requests</span>
          </button>

          {/* 3. Chat */}
          <button
            type="button"
            onClick={() => setCurrentTab('chat')}
            className="flex flex-col items-center justify-center py-1 transition-all active:scale-90 relative"
            style={{
              color: currentTab === 'chat' ? theme.accent : theme.secondaryText,
            }}
          >
            <div
              className={`p-1.5 rounded-xl transition-all relative ${
                currentTab === 'chat' ? 'scale-110 shadow-sm' : ''
              }`}
              style={{
                backgroundColor: currentTab === 'chat' ? theme.accentMuted : 'transparent',
              }}
            >
              <MessageSquare className="w-5 h-5" />
              {unreadMessagesCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-slate-900"
                  style={{ backgroundColor: theme.accent }}
                >
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Chat</span>
          </button>

          {/* 4. Memes */}
          <button
            type="button"
            onClick={() => setCurrentTab('moments')}
            className="flex flex-col items-center justify-center py-1 transition-all active:scale-90"
            style={{
              color: currentTab === 'moments' ? theme.accent : theme.secondaryText,
            }}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                currentTab === 'moments' ? 'scale-110 shadow-sm' : ''
              }`}
              style={{
                backgroundColor: currentTab === 'moments' ? theme.accentMuted : 'transparent',
              }}
            >
              <Laugh className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Memes</span>
          </button>

          {/* 5. Profile */}
          <button
            type="button"
            onClick={() => setCurrentTab('profile')}
            className="flex flex-col items-center justify-center py-1 transition-all active:scale-90"
            style={{
              color: currentTab === 'profile' ? theme.accent : theme.secondaryText,
            }}
          >
            <div
              className={`w-7 h-7 rounded-full overflow-hidden transition-all border-2 ${
                currentTab === 'profile' ? 'scale-110 ring-2' : ''
              }`}
              style={{
                borderColor: currentTab === 'profile' ? theme.accent : theme.border,
              }}
            >
              <Avatar
                src={user.avatar}
                name={user.displayName}
                className="w-full h-full"
                iconClassName="text-[9px]"
              />
            </div>
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Profile</span>
          </button>
        </div>
      </nav>
    </>
  );
};

