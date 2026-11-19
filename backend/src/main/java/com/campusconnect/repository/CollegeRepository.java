package com.campusconnect.repository;

import com.campusconnect.model.College;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollegeRepository extends JpaRepository<College, Long> {

    Optional<College> findByNameIgnoreCase(String name);

    @Query("SELECT c FROM College c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(c.shortName IS NOT NULL AND LOWER(c.shortName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY c.isVerified DESC, c.usageCount DESC, c.name ASC")
    List<College> searchColleges(@Param("query") String query, Pageable pageable);

    @Query("SELECT c FROM College c ORDER BY c.usageCount DESC, c.name ASC")
    List<College> findTopPopular(Pageable pageable);
}
