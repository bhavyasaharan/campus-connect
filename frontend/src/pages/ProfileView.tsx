import React from 'react';
import { ShieldCheck, Clock, ShieldAlert, BookOpen, GraduationCap, Instagram } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  user: UserProfile;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl text-center">
        <div className="relative inline-block mb-4">
          <img
            src={user.avatar}
            alt={user.displayName}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-pink-500/30 mx-auto shadow-lg"
          />
          {user.status === 'VERIFIED' && (
            <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-slate-900 shadow">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-black text-white">{user.displayName}</h2>
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-400 mt-0.5">
          <Instagram className="w-4 h-4" />
          <span>@{user.handle}</span>
        </div>

        {/* Verification Status Alert */}
        <div className="mt-5 p-4 rounded-2xl border text-left flex items-start gap-3 bg-slate-800/60 border-slate-700">
          {user.status === 'VERIFIED' ? (
            <>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Account Verified Active</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Your social handle is confirmed in the designated follower list. You have full access to Discovery, Requests, and Chat.
                </p>
              </div>
            </>
          ) : user.status === 'GRACE_PERIOD' ? (
            <>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 flex-shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-300">Grace Period Active (18 Hours Left)</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Welcome to campus! You can browse and connect while our automated scheduler reconciles your social follow in the next sync batch.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-300">Follower Verification Required</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Your handle @{user.handle} was not found on the required social page. Please follow the official college account to maintain access.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Profile Info Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-left">
          <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Department
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <BookOpen className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <span className="truncate">{user.major}</span>
            </div>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Class Year
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <GraduationCap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="truncate">{user.year}</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-850 border border-slate-800 text-left">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Bio
          </span>
          <p className="text-xs text-slate-200 leading-relaxed">{user.bio}</p>
        </div>

        {/* Interests */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-850 border border-slate-800 text-left">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Interests
          </span>
          <div className="flex flex-wrap gap-1.5">
            {user.interests.map((interest) => (
              <span
                key={interest}
                className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
              >
                #{interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
