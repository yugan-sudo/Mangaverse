package com.mangaverse.repository;

import com.mangaverse.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    List<ContactMessage> findByStatusOrderByCreatedAtDesc(String status);
    long countByStatus(String status);
}
