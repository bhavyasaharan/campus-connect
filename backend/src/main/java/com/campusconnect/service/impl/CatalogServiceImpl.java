package com.campusconnect.service.impl;

import com.campusconnect.model.College;
import com.campusconnect.model.Company;
import com.campusconnect.model.FieldOfStudy;
import com.campusconnect.repository.CollegeRepository;
import com.campusconnect.repository.CompanyRepository;
import com.campusconnect.repository.FieldOfStudyRepository;
import com.campusconnect.service.CatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogServiceImpl implements CatalogService {

    private final CollegeRepository collegeRepository;
    private final CompanyRepository companyRepository;
    private final FieldOfStudyRepository fieldOfStudyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<College> searchColleges(String query, int limit) {
        int pageLimit = Math.min(Math.max(limit, 1), 50);
        if (query == null || query.trim().isEmpty()) {
            return collegeRepository.findTopPopular(PageRequest.of(0, pageLimit));
        }
        return collegeRepository.searchColleges(query.trim(), PageRequest.of(0, pageLimit));
    }

    @Override
    @Transactional
    public College getOrCreateCollege(String name, String city, String state) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String cleanName = name.trim();
        return collegeRepository.findByNameIgnoreCase(cleanName)
                .orElseGet(() -> {
                    log.info("Creating new college catalog entry: {}", cleanName);
                    College newCollege = College.builder()
                            .name(cleanName)
                            .city(city != null && !city.trim().isEmpty() ? city.trim() : null)
                            .state(state != null && !state.trim().isEmpty() ? state.trim() : null)
                            .isVerified(false)
                            .usageCount(1)
                            .build();
                    return collegeRepository.save(newCollege);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<Company> searchCompanies(String query, int limit) {
        int pageLimit = Math.min(Math.max(limit, 1), 50);
        if (query == null || query.trim().isEmpty()) {
            return companyRepository.findTopPopular(PageRequest.of(0, pageLimit));
        }
        return companyRepository.searchCompanies(query.trim(), PageRequest.of(0, pageLimit));
    }

    @Override
    @Transactional
    public Company getOrCreateCompany(String name, String industry) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String cleanName = name.trim();
        return companyRepository.findByNameIgnoreCase(cleanName)
                .orElseGet(() -> {
                    log.info("Creating new company catalog entry: {}", cleanName);
                    Company newCompany = Company.builder()
                            .name(cleanName)
                            .industry(industry != null && !industry.trim().isEmpty() ? industry.trim() : null)
                            .isVerified(false)
                            .usageCount(1)
                            .build();
                    return companyRepository.save(newCompany);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<FieldOfStudy> searchFieldsOfStudy(String query, int limit) {
        int pageLimit = Math.min(Math.max(limit, 1), 50);
        if (query == null || query.trim().isEmpty()) {
            return fieldOfStudyRepository.findTopPopular(PageRequest.of(0, pageLimit));
        }
        return fieldOfStudyRepository.searchFields(query.trim(), PageRequest.of(0, pageLimit));
    }

    @Override
    @Transactional
    public FieldOfStudy getOrCreateFieldOfStudy(String name, String category) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String cleanName = name.trim();
        return fieldOfStudyRepository.findByNameIgnoreCase(cleanName)
                .orElseGet(() -> {
                    log.info("Creating new field of study entry: {}", cleanName);
                    FieldOfStudy newField = FieldOfStudy.builder()
                            .name(cleanName)
                            .category(category != null && !category.trim().isEmpty() ? category.trim() : null)
                            .isVerified(false)
                            .usageCount(1)
                            .build();
                    return fieldOfStudyRepository.save(newField);
                });
    }

    @Override
    @Transactional
    public void incrementCollegeUsage(Long collegeId) {
        if (collegeId == null) return;
        collegeRepository.findById(collegeId).ifPresent(c -> {
            c.setUsageCount(c.getUsageCount() + 1);
            collegeRepository.save(c);
        });
    }

    @Override
    @Transactional
    public void incrementCompanyUsage(Long companyId) {
        if (companyId == null) return;
        companyRepository.findById(companyId).ifPresent(c -> {
            c.setUsageCount(c.getUsageCount() + 1);
            companyRepository.save(c);
        });
    }

    @Override
    @Transactional
    public void incrementFieldUsage(Long fieldId) {
        if (fieldId == null) return;
        fieldOfStudyRepository.findById(fieldId).ifPresent(f -> {
            f.setUsageCount(f.getUsageCount() + 1);
            fieldOfStudyRepository.save(f);
        });
    }
}
