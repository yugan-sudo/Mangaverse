package com.mangaverse.repository;
import com.mangaverse.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
    Optional<BlockedUser> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
    List<BlockedUser> findByBlockerId(Long blockerId);
}
