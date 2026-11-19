import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  SlidersHorizontal,
  MapPin,
  GraduationCap,
  Briefcase,
  Heart,
  Globe,
  X,
  Check,
  Loader2,
  Navigation,
  Compass,
} from 'lucide-react';
import { UserProfile, DiscoverCard, DiscoveryFeedFilterParams, Gender, ConnectionIntent } from '../types';
import { DiscoveryCard } from '../components/DiscoveryCard';
import { ExpandedDiscoveryProfileModal } from '../components/ExpandedDiscoveryProfileModal';
import { fetchDiscoveryFeedApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface DiscoveryViewProps {
  cards?: DiscoverCard[];
  profiles?: UserProfile[];
  currentUserId?: string;
  currentUser?: UserProfile;
  onSendRequest: (profile: UserProfile, note?: string) => void;
  onPass: (profile: UserProfile) => void;
  onResetPasses?: () => void;
  onBlock?: (profile: UserProfile) => void;
  onReport?: (profile: UserProfile) => void;
  onViewProfile?: (profile: UserProfile) => void;
  onOpenChatWithConnection?: (connectionId: string) => void;
  onRemoveConnection?: (connectionId: string, user: UserProfile) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  cards: initialCards,
  profiles = [],
  currentUserId,
  currentUser,
  onSendRequest,
  onPass,
  onResetPasses,
  onBlock,
  onReport,
  onViewProfile: _onViewProfile,
  onOpenChatWithConnection,
  onRemoveConnection,
}) => {
  const { theme } = useTheme();
  // Discovery Mode State
  const [activeMode, setActiveMode] = useState<'ALL' | 'CAMPUS' | 'PROFESSIONAL' | 'DATING'>('ALL');
  const [campusStatus, setCampusStatus] = useState<'ALL' | 'STUDENT' | 'PASSOUT'>('ALL');

  // Filter Modal & Criteria State
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [useRadiusFilter, setUseRadiusFilter] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [viewerCoords, setViewerCoords] = useState<{ lat?: number; lng?: number }>({
    lat: currentUser?.latitude,
    lng: currentUser?.longitude,
  });
  const [locating, setLocating] = useState(false);

  const [minAgeFilter, setMinAgeFilter] = useState<number | ''>('');
  const [maxAgeFilter, setMaxAgeFilter] = useState<number | ''>('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [fieldOfStudyFilter, setFieldOfStudyFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [intentFilter, setIntentFilter] = useState<ConnectionIntent | 'ALL'>('ALL');
  const [genderFilter, setGenderFilter] = useState<Gender | 'ALL'>('ALL');

  // Feed State
  const [feedCards, setFeedCards] = useState<DiscoverCard[]>(initialCards || []);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [resettingPasses, setResettingPasses] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [expandedCard, setExpandedCard] = useState<DiscoverCard | null>(null);

  // Active filter count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (locationFilter.trim()) count++;
    if (useRadiusFilter) count++;
    if (minAgeFilter !== '' || maxAgeFilter !== '') count++;
    if (collegeFilter.trim()) count++;
    if (fieldOfStudyFilter.trim()) count++;
    if (organizationFilter.trim()) count++;
    if (intentFilter !== 'ALL') count++;
    if (genderFilter !== 'ALL') count++;
    return count;
  }, [locationFilter, useRadiusFilter, minAgeFilter, maxAgeFilter, collegeFilter, fieldOfStudyFilter, organizationFilter, intentFilter, genderFilter]);

  // Load feed based on active mode and filters
  const loadFeed = useCallback(async () => {
    try {
      setLoadingFeed(true);
      const params: DiscoveryFeedFilterParams = {
        mode: activeMode,
        campusStatus: activeMode === 'CAMPUS' ? campusStatus : undefined,
        college: collegeFilter.trim() || (activeMode === 'CAMPUS' && currentUser?.college ? currentUser.college : undefined),
        fieldOfStudy: fieldOfStudyFilter.trim() || undefined,
        organization: organizationFilter.trim() || undefined,
        location: locationFilter.trim() || undefined,
        radiusKm: useRadiusFilter ? radiusKm : undefined,
        latitude: viewerCoords.lat,
        longitude: viewerCoords.lng,
        minAge: typeof minAgeFilter === 'number' ? minAgeFilter : undefined,
        maxAge: typeof maxAgeFilter === 'number' ? maxAgeFilter : undefined,
        intent: intentFilter !== 'ALL' ? intentFilter : undefined,
        gender: genderFilter !== 'ALL' ? genderFilter : undefined,
      };

      const fetched = await fetchDiscoveryFeedApi(currentUserId, params);
      if (Array.isArray(fetched)) {
        setFeedCards(fetched);
      }
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to load discovery feed:', err);
      // Offline fallback only if backend API call fails completely
      const fallbackList = (initialCards && initialCards.length > 0
        ? [...initialCards]
        : (profiles || []).map((p) => ({
            user: p,
            isDiscoverable: true,
            mainPhotoUrl: p.photos?.[0] || p.avatar,
            discoveryBio: p.bio,
            showCollege: true,
            showCourse: true,
            showInterests: true,
            college: p.college || 'Campus Community',
            course: p.major,
            interests: p.interests,
            age: p.age,
            location: p.location,
            organization: p.organization,
            roleTitle: p.roleTitle,
            fieldOfStudy: p.fieldOfStudy || p.major,
            isPassout: p.isPassout,
            gender: p.gender,
            intent: p.intent,
            personaType: p.personaType,
          }))
      ).filter((c) => {
        if (c.isDiscoverable === false) return false;
        if (minAgeFilter !== '' && c.age != null && c.age < minAgeFilter) return false;
        if (maxAgeFilter !== '' && c.age != null && c.age > maxAgeFilter) return false;
        if (collegeFilter.trim() && !c.college?.toLowerCase().includes(collegeFilter.toLowerCase())) return false;
        if (fieldOfStudyFilter.trim() && !c.fieldOfStudy?.toLowerCase().includes(fieldOfStudyFilter.toLowerCase())) return false;
        if (organizationFilter.trim() && !c.organization?.toLowerCase().includes(organizationFilter.toLowerCase())) return false;
        if (intentFilter !== 'ALL' && c.intent && c.intent !== intentFilter) return false;
        if (genderFilter !== 'ALL' && c.gender && c.gender !== genderFilter) return false;
        return true;
      });

      setFeedCards(fallbackList);
      setCurrentIndex(0);
    } finally {
      setLoadingFeed(false);
    }
  }, [
    currentUserId,
    activeMode,
    campusStatus,
    collegeFilter,
    fieldOfStudyFilter,
    organizationFilter,
    locationFilter,
    useRadiusFilter,
    radiusKm,
    viewerCoords,
    minAgeFilter,
    maxAgeFilter,
    intentFilter,
    genderFilter,
    currentUser?.college,
  ]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setViewerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseRadiusFilter(true);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const activeCard = feedCards[currentIndex];

  const handlePass = () => {
    if (!activeCard || direction !== null) return;
    const targetCard = activeCard;
    setDirection('left');
    onPass(targetCard.user);
    setTimeout(() => {
      setFeedCards((prev) => {
        const next = prev.filter((c) => c.user.id !== targetCard.user.id);
        setCurrentIndex((curr) => (next.length === 0 ? 0 : curr >= next.length ? 0 : curr));
        return next;
      });
      setDirection(null);
    }, 200);
  };

  const handleConnectDirect = () => {
    if (!activeCard || direction !== null) return;
    const targetCard = activeCard;
    setDirection('right');
    onSendRequest(targetCard.user);
    setTimeout(() => {
      setFeedCards((prev) => {
        const next = prev.filter((c) => c.user.id !== targetCard.user.id);
        setCurrentIndex((curr) => (next.length === 0 ? 0 : curr >= next.length ? 0 : curr));
        return next;
      });
      setDirection(null);
    }, 200);
  };

  const handleResetPasses = async () => {
    if (!onResetPasses) return;
    try {
      setResettingPasses(true);
      await onResetPasses();
      await loadFeed();
    } catch (err) {
      console.error('Failed to reset passes:', err);
    } finally {
      setResettingPasses(false);
    }
  };

  const handleCardTap = () => {
    if (!activeCard) return;
    setExpandedCard(activeCard);
  };

  const handleResetFilters = () => {
    setLocationFilter('');
    setUseRadiusFilter(false);
    setRadiusKm(25);
    setMinAgeFilter('');
    setMaxAgeFilter('');
    setCollegeFilter('');
    setFieldOfStudyFilter('');
    setOrganizationFilter('');
    setIntentFilter('ALL');
    setGenderFilter('ALL');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 sm:py-6">
      {/* 1. Mode Switcher & Filter Bar */}
      <div className="mb-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Mode Switcher Tabs */}
          <div
            className="flex items-center p-1 rounded-2xl border overflow-x-auto scrollbar-none flex-1"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveMode('ALL')}
              className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'ALL'
                  ? 'btn-theme-pill-active'
                  : 'hover:opacity-90'
              }`}
              style={{
                color: activeMode === 'ALL' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
              }}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Explore</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('CAMPUS')}
              className={`flex-1 min-w-[80px] py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'CAMPUS'
                  ? 'btn-theme-pill-active'
                  : 'hover:opacity-90'
              }`}
              style={{
                color: activeMode === 'CAMPUS' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
              }}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Campus</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('PROFESSIONAL')}
              className={`flex-1 min-w-[65px] py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'PROFESSIONAL'
                  ? 'btn-theme-pill-active'
                  : 'hover:opacity-90'
              }`}
              style={{
                color: activeMode === 'PROFESSIONAL' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
              }}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('DATING')}
              className={`flex-1 min-w-[65px] py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'DATING'
                  ? 'btn-theme-pill-active'
                  : 'hover:opacity-90'
              }`}
              style={{
                color: activeMode === 'DATING' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
              }}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Dating</span>
            </button>
          </div>

          {/* Filter Modal Button */}
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className="p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 relative hover:scale-105"
            style={{
              backgroundColor: activeFiltersCount > 0 ? theme.accentMuted : theme.card,
              borderColor: activeFiltersCount > 0 ? theme.accent : theme.border,
              color: activeFiltersCount > 0 ? theme.accent : theme.secondaryText,
            }}
            title="Open Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span
                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.isDark ? '#000000' : '#ffffff',
                }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Campus Sub-filter (Student vs Alumni) */}
        {activeMode === 'CAMPUS' && (
          <div
            className="flex items-center gap-2 p-1 border rounded-xl text-xs"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
            }}
          >
            <button
              type="button"
              onClick={() => setCampusStatus('ALL')}
              className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-colors ${
                campusStatus === 'ALL'
                  ? 'btn-theme-pill-active'
                  : 'hover:opacity-90'
              }`}
              style={{
                color: campusStatus === 'ALL' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
              }}
            >
              All Campus
            </button>
            <button
              type="button"
              onClick={() => setCampusStatus('STUDENT')}
              className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-colors ${
                campusStatus === 'STUDENT'
                  ? 'btn-theme-pill-active'
                  : 'hover:opacity-90'
              }`}
              style={{
                color: campusStatus === 'STUDENT' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
              }}
            >
              Current Students
            </button>
            <button
              type="button"
              onClick={() => setCampusStatus('PASSOUT')}
              className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-colors ${
                campusStatus === 'PASSOUT'
                  ? 'btn-theme-pill-active'
                  : 'hover:opacity-90'
              }`}
              style={{
                color: campusStatus === 'PASSOUT' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
              }}
            >
              Alumni / Passout
            </button>
          </div>
        )}
      </div>

      {/* 2. Loading State */}
      {loadingFeed && (
        <div
          className="h-[calc(100dvh-14rem)] min-h-[460px] max-h-[640px] rounded-[28px] border flex flex-col items-center justify-center p-6 text-center space-y-3"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.accent }} />
          <p className="text-xs" style={{ color: theme.secondaryText }}>Finding members...</p>
        </div>
      )}

      {/* 3. Empty State */}
      {!loadingFeed && (!feedCards || feedCards.length === 0) && (
        <div
          className="h-[calc(100dvh-14rem)] min-h-[460px] max-h-[640px] rounded-[28px] border flex flex-col items-center justify-center p-6 text-center space-y-4"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl border flex items-center justify-center"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.accent,
            }}
          >
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: theme.primaryText }}>No Cards in this Category</h3>
            <p className="text-xs max-w-xs mt-1" style={{ color: theme.secondaryText }}>
              Try adjusting your distance radius or criteria filters to see more profiles.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl border text-xs font-medium transition-colors"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.primaryText,
                }}
              >
                Clear Filters
              </button>
            )}
            {onResetPasses && (
              <button
                type="button"
                disabled={resettingPasses}
                onClick={handleResetPasses}
                className="btn-theme-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resettingPasses ? 'animate-spin' : ''}`} />
                <span>{resettingPasses ? 'Resetting...' : 'Reset Passed Cards'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Active Card View */}
      {!loadingFeed && activeCard && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCard.id || activeCard.user.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              x: direction === 'left' ? -250 : direction === 'right' ? 250 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            <DiscoveryCard
              card={activeCard}
              onPass={handlePass}
              onConnect={handleConnectDirect}
              onCardTap={handleCardTap}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* 5. Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden my-auto flex flex-col"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.primaryText,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4" style={{ color: theme.accent }} />
                <h3 className="text-sm font-semibold" style={{ color: theme.primaryText }}>Discovery Filters</h3>
              </div>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="p-1 rounded-lg transition-colors hover:opacity-80"
                style={{ color: theme.secondaryText }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Fields */}
            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              {/* Distance Radius Filter (1 km - 100 km) */}
              <div
                className="p-3.5 rounded-2xl border space-y-2.5"
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: theme.secondaryText }}
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                    Distance Radius
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useRadiusFilter}
                      onChange={(e) => {
                        setUseRadiusFilter(e.target.checked);
                        if (e.target.checked && (!viewerCoords.lat || !viewerCoords.lng)) {
                          handleDetectLocation();
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div
                      className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"
                      style={{
                        backgroundColor: useRadiusFilter ? theme.accent : (theme.isDark ? '#3f3f46' : '#d1d5db'),
                      }}
                    />
                  </label>
                </div>

                {useRadiusFilter && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs" style={{ color: theme.secondaryText }}>
                      <span>Within:</span>
                      <span className="font-semibold" style={{ color: theme.primaryText }}>{radiusKm} km</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      step={1}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                      style={{
                        accentColor: theme.accent,
                        backgroundColor: theme.border,
                      }}
                    />
                    <div className="flex justify-between text-[10px]" style={{ color: theme.secondaryText }}>
                      <span>1 km</span>
                      <span>50 km</span>
                      <span>100 km</span>
                    </div>

                    {(!viewerCoords.lat || !viewerCoords.lng) && (
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={locating}
                        className="text-[11px] flex items-center gap-1 mt-1 font-medium transition-opacity hover:opacity-80"
                        style={{ color: theme.accent }}
                      >
                        {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                        Detect GPS coordinates to calibrate radius
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* City / Location (Fallback string) */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: theme.secondaryText }}>
                  City / Location Name
                </label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="e.g. San Francisco, Ghaziabad, New York..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.primaryText,
                  }}
                />
              </div>

              {/* Age Range Filter */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: theme.secondaryText }}>
                  Age Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] block mb-1" style={{ color: theme.secondaryText }}>Min Age</span>
                    <input
                      type="number"
                      min={18}
                      max={99}
                      value={minAgeFilter}
                      onChange={(e) => setMinAgeFilter(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="18"
                      className="w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] block mb-1" style={{ color: theme.secondaryText }}>Max Age</span>
                    <input
                      type="number"
                      min={18}
                      max={99}
                      value={maxAgeFilter}
                      onChange={(e) => setMaxAgeFilter(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="35"
                      className="w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* College / Campus */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5" style={{ color: theme.secondaryText }}>
                    <GraduationCap className="w-3.5 h-3.5" style={{ color: theme.accent }} /> College / Institution
                  </label>
                  {currentUser?.college && (
                    <button
                      type="button"
                      onClick={() => setCollegeFilter(currentUser.college || '')}
                      className="text-[11px] font-medium transition-opacity hover:opacity-80"
                      style={{ color: theme.accent }}
                    >
                      Use My College
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  placeholder="e.g. AKGEC, Stanford, IIT Delhi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.primaryText,
                  }}
                />
              </div>

              {/* Field of Study / Major */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: theme.secondaryText }}>
                  Field of Study / Major
                </label>
                <input
                  type="text"
                  value={fieldOfStudyFilter}
                  onChange={(e) => setFieldOfStudyFilter(e.target.value)}
                  placeholder="e.g. Computer Science, Product Design..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.primaryText,
                  }}
                />
              </div>

              {/* Organization / Workplace */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: theme.secondaryText }}>
                  <Briefcase className="w-3.5 h-3.5" style={{ color: theme.accent }} /> Workplace / Company
                </label>
                <input
                  type="text"
                  value={organizationFilter}
                  onChange={(e) => setOrganizationFilter(e.target.value)}
                  placeholder="e.g. Google, TCS, Startup..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.primaryText,
                  }}
                />
              </div>

              {/* Intent */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: theme.secondaryText }}>
                  Looking For / Intent
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'DATING', label: 'Dating' },
                    { id: 'NETWORKING', label: 'Professional' },
                    { id: 'FRIENDSHIP', label: 'Friendship' },
                    { id: 'CAMPUS', label: 'Campus Peers' },
                    { id: 'CASUAL', label: 'Casual' },
                  ].map((item) => {
                    const isSelected = intentFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIntentFilter(item.id as ConnectionIntent | 'ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected ? 'btn-theme-pill-active' : ''
                        }`}
                        style={
                          !isSelected
                            ? {
                                backgroundColor: theme.card,
                                borderColor: theme.border,
                                color: theme.secondaryText,
                              }
                            : undefined
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gender Preference */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: theme.secondaryText }}>
                  Gender
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'ALL', label: 'Everyone' },
                    { id: 'FEMALE', label: 'Women' },
                    { id: 'MALE', label: 'Men' },
                    { id: 'NON_BINARY', label: 'Non-binary' },
                  ].map((item) => {
                    const isSelected = genderFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGenderFilter(item.id as Gender | 'ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected ? 'btn-theme-pill-active' : ''
                        }`}
                        style={
                          !isSelected
                            ? {
                                backgroundColor: theme.card,
                                borderColor: theme.border,
                                color: theme.secondaryText,
                              }
                            : undefined
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              className="px-6 py-4 border-t flex items-center justify-between"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: theme.secondaryText }}
              >
                Reset all
              </button>

              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="btn-theme-primary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Expanded Discovery Profile Modal */}
      {expandedCard && (
        <ExpandedDiscoveryProfileModal
          card={expandedCard}
          currentUserId={currentUserId}
          onClose={() => setExpandedCard(null)}
          onConnect={(user, note) => {
            onSendRequest(user, note);
            const targetUserId = user.id;
            setFeedCards((prev) => {
              const next = prev.filter((c) => c.user.id !== targetUserId);
              setCurrentIndex((curr) => (next.length === 0 ? 0 : curr >= next.length ? 0 : curr));
              return next;
            });
            setExpandedCard(null);
          }}
          onOpenChat={onOpenChatWithConnection}
          onBlock={(p) => {
            onBlock?.(p);
            setFeedCards((prev) => prev.filter((c) => c.user.id !== p.id));
            setExpandedCard(null);
          }}
          onReport={onReport}
          onRemoveConnection={onRemoveConnection}
        />
      )}
    </div>
  );
};
