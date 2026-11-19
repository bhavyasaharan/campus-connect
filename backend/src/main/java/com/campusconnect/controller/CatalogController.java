package com.campusconnect.controller;

import com.campusconnect.model.College;
import com.campusconnect.model.Company;
import com.campusconnect.model.FieldOfStudy;
import com.campusconnect.service.CatalogService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CatalogController {

    private final CatalogService catalogService;

    // --- Colleges ---
    @GetMapping("/colleges")
    public ResponseEntity<List<College>> searchColleges(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        return ResponseEntity.ok(catalogService.searchColleges(query, limit));
    }

    @PostMapping("/colleges")
    public ResponseEntity<College> createCollege(@RequestBody CreateCollegeRequest request) {
        College college = catalogService.getOrCreateCollege(request.getName(), request.getCity(), request.getState());
        return ResponseEntity.ok(college);
    }

    // --- Companies ---
    @GetMapping("/companies")
    public ResponseEntity<List<Company>> searchCompanies(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        return ResponseEntity.ok(catalogService.searchCompanies(query, limit));
    }

    @PostMapping("/companies")
    public ResponseEntity<Company> createCompany(@RequestBody CreateCompanyRequest request) {
        Company company = catalogService.getOrCreateCompany(request.getName(), request.getIndustry());
        return ResponseEntity.ok(company);
    }

    // --- Fields of Study ---
    @GetMapping("/fields-of-study")
    public ResponseEntity<List<FieldOfStudy>> searchFieldsOfStudy(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        return ResponseEntity.ok(catalogService.searchFieldsOfStudy(query, limit));
    }

    @PostMapping("/fields-of-study")
    public ResponseEntity<FieldOfStudy> createFieldOfStudy(@RequestBody CreateFieldRequest request) {
        FieldOfStudy field = catalogService.getOrCreateFieldOfStudy(request.getName(), request.getCategory());
        return ResponseEntity.ok(field);
    }

    @Data
    public static class CreateCollegeRequest {
        private String name;
        private String city;
        private String state;
    }

    @Data
    public static class CreateCompanyRequest {
        private String name;
        private String industry;
    }

    @Data
    public static class CreateFieldRequest {
        private String name;
        private String category;
    }
}
