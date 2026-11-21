package com.campusconnect.service.impl;

import com.campusconnect.dto.request.UpdateDiscoverCardRequest;
import com.campusconnect.dto.response.DiscoverCardResponse;
import com.campusconnect.dto.response.ExpandedDiscoveryProfileResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.model.*;
import com.campusconnect.repository.*;
import com.campusconnect.service.CatalogService;
import com.campusconnect.service.ConnectionService;
import com.campusconnect.service.DiscoveryCardService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiscoveryCardServiceImpl implements DiscoveryCardService {

    private final DiscoverCardRepository discoverCardRepository;
    private final UserRepository userRepository;
    private final UserPostRepository userPostRepository;
    private final ConnectionRepository connectionRepository;
    private final ConnectRequestRepository connectRequestRepository;
    private final UserBlockRepository userBlockRepository;
    private final ConnectionService connectionService;
    private final StudentProfileRepository studentProfileRepository;

    private final CollegeRepository collegeRepository;
    private final CompanyRepository companyRepository;
    private final FieldOfStudyRepository fieldOfStudyRepository;
    private final CatalogService catalogService;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#([a-zA-Z0-9_-]+)");

    @Override
    @Transactional(readOnly = true)
    public DiscoverCardResponse getMyCard(Long currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

        DiscoverCard card = discoverCardRepository.findByUser(user).orElse(null);
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        List<String> availablePhotos = getAvailablePhotosForUser(user);
        List<String> interests = extractInterests(user);

        return DiscoverCardResponse.fromEntity(card, user, profile, availablePhotos, interests);
    }

    @Override
    @Transactional
    public DiscoverCardResponse updateMyCard(Long currentUserId, UpdateDiscoverCardRequest request) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

        if (request.getDiscoveryBio() != null && request.getDiscoveryBio().length() > 300) {
            throw new BadRequestException("Discovery bio cannot exceed 300 characters.");
        }

        List<String> availablePhotos = getAvailablePhotosForUser(user);

        // Validate selected main photo belongs to authenticated user
        if (request.getMainPhotoUrl() != null && !request.getMainPhotoUrl().isBlank()) {
            String selected = request.getMainPhotoUrl().trim();
            if (!availablePhotos.isEmpty() && !availablePhotos.contains(selected)) {
                StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
                boolean isAvatarMatch = profile != null && profile.getAvatarUrl() != null && profile.getAvatarUrl().equals(selected);
                if (!isAvatarMatch) {
                    throw new BadRequestException("Selected discovery photograph must belong to your uploaded profile photographs.");
                }
            }
        }

        DiscoverCard card = discoverCardRepository.findByUser(user)
                .orElseGet(() -> DiscoverCard.builder().user(user).build());

        // Master parent switch
        if (request.getIsDiscoverable() != null) {
            card.setDiscoverable(request.getIsDiscoverable());
        }

        if (request.getMainPhotoUrl() != null) {
            card.setMainPhotoUrl(request.getMainPhotoUrl().trim());
        }
        if (request.getDiscoveryBio() != null) {
            card.setDiscoveryBio(request.getDiscoveryBio().trim());
        }

        if (request.getAllowedMediaUrls() != null) {
            List<String> validAllowed = new ArrayList<>();
            for (String url : request.getAllowedMediaUrls()) {
                if (url != null && !url.isBlank()) {
                    String clean = url.trim();
                    if (availablePhotos.isEmpty() || availablePhotos.contains(clean)) {
                        validAllowed.add(clean);
                    }
                }
            }
            try {
                card.setAllowedMediaUrls(OBJECT_MAPPER.writeValueAsString(validAllowed));
            } catch (Exception e) {
                card.setAllowedMediaUrls(String.join(",", validAllowed));
            }
        }

        // --- College Catalog Linkage ---
        if (request.getCollegeId() != null) {
            College college = collegeRepository.findById(request.getCollegeId()).orElse(null);
            if (college != null) {
                card.setCollege(college);
                card.setCustomCollegeName(null);
                catalogService.incrementCollegeUsage(college.getId());
            }
        } else if (request.getCustomCollegeName() != null && !request.getCustomCollegeName().isBlank()) {
            College college = catalogService.getOrCreateCollege(request.getCustomCollegeName().trim(), null, null);
            card.setCollege(college);
            card.setCustomCollegeName(null);
        } else if (request.getCollege() != null && !request.getCollege().isBlank()) {
            College college = catalogService.getOrCreateCollege(request.getCollege().trim(), null, null);
            card.setCollege(college);
            card.setCustomCollegeName(null);
        }

        if (request.getIsPassout() != null) {
            card.setPassout(request.getIsPassout());
        }
        if (request.getPassoutYear() != null) {
            card.setPassoutYear(request.getPassoutYear());
        }

        // --- Company Catalog Linkage ---
        if (request.getCompanyId() != null) {
            Company company = companyRepository.findById(request.getCompanyId()).orElse(null);
            if (company != null) {
                card.setCompany(company);
                card.setCustomCompanyName(null);
                catalogService.incrementCompanyUsage(company.getId());
            }
        } else if (request.getCustomCompanyName() != null && !request.getCustomCompanyName().isBlank()) {
            Company company = catalogService.getOrCreateCompany(request.getCustomCompanyName().trim(), null);
            card.setCompany(company);
            card.setCustomCompanyName(null);
        } else if (request.getOrganization() != null && !request.getOrganization().isBlank()) {
            Company company = catalogService.getOrCreateCompany(request.getOrganization().trim(), null);
            card.setCompany(company);
            card.setCustomCompanyName(null);
        }

        if (request.getRoleTitle() != null) {
            card.setRoleTitle(request.getRoleTitle().trim());
        }

        // --- Field of Study Catalog Linkage ---
        if (request.getFieldOfStudyId() != null) {
            FieldOfStudy field = fieldOfStudyRepository.findById(request.getFieldOfStudyId()).orElse(null);
            if (field != null) {
                card.setFieldOfStudy(field);
                card.setCustomFieldOfStudy(null);
                catalogService.incrementFieldUsage(field.getId());
            }
        } else if (request.getCustomFieldOfStudy() != null && !request.getCustomFieldOfStudy().isBlank()) {
            FieldOfStudy field = catalogService.getOrCreateFieldOfStudy(request.getCustomFieldOfStudy().trim(), null);
            card.setFieldOfStudy(field);
            card.setCustomFieldOfStudy(null);
        } else if (request.getFieldOfStudy() != null && !request.getFieldOfStudy().isBlank()) {
            FieldOfStudy field = catalogService.getOrCreateFieldOfStudy(request.getFieldOfStudy().trim(), null);
            card.setFieldOfStudy(field);
            card.setCustomFieldOfStudy(null);
        }

        // --- Demographics & Intent ---
        if (request.getAge() != null) {
            card.setAge(request.getAge());
        }
        if (request.getBirthdate() != null) {
            card.setBirthdate(request.getBirthdate());
        }
        if (request.getGender() != null) {
            card.setGender(Gender.fromString(request.getGender().trim()));
        }
        if (request.getIntent() != null) {
            card.setIntent(ConnectionIntent.fromString(request.getIntent().trim()));
        }

        // --- Coordinates & Location ---
        if (request.getLocation() != null) {
            card.setCityName(request.getLocation().trim());
        }
        if (request.getLatitude() != null) {
            card.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            card.setLongitude(request.getLongitude());
        }

        // --- Visibility Controls ---
        if (request.getShowCollege() != null) card.setShowCollege(request.getShowCollege());
        if (request.getShowPassoutStatus() != null) card.setShowPassoutStatus(request.getShowPassoutStatus());
        if (request.getShowCourse() != null) card.setShowCourse(request.getShowCourse());
        if (request.getShowFieldOfStudy() != null) card.setShowFieldOfStudy(request.getShowFieldOfStudy());
        if (request.getShowOrganization() != null) card.setShowOrganization(request.getShowOrganization());
        if (request.getShowRole() != null) card.setShowRole(request.getShowRole());
        if (request.getShowAge() != null) card.setShowAge(request.getShowAge());
        if (request.getShowLocation() != null) card.setShowLocation(request.getShowLocation());
        if (request.getShowDistance() != null) card.setShowDistance(request.getShowDistance());
        if (request.getShowIntent() != null) card.setShowIntent(request.getShowIntent());
        if (request.getShowInterests() != null) card.setShowInterests(request.getShowInterests());

        DiscoverCard saved = discoverCardRepository.save(card);

        // Keep profile interests, academic status, and avatar in sync if provided
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile != null) {
            boolean profileModified = false;
            if (request.getInterests() != null) {
                profile.setInterests(String.join(", ", request.getInterests()));
                profileModified = true;
            }
            if (request.getIsPassout() != null) {
                profile.setPassout(request.getIsPassout());
                if (request.getIsPassout()) {
                    profile.setPersonaType(PersonaType.PASSOUT);
                } else if (profile.getPersonaType() == PersonaType.PASSOUT) {
                    profile.setPersonaType(PersonaType.STUDENT);
                }
                profileModified = true;
            }
            if (request.getPassoutYear() != null) {
                profile.setGraduationYear(String.valueOf(request.getPassoutYear()));
                profileModified = true;
            }
            if (profileModified) {
                studentProfileRepository.save(profile);
            }
        }

        List<String> interests = extractInterests(user);
        return DiscoverCardResponse.fromEntity(saved, user, profile, availablePhotos, interests);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiscoverCardResponse> getDiscoveryFeed(Long currentUserId, boolean includePassed) {
        return getDiscoveryFeed(currentUserId, includePassed, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiscoverCardResponse> getDiscoveryFeed(
            Long currentUserId,
            boolean includePassed,
            String mode,
            String campusStatus,
            Long collegeId,
            String college,
            Long fieldOfStudyId,
            String fieldOfStudy,
            Long companyId,
            String organization,
            String location,
            Double latitude,
            Double longitude,
            Double radiusKm,
            Integer minAge,
            Integer maxAge,
            String gender,
            String intent) {

        List<UserResponse> candidates = connectionService.getDiscoveryCandidates(currentUserId, includePassed);
        User currentUser = userRepository.findById(currentUserId).orElse(null);
        DiscoverCard currentCard = currentUser != null ? discoverCardRepository.findByUser(currentUser).orElse(null) : null;

        // Resolve viewer coordinates
        Double viewerLat = latitude != null ? latitude : (currentCard != null ? currentCard.getLatitude() : null);
        Double viewerLon = longitude != null ? longitude : (currentCard != null ? currentCard.getLongitude() : null);

        List<DiscoverCardResponse> feed = new ArrayList<>();
        for (UserResponse candidateDto : candidates) {
            User candidate = userRepository.findById(candidateDto.getId()).orElse(null);
            if (candidate == null) continue;

            DiscoverCard card = discoverCardRepository.findByUser(candidate).orElse(null);
            StudentProfile profile = studentProfileRepository.findByUser(candidate).orElse(null);

            // MASTER PARENT TOGGLE: If card is marked not discoverable, completely exclude it!
            if (card != null && !card.isDiscoverable()) {
                continue;
            }

            // Resolved values for candidate
            String candidateCollege = card != null ? card.getResolvedCollegeName() : (profile != null ? profile.getCollege() : null);
            Long candidateCollegeId = card != null && card.getCollege() != null ? card.getCollege().getId() : null;
            boolean candidateIsPassout = card != null ? card.isPassout() : (profile != null && profile.isPassout());
            String candidateOrg = card != null ? card.getResolvedCompanyName() : (profile != null ? profile.getOrganization() : null);
            Long candidateCompanyId = card != null && card.getCompany() != null ? card.getCompany().getId() : null;
            String candidateFos = card != null ? card.getResolvedFieldOfStudy() : (profile != null ? profile.getFieldOfStudy() : null);
            Long candidateFieldId = card != null && card.getFieldOfStudy() != null ? card.getFieldOfStudy().getId() : null;
            Integer candidateAge = card != null && card.getAge() != null ? card.getAge() : (profile != null ? profile.getAge() : null);
            Gender candidateGender = card != null && card.getGender() != null ? card.getGender() : (profile != null ? profile.getGender() : null);
            ConnectionIntent candidateIntent = card != null && card.getIntent() != null ? card.getIntent() : (profile != null ? profile.getIntent() : null);

            // --- Geospatial Radius Calculation ---
            Double distanceKm = null;
            if (viewerLat != null && viewerLon != null && card != null && card.getLatitude() != null && card.getLongitude() != null) {
                distanceKm = calculateDistanceKm(viewerLat, viewerLon, card.getLatitude(), card.getLongitude());
                if (radiusKm != null && radiusKm > 0 && distanceKm > radiusKm) {
                    continue; // Out of geographic radius
                }
            }

            // --- Filter by Mode ---
            if (mode != null && !mode.isBlank() && !mode.equalsIgnoreCase("ALL")) {
                if (mode.equalsIgnoreCase("CAMPUS")) {
                    String targetCollege = (college != null && !college.isBlank())
                            ? college
                            : (currentCard != null ? currentCard.getResolvedCollegeName() : null);
                    if (targetCollege != null && !targetCollege.isBlank()) {
                        if (candidateCollege == null || !candidateCollege.trim().equalsIgnoreCase(targetCollege.trim())) {
                            continue;
                        }
                    }
                    if (campusStatus != null && !campusStatus.isBlank() && !campusStatus.equalsIgnoreCase("ALL")) {
                        if (campusStatus.equalsIgnoreCase("STUDENT") && candidateIsPassout) {
                            continue;
                        }
                        if (campusStatus.equalsIgnoreCase("PASSOUT") && !candidateIsPassout) {
                            continue;
                        }
                    }
                } else if (mode.equalsIgnoreCase("PROFESSIONAL")) {
                    if (candidateIsPassout == false && (candidateOrg == null || candidateOrg.isBlank())) {
                        continue;
                    }
                } else if (mode.equalsIgnoreCase("DATING")) {
                    if (candidateIntent == ConnectionIntent.NETWORKING) {
                        continue;
                    }
                }
            }

            // --- Filter by College Catalog ID or Name ---
            if (collegeId != null) {
                if (!Objects.equals(candidateCollegeId, collegeId)) {
                    continue;
                }
            } else if (college != null && !college.isBlank()) {
                if (candidateCollege == null || !candidateCollege.toLowerCase().contains(college.trim().toLowerCase())) {
                    continue;
                }
            }

            // --- Filter by Campus Status ---
            if (campusStatus != null && !campusStatus.isBlank() && !campusStatus.equalsIgnoreCase("ALL")) {
                if (campusStatus.equalsIgnoreCase("STUDENT") && candidateIsPassout) {
                    continue;
                }
                if (campusStatus.equalsIgnoreCase("PASSOUT") && !candidateIsPassout) {
                    continue;
                }
            }

            // --- Filter by Field of Study ---
            if (fieldOfStudyId != null) {
                if (!Objects.equals(candidateFieldId, fieldOfStudyId)) {
                    continue;
                }
            } else if (fieldOfStudy != null && !fieldOfStudy.isBlank()) {
                if (candidateFos == null || !candidateFos.toLowerCase().contains(fieldOfStudy.trim().toLowerCase())) {
                    continue;
                }
            }

            // --- Filter by Organization / Company ---
            if (companyId != null) {
                if (!Objects.equals(candidateCompanyId, companyId)) {
                    continue;
                }
            } else if (organization != null && !organization.isBlank()) {
                if (candidateOrg == null || !candidateOrg.toLowerCase().contains(organization.trim().toLowerCase())) {
                    continue;
                }
            }

            // --- Filter by City / Location Name (Fallback if GPS not used) ---
            if (location != null && !location.isBlank() && (radiusKm == null || radiusKm <= 0)) {
                String candidateLoc = card != null && card.getCityName() != null ? card.getCityName() : (profile != null ? profile.getLocation() : null);
                if (candidateLoc == null || !candidateLoc.toLowerCase().contains(location.trim().toLowerCase())) {
                    continue;
                }
            }

            // --- Age Range Filtering ---
            if (minAge != null && candidateAge != null && candidateAge < minAge) {
                continue;
            }
            if (maxAge != null && candidateAge != null && candidateAge > maxAge) {
                continue;
            }

            // --- Gender Filtering ---
            if (gender != null && !gender.isBlank() && !gender.equalsIgnoreCase("ALL")) {
                if (candidateGender == null || !candidateGender.name().equalsIgnoreCase(gender.trim())) {
                    continue;
                }
            }

            // --- Intent Filtering ---
            if (intent != null && !intent.isBlank() && !intent.equalsIgnoreCase("ALL")) {
                if (candidateIntent == null || !candidateIntent.name().equalsIgnoreCase(intent.trim())) {
                    continue;
                }
            }

            List<String> availablePhotos = getAvailablePhotosForUser(candidate);
            List<String> interests = extractInterests(candidate);
            feed.add(DiscoverCardResponse.fromEntity(card, candidate, profile, availablePhotos, interests, distanceKm));
        }

        // Sort by distance if distance is available, else keep order
        feed.sort((a, b) -> {
            if (a.getDistanceKm() != null && b.getDistanceKm() != null) {
                return Double.compare(a.getDistanceKm(), b.getDistanceKm());
            }
            if (a.getDistanceKm() != null) return -1;
            if (b.getDistanceKm() != null) return 1;
            return 0;
        });

        return feed;
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the Earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    @Transactional(readOnly = true)
    public ExpandedDiscoveryProfileResponse getExpandedProfile(Long currentUserId, Long targetUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found with id: " + targetUserId));

        if (userBlockRepository.isBlockedBetween(currentUser, targetUser)) {
            throw new ForbiddenException("Cannot view profile of a blocked user.");
        }

        DiscoverCard card = discoverCardRepository.findByUser(targetUser).orElse(null);
        StudentProfile profile = studentProfileRepository.findByUser(targetUser).orElse(null);
        List<String> availablePhotos = getAvailablePhotosForUser(targetUser);
        List<String> interests = extractInterests(targetUser);

        Optional<Connection> conn = connectionRepository.findBetweenUsers(currentUser, targetUser);
        boolean isConnected = conn.isPresent();
        Long connectionId = conn.map(Connection::getId).orElse(null);

        Optional<ConnectRequest> req = connectRequestRepository.findBySenderAndReceiver(currentUser, targetUser);
        boolean hasPending = req.isPresent() && req.get().getStatus() == ConnectRequest.RequestStatus.PENDING;
        Long requestId = req.map(ConnectRequest::getId).orElse(null);

        String resolvedCollege = card != null ? card.getResolvedCollegeName() : (profile != null ? profile.getCollege() : null);
        String resolvedFos = card != null ? card.getResolvedFieldOfStudy() : (profile != null ? (profile.getFieldOfStudy() != null ? profile.getFieldOfStudy() : profile.getCourse()) : null);

        List<String> galleryPhotos = new ArrayList<>();
        if (card != null && card.getAllowedMediaUrls() != null && !card.getAllowedMediaUrls().isBlank()) {
            List<String> allowedList = new ArrayList<>();
            String raw = card.getAllowedMediaUrls().trim();
            if (raw.startsWith("[")) {
                try {
                    allowedList = OBJECT_MAPPER.readValue(raw, new TypeReference<List<String>>() {});
                } catch (Exception e) {
                    log.debug("Failed to parse allowedMediaUrls in getExpandedProfile: {}", e.getMessage());
                }
            } else {
                for (String part : raw.split(",")) {
                    if (!part.trim().isEmpty()) {
                        allowedList.add(part.trim());
                    }
                }
            }
            if (!allowedList.isEmpty()) {
                for (String p : availablePhotos) {
                    if (allowedList.contains(p)) {
                        galleryPhotos.add(p);
                    }
                }
            } else {
                galleryPhotos.addAll(availablePhotos);
            }
        } else {
            galleryPhotos.addAll(availablePhotos);
        }

        return ExpandedDiscoveryProfileResponse.builder()
                .user(UserResponse.fromEntity(targetUser, profile))
                .discoveryBio(card != null && card.getDiscoveryBio() != null ? card.getDiscoveryBio() : (profile != null ? profile.getBio() : null))
                .mainPhotoUrl(card != null && card.getMainPhotoUrl() != null ? card.getMainPhotoUrl() : (profile != null ? profile.getAvatarUrl() : null))
                .photoGallery(galleryPhotos)
                .college(resolvedCollege)
                .course(resolvedFos)
                .interests(interests)
                .showCollege(card == null || card.isShowCollege())
                .showCourse(card == null || card.isShowFieldOfStudy() || card.isShowCourse())
                .showInterests(card == null || card.isShowInterests())
                .isConnected(isConnected)
                .hasPendingRequest(hasPending)
                .existingConnectionId(connectionId)
                .existingRequestId(requestId)
                .build();
    }

    private List<String> getAvailablePhotosForUser(User user) {
        Set<String> photos = new LinkedHashSet<>();

        // 1. Gather all photos from user's published profile posts
        List<UserPost> posts = userPostRepository.findByAuthorOrderByCreatedAtDesc(user);
        for (UserPost post : posts) {
            if (post.getMediaUrls() != null && !post.getMediaUrls().isBlank()) {
                String mediaUrls = post.getMediaUrls().trim();
                if (mediaUrls.startsWith("[")) {
                    try {
                        List<Map<String, Object>> items = OBJECT_MAPPER.readValue(mediaUrls, new TypeReference<List<Map<String, Object>>>() {});
                        for (Map<String, Object> item : items) {
                            String url = (String) item.get("url");
                            String type = (String) item.get("type");
                            if (url != null && !url.isBlank() && (type == null || "IMAGE".equalsIgnoreCase(type))) {
                                photos.add(url.trim());
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Failed to parse mediaUrls JSON for post {}: {}", post.getId(), e.getMessage());
                    }
                } else {
                    String[] urls = mediaUrls.split(",");
                    for (String u : urls) {
                        if (!u.trim().isEmpty() && !isVideoUrl(u)) {
                            photos.add(u.trim());
                        }
                    }
                }
            }
            if (post.getImageUrl() != null && !post.getImageUrl().isBlank() && !isVideoUrl(post.getImageUrl())) {
                photos.add(post.getImageUrl().trim());
            }
        }

        // 2. Avatar fallback if user has profile avatar
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile != null && profile.getAvatarUrl() != null && !profile.getAvatarUrl().isBlank()) {
            photos.add(profile.getAvatarUrl().trim());
        }

        return new ArrayList<>(photos);
    }

    private static boolean isVideoUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov") ||
               lower.endsWith(".ogg") || lower.endsWith(".m4v") || lower.contains("video/");
    }

    private List<String> extractInterests(User user) {
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile != null && profile.getInterests() != null && !profile.getInterests().isBlank()) {
            return Arrays.stream(profile.getInterests().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return Collections.emptyList();
    }
}
