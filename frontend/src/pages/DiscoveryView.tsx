import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Send, Sparkles, GraduationCap, BookOpen, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';

interface DiscoveryViewProps {
  profiles: UserProfile[];
  onSendRequest: (profile: UserProfile, note?: string) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ profiles, onSendRequest }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const activeProfile = profiles[currentIndex];

  const handleNext = (dir: 'left' | 'right') => {
    setDirection(dir);
    setPhotoIndex(0);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % profiles.length);
      setDirection(null);
    }, 200);
  };

  const handleSendDirect = () => {
    if (!activeProfile) return;
    onSendRequest(activeProfile);
    handleNext('right');
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    onSendRequest(activeProfile, noteText);
    setNoteText('');
    setShowNoteModal(false);
    handleNext('right');
  };

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-indigo-400">
          <Sparkles className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">You've explored everyone for now!</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Check back later as more students register and verify their accounts.
        </p>
      </div>
    );
  }

  const currentPhoto = activeProfile.photos[photoIndex] || activeProfile.photos[0];

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Campus Spotlight <Sparkles className="w-4 h-4 text-pink-400" />
          </h2>
          <p className="text-xs text-slate-400">Connect with classmates across departments</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {currentIndex + 1} of {profiles.length}
        </span>
      </div>

      {/* Main Profile Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeProfile.id}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: direction === 'left' ? -120 : direction === 'right' ? 120 : 0,
            y: 0,
          }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.25 }}
          className="relative bg-slate-800/90 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl shadow-black/40"
        >
          {/* Photo Container */}
          <div className="relative h-96 w-full bg-slate-900">
            <img
              src={currentPhoto}
              alt={activeProfile.displayName}
              className="w-full h-full object-cover select-none"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

            {/* Photo Indicators */}
            {activeProfile.photos.length > 1 && (
              <div className="absolute top-3 inset-x-4 flex gap-1 z-10">
                {activeProfile.photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      idx === photoIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tap left/right buttons for photos */}
            {activeProfile.photos.length > 1 && (
              <div className="absolute inset-y-0 inset-x-0 flex justify-between items-center px-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : activeProfile.photos.length - 1));
                  }}
                  className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex((prev) => (prev < activeProfile.photos.length - 1 ? prev + 1 : 0));
                  }}
                  className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Overlay Profile Header */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {activeProfile.displayName}
                </h3>
                {activeProfile.status === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Verified
                  </span>
                )}
              </div>

              <div className="text-xs font-semibold text-pink-300/90 mb-2">
                @{activeProfile.handle}
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/50">
                  <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                  {activeProfile.major}
                </span>
                <span className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/50">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  {activeProfile.year}
                </span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">About Me</h4>
              <p className="text-sm text-slate-200 leading-relaxed">{activeProfile.bio}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Interests & Hobbies</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeProfile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-slate-700/60 text-slate-200 border border-slate-600/50"
                  >
                    #{interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {/* Pass / Skip */}
              <button
                type="button"
                onClick={() => handleNext('left')}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 border border-slate-600 transition-all active:scale-95"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>Pass</span>
              </button>

              {/* Add Note & Send */}
              <button
                type="button"
                onClick={() => setShowNoteModal(true)}
                className="py-3 px-3.5 rounded-2xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all active:scale-95"
                title="Add a message note"
              >
                <Send className="w-4 h-4 text-pink-300" />
              </button>

              {/* Send Connect Request */}
              <button
                type="button"
                onClick={handleSendDirect}
                className="flex-[1.4] py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 transition-all active:scale-95"
              >
                <Heart className="w-4 h-4 fill-white text-white" />
                <span>Connect Request</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h4 className="text-base font-bold text-white mb-1">Add a Connect Note</h4>
            <p className="text-xs text-slate-400 mb-3">
              Send a short note to @{activeProfile.handle} with your connect request.
            </p>
            <form onSubmit={handleSubmitNote}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Loved your project at the engineering showcase! Let's connect..."
                maxLength={180}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
              <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                <span>Friendly campus etiquette</span>
                <span>{noteText.length}/180</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-pink-600 hover:bg-pink-500 text-white"
                >
                  Send with Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
