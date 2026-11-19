package com.campusconnect.repository;

import com.campusconnect.model.User;
import com.campusconnect.model.UserPass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPassRepository extends JpaRepository<UserPass, Long> {
    Optional<UserPass> findByUserAndPassedUser(User user, User passedUser);
    List<UserPass> findByUser(User user);
    void deleteByUser(User user);
}
