package com.campusconnect.repository;

import com.campusconnect.model.Company;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByNameIgnoreCase(String name);

    @Query("SELECT c FROM Company c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY c.isVerified DESC, c.usageCount DESC, c.name ASC")
    List<Company> searchCompanies(@Param("query") String query, Pageable pageable);

    @Query("SELECT c FROM Company c ORDER BY c.usageCount DESC, c.name ASC")
    List<Company> findTopPopular(Pageable pageable);
}
