import React, { useState } from 'react';
import {
  Heart,
  X,
  GraduationCap,
  MapPin,
  Briefcase,
  BookOpen,
  ShieldCheck,
  Compass,
  Sparkles,
} from 'lucide-react';
import { DiscoverCard } from '../types';

interface DiscoveryCardProps {
  card: DiscoverCard;
  onPass?: () => void;
  onConnect?: () => void;
  onCardTap?: () => void;
  previewMode?: boolean;
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  card,
  onPass,
  onConnect,
  onCardTap,
  previewMode = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const rawPhoto = card.mainPhotoUrl || card.user.avatar || '';
  const hasValidPhoto = Boolean(rawPhoto && rawPhoto.trim() !== '' && !imgError);

  const isVerified = card.user.status === 'VERIFIED';
  const age = card.age ?? card.user.age;
  const showAge = (card.showAge ?? true) && Boolean(age);
  const location = card.location || card.user.location;
  const showLocation = (card.showLocation ?? true) && Boolean(location);
  const showDistance = (card.showDistance ?? true) && card.distanceKm != null;
  const organization = card.organization || card.user.organization;
  const roleTitle = card.roleTitle || card.user.roleTitle;
  const isPassout = card.isPassout ?? card.user.isPassout ?? false;
  const passoutYear = card.passoutYear;
  const college = card.college || card.user.college;
  const fieldOfStudy = card.fieldOfStudy || card.user.fieldOfStudy || card.course || card.user.major;
  const intent = card.intent || card.user.intent;
  const showIntent = (card.showIntent ?? true) && Boolean(intent && intent !== 'OPEN_TO_ANY');
  const interests = Array.isArray(card.interests)
    ? card.interests
    : (Array.isArray(card.user.interests) ? card.user.interests : []);

