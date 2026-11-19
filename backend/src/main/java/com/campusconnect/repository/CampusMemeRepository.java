package com.campusconnect.repository;

import com.campusconnect.model.CampusMeme;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampusMemeRepository extends JpaRepository<CampusMeme, Long> {
    List<CampusMeme> findAllByOrderByCreatedAtDesc();
    List<CampusMeme> findByCategoryOrderByCreatedAtDesc(String category);
    List<CampusMeme> findByAuthorOrderByCreatedAtDesc(User author);
}
