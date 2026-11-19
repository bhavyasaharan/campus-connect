package com.campusconnect.controller;

import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@Slf4j
@Tag(name = "File Upload", description = "Endpoints for uploading media (photos & videos) for student posts and moments")
public class FileUploadController {

    private static final List<String> ALLOWED_MEDIA_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg",
            "image/pjpeg", "image/x-png", "image/jfif", "image/bmp", "image/svg+xml", "image/heic", "image/heif", "image/avif",
            "video/mp4", "video/webm", "video/quicktime", "video/ogg", "video/x-msvideo", "video/x-matroska", "video/mov"
    );

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif", ".bmp", ".svg", ".heic", ".heif", ".avif",
            ".mp4", ".webm", ".mov", ".ogg", ".avi", ".mkv"
    );

    @Value("${campus.upload.dir:uploads/images}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            log.error("Could not initialize upload storage location: {}", this.rootLocation, e);
        }
    }

    @PostMapping(value = {"/image", "/media"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload image or video for post/moment", description = "Uploads photo or video from local device and returns the accessible media URL.")
    public ResponseEntity<ApiResponse<String>> uploadMedia(
            @Parameter(description = "Media file (Photo: JPEG, PNG, WebP, GIF / Video: MP4, WebM, MOV, OGG)") @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        String rawContentType = file.getContentType();
        String contentType = rawContentType != null ? rawContentType.split(";")[0].trim().toLowerCase() : "";

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "media.jpg");
        if (originalFilename.contains("..")) {
            throw new BadRequestException("Invalid file path sequence in filename");
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        boolean mimeAllowed = !contentType.isEmpty() && ALLOWED_MEDIA_TYPES.contains(contentType);
        boolean extAllowed = !extension.isEmpty() && ALLOWED_EXTENSIONS.contains(extension);

        if (!mimeAllowed && !extAllowed) {
            throw new BadRequestException("Invalid file format. Only JPEG, PNG, WebP, GIF images and MP4, WebM, MOV videos are allowed.");
        }

        if (extension.isEmpty()) {
            extension = contentType.startsWith("video/") ? ".mp4" : ".jpg";
        }

        String generatedFilename = UUID.randomUUID().toString() + extension;
        Path targetPath = this.rootLocation.resolve(generatedFilename).normalize();

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to store uploaded file {}", generatedFilename, e);
            throw new RuntimeException("Failed to store media file on server", e);
        }

        String fileUrl = "/api/upload/image/" + generatedFilename;
        log.info("Successfully uploaded media {} ({}) -> {}", originalFilename, contentType, fileUrl);

        return ResponseEntity.ok(ApiResponse.ok("Media uploaded successfully", fileUrl));
    }

    @GetMapping({"/image/{filename}", "/media/{filename}"})
    @Operation(summary = "Get uploaded image or video", description = "Retrieves an uploaded media file by filename.")
    public ResponseEntity<Resource> getMedia(@PathVariable String filename) {
        String cleanName = StringUtils.cleanPath(filename);
        if (cleanName.contains("..") || cleanName.contains("/") || cleanName.contains("\\")) {
            throw new BadRequestException("Invalid media filename");
        }

        Path file = this.rootLocation.resolve(cleanName).normalize();
        if (!Files.exists(file) || !Files.isReadable(file)) {
            Path alt1 = Paths.get("backend").resolve("uploads").resolve("images").resolve(cleanName).toAbsolutePath().normalize();
            Path alt2 = Paths.get("uploads").resolve("images").resolve(cleanName).toAbsolutePath().normalize();
            if (Files.exists(alt1) && Files.isReadable(alt1)) {
                file = alt1;
            } else if (Files.exists(alt2) && Files.isReadable(alt2)) {
                file = alt2;
            }
        }

        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Media file not found: " + filename);
            }

            MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                    .body(resource);
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Media file error: " + filename);
        }
    }
}
