package com.mangaverse.repository;

import com.mangaverse.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndReadFalse(Long userId);
    @Transactional void deleteByReferenceId(Long referenceId); // for cascade comic delete
    @Transactional void deleteByUserId(Long userId);
}
