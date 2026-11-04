import React from 'react';
import { Sparkles, HeartHandshake, MessageSquare, Image, ShieldCheck, Clock, ShieldAlert, Wifi, WifiOff, LogOut } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
  user: UserProfile;
  backendOnline: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingRequestsCount,
  unreadMessagesCount,
  user,
  backendOnline,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('discovery')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                CampusConnect
              </h1>
              <span
                className={`hidden lg:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  backendOnline
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title={backendOnline ? 'Spring Boot connected at :8080' : 'Spring Boot not running, using instant mock data'}
              >
                {backendOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-slate-500" />}
                {backendOnline ? 'Backend :8080' : 'Local Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium -mt-1">Verified College Network</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentTab('discovery')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              currentTab === 'discovery'
                ? 'bg-slate-800 text-pink-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Discovery</span>
          </button>

          <button
            onClick={() => setCurrentTab('requests')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 relative ${
              currentTab === 'requests'
                ? 'bg-slate-800 text-pink-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span className="hidden sm:inline">Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('chat')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 relative ${
              currentTab === 'chat'
                ? 'bg-slate-800 text-pink-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
            {unreadMessagesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('moments')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              currentTab === 'moments'
                ? 'bg-slate-800 text-pink-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Moments</span>
          </button>

          <button
            onClick={() => setCurrentTab('admin')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              currentTab === 'admin'
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Admin Sync</span>
          </button>
        </nav>

        {/* Verification Status Pill & Profile */}
        <div className="flex items-center gap-2">
          {user.status === 'VERIFIED' && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Follower</span>
            </div>
          )}
          {user.status === 'GRACE_PERIOD' && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Grace Period</span>
            </div>
          )}
          {user.status === 'RESTRICTED' && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Restricted</span>
            </div>
          )}

          <div
            onClick={() => setCurrentTab('profile')}
            className="w-9 h-9 rounded-full ring-2 ring-pink-500/40 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
            title="My Profile"
          >
            <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Switch Account / Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
