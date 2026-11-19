package com.campusconnect.repository;

import com.campusconnect.model.FeedPost;
import com.campusconnect.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedPostRepository extends JpaRepository<FeedPost, Long> {
    List<FeedPost> findAllByOrderByCreatedAtDesc();
    List<FeedPost> findByAuthorOrderByCreatedAtDesc(User author);
}
