package com.campusconnect.service;

import com.campusconnect.model.College;
import com.campusconnect.model.Company;
import com.campusconnect.model.FieldOfStudy;

import java.util.List;

public interface CatalogService {

    List<College> searchColleges(String query, int limit);

    College getOrCreateCollege(String name, String city, String state);

    List<Company> searchCompanies(String query, int limit);

    Company getOrCreateCompany(String name, String industry);

    List<FieldOfStudy> searchFieldsOfStudy(String query, int limit);

    FieldOfStudy getOrCreateFieldOfStudy(String name, String category);

    void incrementCollegeUsage(Long collegeId);

    void incrementCompanyUsage(Long companyId);

    void incrementFieldUsage(Long fieldId);
}
