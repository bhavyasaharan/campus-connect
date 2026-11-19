package com.campusconnect.repository;

import com.campusconnect.model.MemeLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface MemeLikeRepository extends JpaRepository<MemeLike, Long> {
    boolean existsByMemeIdAndUserId(Long memeId, Long userId);
    Optional<MemeLike> findByMemeIdAndUserId(Long memeId, Long userId);
    void deleteByMemeIdAndUserId(Long memeId, Long userId);
    long countByMemeId(Long memeId);

    @Query("SELECT ml.meme.id FROM MemeLike ml WHERE ml.user.id = :userId")
    Set<Long> findLikedMemeIdsByUserId(@Param("userId") Long userId);
}
