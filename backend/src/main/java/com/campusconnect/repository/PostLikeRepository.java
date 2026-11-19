package com.campusconnect.repository;

import com.campusconnect.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);
    void deleteByPostIdAndUserId(Long postId, Long userId);
    long countByPostId(Long postId);

    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.user.id = :userId")
    Set<Long> findLikedPostIdsByUserId(@Param("userId") Long userId);
}
