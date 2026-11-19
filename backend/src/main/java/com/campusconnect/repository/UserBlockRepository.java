package com.campusconnect.repository;

import com.campusconnect.model.User;
import com.campusconnect.model.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    Optional<UserBlock> findByBlockerAndBlocked(User blocker, User blocked);
    List<UserBlock> findByBlocker(User blocker);

    @Query("SELECT COUNT(b) > 0 FROM UserBlock b WHERE (b.blocker = :u1 AND b.blocked = :u2) OR (b.blocker = :u2 AND b.blocked = :u1)")
    boolean isBlockedBetween(@Param("u1") User u1, @Param("u2") User u2);

    @Query("SELECT b.blocked.id FROM UserBlock b WHERE b.blocker = :user")
    List<Long> findBlockedUserIdsByBlocker(@Param("user") User user);

    @Query("SELECT b.blocker.id FROM UserBlock b WHERE b.blocked = :user")
    List<Long> findBlockerUserIdsWhoBlocked(@Param("user") User user);
}
