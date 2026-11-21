import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  Sliders,
  GraduationCap,
  Briefcase,
  MapPin,
  FileText,
  Shield,
  Navigation,
  BookOpen,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';
import { UserProfile, DiscoverCard, UpdateDiscoverCardPayload, College, Company, FieldOfStudy, Gender, ConnectionIntent } from '../types';
import {
  fetchMyDiscoverCardApi,
  updateMyDiscoverCardApi,
  fetchUserPostsApi,
  searchCollegesApi,
  createCollegeApi,
  searchCompaniesApi,
  createCompanyApi,
  searchFieldsOfStudyApi,
  createFieldOfStudyApi,
} from '../services/api';
import { DiscoveryCard } from './DiscoveryCard';
import { CatalogAutocomplete, CatalogItem } from './CatalogAutocomplete';
import { useTheme } from '../context/ThemeContext';

interface EditDiscoverCardModalProps {
  user: UserProfile;
  onClose: () => void;
  onSaved?: (updatedCard: DiscoverCard) => void;
}

export const EditDiscoverCardModal: React.FC<EditDiscoverCardModalProps> = ({
  user,
  onClose,
  onSaved,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab for responsive layout (Editor vs Visibility vs Live Preview)
  const [activeTab, setActiveTab] = useState<'details' | 'visibility' | 'preview'>('details');

  // --- Master Parent Check ---
  const [isDiscoverable, setIsDiscoverable] = useState<boolean>(true);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // --- Real Card Details ---
  const [collegeId, setCollegeId] = useState<number | undefined>(undefined);
  const [college, setCollege] = useState<string>('');
  const [isPassout, setIsPassout] = useState<boolean>(Boolean(user.isPassout));
  const [passoutYear, setPassoutYear] = useState<number | ''>('');

  const [companyId, setCompanyId] = useState<number | undefined>(undefined);
  const [organization, setOrganization] = useState<string>('');
  const [roleTitle, setRoleTitle] = useState<string>('');

  const [fieldOfStudyId, setFieldOfStudyId] = useState<number | undefined>(undefined);
  const [fieldOfStudy, setFieldOfStudy] = useState<string>('');

  const [age, setAge] = useState<number | ''>(user.age ?? '');
  const [birthdate, setBirthdate] = useState<string>(user.birthdate || '');
  const [gender, setGender] = useState<Gender>(user.gender || 'PREFER_NOT_TO_SAY');
  const [intent, setIntent] = useState<ConnectionIntent>(user.intent || 'OPEN_TO_ANY');

  // Location & Coordinates for Geospatial radius
  const [location, setLocation] = useState<string>(user.location || '');
  const [latitude, setLatitude] = useState<number | undefined>(user.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(user.longitude);

  const [availablePhotos, setAvailablePhotos] = useState<string[]>([]);
  const [allowedMediaUrls, setAllowedMediaUrls] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [discoveryBio, setDiscoveryBio] = useState<string>('');
  const [cardInterests, setCardInterests] = useState<string[]>(Array.isArray(user.interests) ? user.interests : []);
  const [interestInput, setInterestInput] = useState<string>('');

  // --- Visibility Checks ---
  const [showAge, setShowAge] = useState<boolean>(true);
  const [showLocation, setShowLocation] = useState<boolean>(true);
  const [showDistance, setShowDistance] = useState<boolean>(true);
  const [showCollege, setShowCollege] = useState<boolean>(true);
  const [showPassoutStatus, setShowPassoutStatus] = useState<boolean>(true);
  const [showFieldOfStudy, setShowFieldOfStudy] = useState<boolean>(true);
  const [showOrganization, setShowOrganization] = useState<boolean>(true);
  const [showRole, setShowRole] = useState<boolean>(true);
  const [showIntent, setShowIntent] = useState<boolean>(true);
  const [showInterests, setShowInterests] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadCard = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const [card, userPosts] = await Promise.all([
          fetchMyDiscoverCardApi(user.id),
          fetchUserPostsApi(user.id).catch(() => []),
        ]);
        if (isMounted) {
          // Extract all image URLs from user's published profile posts
          const postImages: string[] = [];
          if (Array.isArray(userPosts)) {
            userPosts.forEach((post) => {
              if (Array.isArray(post.media) && post.media.length > 0) {
                post.media.forEach((m) => {
                  if (m.url && m.type !== 'VIDEO') {
                    postImages.push(m.url);
                  }
                });
              } else if (post.imageUrl && !/\.(mp4|webm|mov|ogg|m4v)$/i.test(post.imageUrl)) {
                postImages.push(post.imageUrl);
              }
            });
          }

          // Combine photos from user posts, backend availablePhotos, and avatar fallback
          const combinedPhotos = [
            ...postImages,
            ...(card.availablePhotos || []),
            user.avatar,
            ...(user.photos || []),
          ].filter(
            (v, i, a): v is string =>
              Boolean(v && v.trim()) &&
              a.indexOf(v) === i &&
              !/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(v)
          );

          setAvailablePhotos(combinedPhotos);

          // Allowed media on Discover card
          if (card.allowedMediaUrls && card.allowedMediaUrls.length > 0) {
            const validSaved = card.allowedMediaUrls.filter((u) => combinedPhotos.includes(u));
            setAllowedMediaUrls(validSaved.length > 0 ? validSaved : combinedPhotos);
          } else {
            // Default to all post photos allowed until customized
            setAllowedMediaUrls(combinedPhotos);
          }

          setSelectedPhoto(card.mainPhotoUrl || combinedPhotos[0] || user.avatar || '');
          setDiscoveryBio(card.discoveryBio || '');

          setIsDiscoverable(card.isDiscoverable ?? true);
          setCollegeId(card.collegeId);
          setCollege(card.college || user.college || '');
          setIsPassout(Boolean(card.isPassout ?? (card as any).passout ?? user.isPassout));
          setPassoutYear(card.passoutYear ?? '');

          setCompanyId(card.companyId);
          setOrganization(card.organization || user.organization || '');
          setRoleTitle(card.roleTitle || user.roleTitle || '');

          setFieldOfStudyId(card.fieldOfStudyId);
          setFieldOfStudy(card.fieldOfStudy || user.fieldOfStudy || user.major || '');

          setAge(card.age ?? user.age ?? '');
          setBirthdate(card.birthdate ?? user.birthdate ?? '');
          setGender(card.gender || user.gender || 'PREFER_NOT_TO_SAY');
          setIntent(card.intent || user.intent || 'OPEN_TO_ANY');

          setLocation(card.location || user.location || '');
          setLatitude(card.latitude ?? user.latitude);
          setLongitude(card.longitude ?? user.longitude);

          setShowAge(card.showAge ?? true);
          setShowLocation(card.showLocation ?? true);
          setShowDistance(card.showDistance ?? true);
          setShowCollege(card.showCollege ?? true);
          setShowPassoutStatus(card.showPassoutStatus ?? true);
          setShowFieldOfStudy(card.showFieldOfStudy ?? true);
          setShowOrganization(card.showOrganization ?? true);
          setShowRole(card.showRole ?? true);
          setShowIntent(card.showIntent ?? true);
          setShowInterests(card.showInterests ?? true);

          if (Array.isArray(card.interests)) {
            setCardInterests(card.interests);
          }
        }
      } catch (err: any) {
        console.error('Failed to load discover card', err);
        if (isMounted) {
          setErrorMsg('Failed to load current card details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadCard();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleToggleAllowedMedia = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAllowedMediaUrls((prev) => {
      const isCurrentlyAllowed = prev.includes(url);
      if (isCurrentlyAllowed) {
        const next = prev.filter((u) => u !== url);
        if (selectedPhoto === url) {
          const fallbackCover = next[0] || (user.avatar && !/\.(mp4|webm|mov|ogg|m4v)$/i.test(user.avatar) ? user.avatar : '');
          setSelectedPhoto(fallbackCover);
        }
        return next;
      } else {
        return [...prev, url];
      }
    });
  };

  const handleSelectCoverPhoto = (url: string) => {
    setSelectedPhoto(url);
    setAllowedMediaUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  const handleSelectAllMedia = () => {
    setAllowedMediaUrls([...availablePhotos]);
  };

  const handleDeselectAllMedia = () => {
    if (selectedPhoto) {
      setAllowedMediaUrls([selectedPhoto]);
    } else if (availablePhotos.length > 0) {
      setAllowedMediaUrls([availablePhotos[0]]);
    }
  };

  // HTML5 Geolocation Detector
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Attempt reverse geocode via free OSM Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.county ||
            data.address?.state ||
            'Nearby';
          const state = data.address?.state ? `, ${data.address.state}` : '';
          setLocation(`${city}${state}`);
        } catch {
          if (!location) setLocation(`GPS (${lat.toFixed(2)}, ${lng.toFixed(2)})`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.error('Location error', err);
        setErrorMsg('Unable to retrieve your location. Please check browser permissions.');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Catalog search handlers
  const handleSearchColleges = async (q: string): Promise<CatalogItem[]> => {
    const list: College[] = await searchCollegesApi(q);
    return list.map((c) => ({
      id: c.id,
      name: c.name,
      subtitle: [c.city, c.state, c.country].filter(Boolean).join(', '),
      isVerified: c.isVerified,
    }));
  };

  const handleAddCustomCollege = async (name: string): Promise<CatalogItem> => {
    const created: College = await createCollegeApi({ name });
    return {
      id: created.id,
      name: created.name,
      subtitle: 'Recently added',
      isVerified: false,
    };
  };

  const handleSearchCompanies = async (q: string): Promise<CatalogItem[]> => {
    const list: Company[] = await searchCompaniesApi(q);
    return list.map((c) => ({
      id: c.id,
      name: c.name,
      subtitle: c.industry || c.domain,
      isVerified: c.isVerified,
    }));
  };

  const handleAddCustomCompany = async (name: string): Promise<CatalogItem> => {
    const created: Company = await createCompanyApi({ name });
    return {
      id: created.id,
      name: created.name,
      subtitle: 'Recently added',
      isVerified: false,
    };
  };

  const handleSearchFieldsOfStudy = async (q: string): Promise<CatalogItem[]> => {
    const list: FieldOfStudy[] = await searchFieldsOfStudyApi(q);
    return list.map((f) => ({
      id: f.id,
      name: f.name,
      subtitle: f.category,
      isVerified: f.isVerified,
    }));
  };

  const handleAddCustomFieldOfStudy = async (name: string): Promise<CatalogItem> => {
    const created: FieldOfStudy = await createFieldOfStudyApi({ name });
    return {
      id: created.id,
      name: created.name,
      subtitle: 'Recently added',
      isVerified: false,
    };
  };

  // Add card interest tag
  const handleAddInterest = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const clean = interestInput.trim().replace(/^#/, '');
    if (clean && !cardInterests.includes(clean)) {
      setCardInterests([...cardInterests, clean]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (tag: string) => {
    setCardInterests(cardInterests.filter((t) => t !== tag));
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload: UpdateDiscoverCardPayload = {
        isDiscoverable,
        mainPhotoUrl: selectedPhoto,
        allowedMediaUrls: allowedMediaUrls.length > 0 ? allowedMediaUrls : (selectedPhoto ? [selectedPhoto] : undefined),
        discoveryBio: discoveryBio.trim(),
        collegeId,
        college: college.trim() || undefined,
        isPassout,
        passoutYear: typeof passoutYear === 'number' ? passoutYear : undefined,
        companyId,
        organization: organization.trim() || undefined,
        roleTitle: roleTitle.trim() || undefined,
        fieldOfStudyId,
        fieldOfStudy: fieldOfStudy.trim() || undefined,
        location: location.trim() || undefined,
        latitude,
        longitude,
        age: typeof age === 'number' ? age : undefined,
        birthdate: birthdate || undefined,
        gender,
        intent,
        interests: cardInterests,

        showAge,
        showLocation,
        showDistance,
        showCollege,
        showPassoutStatus,
        showFieldOfStudy,
        showOrganization,
        showRole,
        showIntent,
        showInterests,
      };

      const updatedCard = await updateMyDiscoverCardApi(payload, user.id);
      setSuccessMsg('Card saved successfully!');
      if (onSaved) onSaved(updatedCard);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to update card', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Unable to update card.');
    } finally {
      setSaving(false);
    }
  };

  // Reconstruct card representation for Live Real-Time Preview
  const previewCard: DiscoverCard = {
    user: {
      ...user,
      displayName: user.displayName,
      handle: user.handle,
      avatar: selectedPhoto || user.avatar,
      status: user.status,
    },
    isDiscoverable,
    mainPhotoUrl: selectedPhoto || user.avatar,
    allowedMediaUrls,
    discoveryBio,
    collegeId,
    college: college || 'University / Institution',
    isPassout,
    passoutYear: typeof passoutYear === 'number' ? passoutYear : undefined,
    companyId,
    organization: organization || undefined,
    roleTitle: roleTitle || undefined,
    fieldOfStudyId,
    fieldOfStudy: fieldOfStudy || undefined,
    age: typeof age === 'number' ? age : undefined,
    gender,
    intent,
    location: location || undefined,
    latitude,
    longitude,
    interests: cardInterests,
    showAge,
    showLocation,
    showDistance,
    showCollege,
    showPassoutStatus,
    showCourse: showFieldOfStudy,
    showFieldOfStudy,
    showOrganization,
    showRole,
    showIntent,
    showInterests,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto overscroll-contain no-scrollbar">
      <div
        className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] overscroll-contain animate-in fade-in duration-200 border"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.primaryText,
        }}
      >
        {/* Header */}
        <div
          className="px-4 sm:px-6 py-3.5 sm:py-4 border-b"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          {/* Mobile Header: Strictly 1 line title, 1 line subtitle, controls row below */}
          <div className="block md:hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm flex-shrink-0"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.accent,
                }}
              >
                <Sliders className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold truncate whitespace-nowrap" style={{ color: theme.primaryText }}>
                Edit Discover Card
              </h2>
            </div>
            <p className="text-xs truncate whitespace-nowrap mt-1" style={{ color: theme.secondaryText }}>
              Card details • Catalog links • Visibility toggles • Preview
            </p>

            {/* Mobile Controls Row: Toggle Preview & Cross with visible distinct theme */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t" style={{ borderColor: theme.border }}>
              <div
                className="flex items-center p-1 rounded-xl border shadow-inner gap-1"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                  style={{
                    backgroundColor: activeTab === 'details' ? theme.accent : 'transparent',
                    color: activeTab === 'details' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                  }}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('visibility')}
                  className="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                  style={{
                    backgroundColor: activeTab === 'visibility' ? theme.accent : 'transparent',
                    color: activeTab === 'visibility' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                  }}
                >
                  Visibility
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                  style={{
                    backgroundColor: activeTab === 'preview' ? theme.accent : 'transparent',
                    color: activeTab === 'preview' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  Preview
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl border shadow-sm transition-all"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.secondaryText,
                }}
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl border flex items-center justify-center shadow-sm"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.accent,
                }}
              >
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: theme.primaryText }}>Edit Discover Card</h2>
                <p className="text-xs" style={{ color: theme.secondaryText }}>Card details, catalog links, visibility toggles & live preview</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border transition-colors shadow-sm"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.secondaryText,
              }}
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master Discoverability Banner */}
        <div
          className={`px-6 py-3.5 border-b flex items-center justify-between transition-all ${
            isDiscoverable
              ? 'bg-emerald-950/25'
              : 'bg-amber-950/25'
          }`}
          style={{
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
              isDiscoverable
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: theme.primaryText }}>
                  {isDiscoverable ? 'Visible in Discovery Deck' : 'Private / Incognito Mode'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isDiscoverable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              </div>
              <div className="text-[11px]" style={{ color: theme.secondaryText }}>
                {isDiscoverable
                  ? 'Your card is active and can be discovered by peers on campus.'
                  : 'Your card is hidden from discovery feeds. Sub-toggles are bypassed.'}
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDiscoverable}
              onChange={(e) => setIsDiscoverable(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6.5 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
          </label>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Body: Two Columns (Editor on left, Live Preview on right) */}
        <div
          className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x"
          style={{ borderColor: theme.border }}
        >
          {/* LEFT: Editor Panes (Details & Visibility) */}
          <div
            className={`md:col-span-7 flex flex-col overflow-y-auto no-scrollbar p-6 space-y-6 ${
              activeTab === 'preview' ? 'hidden md:flex' : 'flex'
            }`}
            style={{ backgroundColor: theme.surface }}
          >
            {/* Desktop Sub-Nav: Details vs Visibility */}
            <div className="hidden md:flex items-center gap-2 border-b pb-3" style={{ borderColor: theme.border }}>
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all"
                style={{
                  backgroundColor: activeTab !== 'visibility' ? theme.accent : theme.card,
                  color: activeTab !== 'visibility' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                  borderColor: activeTab !== 'visibility' ? theme.accent : theme.border,
                }}
              >
                Card Details & Catalogs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('visibility')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all"
                style={{
                  backgroundColor: activeTab === 'visibility' ? theme.accent : theme.card,
                  color: activeTab === 'visibility' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                  borderColor: activeTab === 'visibility' ? theme.accent : theme.border,
                }}
              >
                Visibility Toggles (What to Show)
              </button>
            </div>

            {loading ? (
              <div className="py-16 flex items-center justify-center gap-2 text-xs" style={{ color: theme.secondaryText }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading your card...</span>
              </div>
            ) : activeTab !== 'visibility' ? (
              /* TAB 1: CARD DETAILS & CATALOGS */
              <div className="space-y-5">
                {/* Photo Selector - Posted Images & Allowed Media Filter */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-2.5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: theme.primaryText }}>
                        Discover Deck Media & Cover Photo
                      </label>
                      <p className="text-[11px]" style={{ color: theme.secondaryText }}>
                        Select which photos from your posts are allowed on your Discover card, and pick your primary cover.
                      </p>
                    </div>

                    {availablePhotos.length > 0 && (
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={handleSelectAllMedia}
                          className="text-[10px] underline font-medium transition-colors"
                          style={{ color: theme.accent }}
                        >
                          Allow all
                        </button>
                        <span className="text-[10px] opacity-40">|</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllMedia}
                          className="text-[10px] underline font-medium transition-colors"
                          style={{ color: theme.accent }}
                        >
                          Only cover
                        </button>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            color: theme.secondaryText,
                          }}
                        >
                          {allowedMediaUrls.length}/{availablePhotos.length} allowed
                        </span>
                      </div>
                    )}
                  </div>

                  {availablePhotos.length === 0 ? (
                    <div
                      className="p-4 rounded-2xl border text-center space-y-1.5"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      }}
                    >
                      <p className="text-xs font-medium" style={{ color: theme.primaryText }}>No posted photos yet</p>
                      <p className="text-[11px]" style={{ color: theme.secondaryText }}>
                        Publish a photo post on your profile to select it as your discovery card cover image.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {availablePhotos.map((p) => {
                        const isAllowed = allowedMediaUrls.includes(p);
                        const isCover = selectedPhoto === p;

                        return (
                          <div
                            key={p}
                            onClick={() => handleSelectCoverPhoto(p)}
                            className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border transition-all ${
                              isCover
                                ? 'ring-2 shadow-lg scale-[1.02]'
                                : isAllowed
                                ? 'opacity-90 hover:opacity-100'
                                : 'opacity-40 hover:opacity-75 grayscale'
                            }`}
                            style={{
                              borderColor: isCover ? theme.accent : theme.border,
                            }}
                          >
                            <img src={p} alt="Posted photo" className="w-full h-full object-cover" />

                            {/* Toggle Allowed / Disallowed Button */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleAllowedMedia(p, e)}
                              title={isAllowed ? 'Allowed on Discover (Click to hide)' : 'Hidden from Discover (Click to allow)'}
                              className={`absolute top-1.5 left-1.5 p-1 rounded-lg backdrop-blur-md transition-all z-10 ${
                                isAllowed
                                  ? 'bg-emerald-600/90 text-white hover:bg-emerald-500'
                                  : 'bg-black/60 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {isAllowed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>

                            {/* Cover Badge */}
                            {isCover ? (
                              <div
                                className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 shadow-md z-10"
                                style={{
                                  backgroundColor: theme.card,
                                  borderColor: theme.border,
                                  color: theme.primaryText,
                                }}
                              >
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                <span>Cover</span>
                              </div>
                            ) : (
                              <div className="absolute bottom-1.5 inset-x-1.5 text-center py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                Set as Cover
                              </div>
                            )}

                            {/* Status label if excluded */}
                            {!isAllowed && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-medium text-zinc-300 bg-black/75 px-2 py-0.5 rounded-full border border-white/20">
                                  Excluded
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-[11px] mt-2" style={{ color: theme.secondaryText }}>
                    💡 Click any photo to select it as your <strong>Deck Cover</strong>. Click the eye icon <Eye className="w-3 h-3 inline text-emerald-400 mx-0.5" /> on each image to allow or exclude it from your Discover Card gallery.
                  </p>
                </div>

                {/* Discovery Deck Bio / Pitch */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: theme.secondaryText }}>
                    <FileText className="w-3.5 h-3.5" style={{ color: theme.secondaryText }} />
                    Discovery Bio / Deck Pitch
                  </label>
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="Short, catchy elevator pitch shown right on your card..."
                    value={discoveryBio}
                    onChange={(e) => setDiscoveryBio(e.target.value)}
                    className="w-full border rounded-xl p-3 text-xs outline-none resize-none leading-relaxed transition-colors"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.primaryText,
                    }}
                  />
                  <div className="text-[11px] text-right mt-0.5" style={{ color: theme.secondaryText }}>
                    {discoveryBio.length}/300
                  </div>
                </div>

                {/* College / University Autocomplete */}
                <div className="space-y-2">
                  <CatalogAutocomplete
                    label="College / University"
                    placeholder="Search or enter college (e.g. AKGEC, IIT Delhi)..."
                    value={college}
                    selectedId={collegeId}
                    icon={GraduationCap}
                    onSearch={handleSearchColleges}
                    onSelect={(item) => {
                      setCollegeId(item.id);
                      setCollege(item.name);
                    }}
                    onAddCustom={handleAddCustomCollege}
                    onClear={() => {
                      setCollegeId(undefined);
                      setCollege('');
                    }}
                  />

                  {/* Passout vs Current Student Switch & Year */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.secondaryText }}>
                        Academic Status
                      </label>
                      <div className="flex border rounded-xl p-0.5" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        <button
                          type="button"
                          onClick={() => setIsPassout(false)}
                          className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors"
                          style={{
                            backgroundColor: !isPassout ? theme.accent : 'transparent',
                            color: !isPassout ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                          }}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPassout(true)}
                          className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors"
                          style={{
                            backgroundColor: isPassout ? theme.accent : 'transparent',
                            color: isPassout ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                          }}
                        >
                          Alumni / Passout
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.secondaryText }}>
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        min={1990}
                        max={2035}
                        placeholder="e.g. 2026"
                        value={passoutYear}
                        onChange={(e) => setPassoutYear(e.target.value ? Number(e.target.value) : '')}
                        className="w-full border rounded-xl px-3.5 py-2 text-xs outline-none transition-colors"
                        style={{
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                          color: theme.primaryText,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Field of Study Autocomplete */}
                <CatalogAutocomplete
                  label="Field of Study / Major"
                  placeholder="Search major (e.g. Computer Science, Product Design)..."
                  value={fieldOfStudy}
                  selectedId={fieldOfStudyId}
                  icon={BookOpen}
                  onSearch={handleSearchFieldsOfStudy}
                  onSelect={(item) => {
                    setFieldOfStudyId(item.id);
                    setFieldOfStudy(item.name);
                  }}
                  onAddCustom={handleAddCustomFieldOfStudy}
                  onClear={() => {
                    setFieldOfStudyId(undefined);
                    setFieldOfStudy('');
                  }}
                />

                {/* Company & Role Autocomplete */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CatalogAutocomplete
                    label="Company / Workplace"
                    placeholder="Search company (e.g. Google, TCS)..."
                    value={organization}
                    selectedId={companyId}
                    icon={Briefcase}
                    onSearch={handleSearchCompanies}
                    onSelect={(item) => {
                      setCompanyId(item.id);
                      setOrganization(item.name);
                    }}
                    onAddCustom={handleAddCustomCompany}
                    onClear={() => {
                      setCompanyId(undefined);
                      setOrganization('');
                    }}
                  />

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.secondaryText }}>
                      Job Title / Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full border rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    />
                  </div>
                </div>

                {/* Location & GPS Detection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider flex items-center gap-1.5" style={{ color: theme.secondaryText }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: theme.secondaryText }} />
                      Location & Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={locating}
                      className="text-xs font-medium flex items-center gap-1 transition-colors"
                      style={{ color: theme.accent }}
                    >
                      {locating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Detecting...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Use Current Location</span>
                        </>
                      )}
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="e.g. Ghaziabad, Uttar Pradesh"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: theme.primaryText,
                    }}
                  />
                  {latitude != null && longitude != null && (
                    <div className="text-[11px] mt-1 flex items-center gap-1" style={{ color: theme.secondaryText }}>
                      Coordinates calibrated for radius search: ({latitude.toFixed(3)}, {longitude.toFixed(3)})
                    </div>
                  )}
                </div>

                {/* Age, Gender & Intent */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.secondaryText }}>
                      Age
                    </label>
                    <input
                      type="number"
                      min={18}
                      max={99}
                      placeholder="e.g. 23"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      className="w-full border rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.secondaryText }}>
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full border rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    >
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="NON_BINARY">Non-Binary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.secondaryText }}>
                      Intent
                    </label>
                    <select
                      value={intent}
                      onChange={(e) => setIntent(e.target.value as ConnectionIntent)}
                      className="w-full border rounded-xl px-3.5 py-2.5 text-xs outline-none transition-colors"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    >
                      <option value="OPEN_TO_ANY">Open to any</option>
                      <option value="DATING">Dating</option>
                      <option value="NETWORKING">Networking</option>
                      <option value="FRIENDSHIP">Friendship</option>
                      <option value="CAMPUS">Campus Peers</option>
                      <option value="CASUAL">Casual Hangouts</option>
                    </select>
                  </div>
                </div>

                {/* Card Interests Tags */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.secondaryText }}>
                    Card Display Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. AI, Coding, Travel)..."
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={handleAddInterest}
                      className="flex-1 border rounded-xl px-3 py-2 text-xs outline-none transition-colors"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.primaryText,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="px-4 py-2 border text-xs font-medium rounded-xl transition-colors"
                      style={{
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        color: theme.accent,
                      }}
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {cardInterests.map((tag) => (
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
              </div>
            ) : (
              /* TAB 2: VISIBILITY TOGGLES (WHAT TO SHOW / HIDE) */
              <div className="space-y-4">
                <div className="text-xs mb-2" style={{ color: theme.secondaryText }}>
                  Control which details appear on your public discovery card. Any toggled-off field will remain completely invisible to other users on the deck.
                </div>

                <div
                  className="divide-y border rounded-2xl"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  }}
                >
                  {/* Show Age */}
                  <div className="p-4 flex items-center justify-between" style={{ borderColor: theme.border }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: theme.primaryText }}>Show Age</div>
                      <div className="text-[11px]" style={{ color: theme.secondaryText }}>Display age next to your name</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showAge}
                        onChange={(e) => setShowAge(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
                    </label>
                  </div>

                  {/* Show Location */}
                  <div className="p-4 flex items-center justify-between" style={{ borderColor: theme.border }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: theme.primaryText }}>Show City / Location</div>
                      <div className="text-[11px]" style={{ color: theme.secondaryText }}>Display your city badge on the card</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showLocation}
                        onChange={(e) => setShowLocation(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
                    </label>
                  </div>

                  {/* Show Distance */}
                  <div className="p-4 flex items-center justify-between" style={{ borderColor: theme.border }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: theme.primaryText }}>Show Distance in Kilometers</div>
                      <div className="text-[11px]" style={{ color: theme.secondaryText }}>Display &ldquo;X km away&rdquo; to nearby viewers</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showDistance}
                        onChange={(e) => setShowDistance(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
                    </label>
                  </div>

                  {/* Show College */}
                  <div className="p-4 flex items-center justify-between" style={{ borderColor: theme.border }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: theme.primaryText }}>Show College / University</div>
                      <div className="text-[11px]" style={{ color: theme.secondaryText }}>Display academic institution badge</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showCollege}
                        onChange={(e) => setShowCollege(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
                    </label>
                  </div>

                  {/* Show Passout Status */}
                  <div className="p-4 flex items-center justify-between" style={{ borderColor: theme.border }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: theme.primaryText }}>Show Alumni / Student Status</div>
                      <div className="text-[11px]" style={{ color: theme.secondaryText }}>Show whether you are currently enrolled or passout</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showPassoutStatus}
                        onChange={(e) => setShowPassoutStatus(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
                    </label>
                  </div>

                  {/* Show Field of Study */}
                  <div className="p-4 flex items-center justify-between" style={{ borderColor: theme.border }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: theme.primaryText }}>Show Major / Field of Study</div>
                      <div className="text-[11px]" style={{ color: theme.secondaryText }}>Display your degree or academic field</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showFieldOfStudy}
                        onChange={(e) => setShowFieldOfStudy(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
                    </label>
                  </div>

                  {/* Show Company & Role */}
                  <div className="p-4 flex items-center justify-between" style={{ borderColor: theme.border }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: theme.primaryText }}>Show Company & Role</div>
                      <div className="text-[11px]" style={{ color: theme.secondaryText }}>Display your organization and job title</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showOrganization && showRole}
                        onChange={(e) => {
                          setShowOrganization(e.target.checked);
                          setShowRole(e.target.checked);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
                    </label>
                  </div>

                  {/* Show Intent */}
                  <div className="p-4 flex items-center justify-between" style={{ borderColor: theme.border }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: theme.primaryText }}>Show Connection Intent</div>
                      <div className="text-[11px]" style={{ color: theme.secondaryText }}>Display your dating or networking intent badge</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showIntent}
                        onChange={(e) => setShowIntent(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
                    </label>
                  </div>

                  {/* Show Interests */}
                  <div className="p-4 flex items-center justify-between" style={{ borderColor: theme.border }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: theme.primaryText }}>Show Passion Tags</div>
                      <div className="text-[11px]" style={{ color: theme.secondaryText }}>Display tag pills on the bottom of the card</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showInterests}
                        onChange={(e) => setShowInterests(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:shadow-md after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-400" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Live Real-Time Card Preview */}
          <div
            className={`md:col-span-5 p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-start md:justify-center min-h-0 w-full ${
              activeTab === 'preview' ? 'flex' : 'hidden md:flex'
            }`}
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
            }}
          >
            <div className="w-full max-w-xs space-y-3 my-auto pb-4 md:pb-0">
              <div
                className="text-center text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 py-1 px-3 rounded-full border mx-auto w-fit shadow-sm"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.secondaryText,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                Live Real-Time Preview
              </div>

              {/* Renders DiscoveryCard in live preview mode */}
              <DiscoveryCard card={previewCard} previewMode={true} />

              <div className="text-center text-[11px]" style={{ color: theme.secondaryText }}>
                Updates in real-time as you type or change toggles.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="px-6 py-3.5 border-t flex items-center justify-end"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border font-medium text-xs transition-colors"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.secondaryText,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl btn-theme-primary font-semibold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
