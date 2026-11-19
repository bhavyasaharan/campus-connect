package com.campusconnect.repository;

import com.campusconnect.model.FieldOfStudy;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FieldOfStudyRepository extends JpaRepository<FieldOfStudy, Long> {

    Optional<FieldOfStudy> findByNameIgnoreCase(String name);

    @Query("SELECT f FROM FieldOfStudy f WHERE " +
           "LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY f.isVerified DESC, f.usageCount DESC, f.name ASC")
    List<FieldOfStudy> searchFields(@Param("query") String query, Pageable pageable);

    @Query("SELECT f FROM FieldOfStudy f ORDER BY f.usageCount DESC, f.name ASC")
    List<FieldOfStudy> findTopPopular(Pageable pageable);
}
