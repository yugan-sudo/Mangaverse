package com.mangaverse.controller;

import com.mangaverse.entity.ContactMessage;
import com.mangaverse.repository.ContactMessageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactMessageRepository contactRepo;

    public ContactController(ContactMessageRepository contactRepo) {
        this.contactRepo = contactRepo;
    }

    // POST /api/contact  (public — no auth required)
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody ContactRequest req) {
        if (req.getName()    == null || req.getName().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
        if (req.getEmail()   == null || req.getEmail().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        if (req.getMessage() == null || req.getMessage().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));

        ContactMessage msg = new ContactMessage();
        msg.setName(req.getName().trim());
        msg.setEmail(req.getEmail().trim().toLowerCase());
        msg.setSubject(req.getSubject() != null ? req.getSubject() : "general");
        msg.setMessage(req.getMessage().trim());

        contactRepo.save(msg);
        return ResponseEntity.ok(Map.of("message", "Thank you! We will get back to you soon."));
    }

    // ── Request DTO ──────────────────────────────────────────────────────
    public static class ContactRequest {
        private String name, email, subject, message;
        public String getName()    { return name; }    public void setName(String n)    { this.name = n; }
        public String getEmail()   { return email; }   public void setEmail(String e)   { this.email = e; }
        public String getSubject() { return subject; } public void setSubject(String s) { this.subject = s; }
        public String getMessage() { return message; } public void setMessage(String m) { this.message = m; }
    }
}
