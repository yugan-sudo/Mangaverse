package com.mangaverse.repository;

import com.mangaverse.entity.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {
    Optional<UserFollow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
    List<UserFollow> findByFollowerId(Long followerId);
    List<UserFollow> findByFollowingId(Long followingId);
    long countByFollowingId(Long followingId);
    long countByFollowerId(Long followerId);
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);
}