  const getInitials = (str?: string) => {
    if (!str) return '';
    const clean = str.replace(/^@/, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Format intent label in an understated, mature style
  const getIntentDisplay = (rawIntent?: string) => {
    switch (rawIntent?.toUpperCase()) {
      case 'DATING':
        return { label: 'Dating', icon: Heart };
      case 'NETWORKING':
        return { label: 'Professional Networking', icon: Briefcase };
      case 'FRIENDSHIP':
        return { label: 'New Connections', icon: Compass };
      case 'CAMPUS_BUDDIES':
      case 'CAMPUS':
        return { label: 'Campus Peers', icon: GraduationCap };
      case 'CASUAL':
        return { label: 'Social & Casual', icon: Compass };
      default:
        return null;
    }
  };

  const intentInfo = showIntent ? getIntentDisplay(intent) : null;

  return (
    <div
      onClick={() => {
        if (!previewMode && onCardTap) {
          onCardTap();
        }
      }}
      className={`relative w-full mx-auto rounded-[28px] overflow-hidden border border-zinc-800 shadow-2xl select-none group transition-all duration-300 bg-zinc-950 ${
        previewMode
          ? 'cursor-default ring-1 ring-zinc-700/80 shadow-zinc-950/80 h-[450px] sm:h-[480px] max-h-[500px] max-w-[320px]'
          : 'cursor-pointer hover:border-zinc-700 hover:shadow-zinc-900/50 h-[calc(100dvh-13rem)] min-h-[470px] max-h-[640px] max-w-sm'
      }`}
    >
      {/* Background: Either valid uploaded photo OR elegant non-photo monogram backdrop */}
      {hasValidPhoto ? (
        <>
          <img
            src={rawPhoto}
            alt={card.user.displayName}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
              previewMode ? '' : 'group-hover:scale-[1.02]'
            }`}
            onError={() => setImgError(true)}
          />
          {/* Elegant Dark Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 via-50% to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-transparent to-transparent h-28 pointer-events-none" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex flex-col items-center justify-start pt-20 sm:pt-24 p-6 select-none">
          {/* Subtle ambient lighting */}
          <div className="absolute -top-20 inset-x-0 h-56 bg-gradient-to-b from-zinc-800/40 via-zinc-900/10 to-transparent pointer-events-none" />

          {/* Refined Monogram / Initial Box */}
          <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-zinc-900/90 border border-zinc-700/80 shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-zinc-200 tracking-wider">
            {getInitials(card.user.displayName || card.user.handle)}
          </div>

          <div className="relative z-10 mt-3 text-center">
            <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
              No photo uploaded
            </span>
          </div>

          {/* Bottom gradient so text remains ultra-clear */}
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Top Header Indicators */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10 pointer-events-none">
        {previewMode ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-zinc-900/90 text-zinc-200 border border-zinc-700/80 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-zinc-400" /> Live Preview
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-950/70 text-zinc-300 border border-zinc-800/80 backdrop-blur-md">
            Tap to view profile
          </span>
        )}

        <div className="flex items-center gap-1.5">
          {intentInfo && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-900/80 text-zinc-200 border border-zinc-700/60 backdrop-blur-md">
              <intentInfo.icon className="w-3 h-3 text-zinc-400" />
              {intentInfo.label}
            </span>
          )}

          {isVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-900/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md" title="Instagram Verified">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Card Content Stack */}
      <div className={`absolute bottom-0 inset-x-0 ${previewMode ? 'p-4 sm:p-5' : 'p-5 sm:p-6'} z-10 flex flex-col justify-end`}>
        {/* Name, Age and Location/Distance */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight leading-tight">
            {card.user.displayName}
            {showAge && <span className="font-normal text-xl sm:text-2xl ml-1 text-zinc-300">, {age}</span>}
          </h2>

          {(showLocation || showDistance) && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 bg-zinc-900/80 px-2.5 py-0.5 rounded-full border border-zinc-700/60 backdrop-blur-sm">
              <MapPin className="w-3 h-3 text-zinc-400" />
              {[
                showLocation ? location : null,
                showDistance ? `${card.distanceKm} km away` : null,
              ]
                .filter(Boolean)
                .join(' • ')}
            </span>
          )}
        </div>

        {/* Handle */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-zinc-400">
            @{card.user.handle}
          </span>
          {card.headline && (
            <span className="text-xs text-zinc-400 truncate max-w-[200px]">
              • {card.headline}
            </span>
          )}
        </div>

        {/* Discovery Bio */}
        {card.discoveryBio && (
          <p className={`text-sm text-zinc-200 font-normal leading-relaxed ${previewMode ? 'line-clamp-2 mb-2' : 'line-clamp-3 mb-3'}`}>
            {card.discoveryBio}
          </p>
        )}

        {/* Professional & Academic Badges */}
        <div className={`flex flex-wrap gap-1.5 ${previewMode ? 'mb-2.5' : 'mb-4'}`}>
          {/* Organization & Role */}
          {((card.showOrganization ?? true) || (card.showRole ?? true)) && (organization || roleTitle) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900/90 text-zinc-200 border border-zinc-800 backdrop-blur-md">
              <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
              <span className="truncate max-w-[180px]">
                {[roleTitle, organization].filter(Boolean).join(' • ')}
              </span>
            </span>
          )}

          {/* College & Academic Status */}
          {(card.showCollege ?? true) && college && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900/90 text-zinc-200 border border-zinc-800 backdrop-blur-md">
              <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
              <span className="truncate max-w-[160px]">
                {college}
                {(card.showPassoutStatus ?? true) && (
                  <span className="text-zinc-400 ml-1">
                    {isPassout
                      ? passoutYear ? `('Alumni ${passoutYear})` : '(Alumni)'
                      : passoutYear ? `('Class ${passoutYear})` : ''}
                  </span>
                )}
              </span>
            </span>
          )}

          {/* Field of Study */}
          {(card.showFieldOfStudy ?? true) && fieldOfStudy && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900/90 text-zinc-200 border border-zinc-800 backdrop-blur-md">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <span className="truncate max-w-[150px]">{fieldOfStudy}</span>
            </span>
          )}

          {/* Interests Tags */}
          {(card.showInterests ?? true) &&
            interests &&
            interests.slice(0, 3).map((item) => (
              <span
                key={item}
                className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-zinc-900/70 text-zinc-300 border border-zinc-800/80 backdrop-blur-md"
              >
                #{item}
              </span>
            ))}
        </div>

        {/* Action Buttons: Pass & Connect */}
        {!previewMode && (
          <div className="flex items-center justify-center gap-6 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onPass) onPass();
              }}
              className="w-13 h-13 p-3.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-95 group/pass"
              title="Pass"
              aria-label="Pass"
            >
              <X className="w-5 h-5 group-hover/pass:text-rose-400 transition-colors" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onConnect) onConnect();
              }}
              className="w-13 h-13 p-3.5 rounded-full btn-theme-primary flex items-center justify-center shadow-lg transition-all active:scale-95 group/conn"
              title="Connect"
              aria-label="Connect"
            >
              <Heart className="w-5 h-5 fill-current group-hover/conn:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
