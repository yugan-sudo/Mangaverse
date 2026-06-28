package com.mangaverse.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@mangaverse.com}")
    private String from;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendNewChapterNotification(String toEmail, String username,
                                           String comicTitle, int chapterNumber, long comicId) {
        if (!enabled) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("New Chapter: " + comicTitle + " — Chapter " + chapterNumber);
            helper.setText(buildChapterHtml(username, comicTitle, chapterNumber, comicId), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Email failed for " + toEmail + ": " + e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String username) {
        if (!enabled) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to MangaVerse, " + username + "!");
            helper.setText(buildWelcomeHtml(username), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Welcome email failed for " + toEmail + ": " + e.getMessage());
        }
    }

    private String buildChapterHtml(String username, String comicTitle, int chapterNumber, long comicId) {
        return "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#0d0d1a;font-family:sans-serif;'>"
             + "<div style='max-width:540px;margin:0 auto;padding:2rem 1rem;'>"
             + "<div style='background:linear-gradient(135deg,#1a1a3e,#2d1b69);border-radius:16px;padding:2rem;text-align:center;margin-bottom:1.5rem;'>"
             + "<div style='font-size:2.5rem;margin-bottom:0.5rem;'>📖</div>"
             + "<h1 style='color:#fff;font-size:1.4rem;margin:0 0 0.5rem;'>New Chapter Available!</h1>"
             + "<p style='color:rgba(255,255,255,0.7);margin:0;font-size:0.9rem;'>Hey " + username + ", a series you bookmarked just updated.</p>"
             + "</div>"
             + "<div style='background:#1a1a2e;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;text-align:center;'>"
             + "<h2 style='color:#fff;font-size:1.2rem;margin:0 0 0.5rem;'>" + comicTitle + "</h2>"
             + "<div style='background:linear-gradient(135deg,#8b5cf6,#e94560);color:#fff;display:inline-block;padding:0.4rem 1.2rem;border-radius:50px;font-weight:700;font-size:1rem;margin:0.5rem 0;'>"
             + "Chapter " + chapterNumber + " is out!</div></div>"
             + "<div style='text-align:center;margin-bottom:2rem;'>"
             + "<a href='" + frontendUrl + "/comic/" + comicId + "' style='background:#e94560;color:#fff;text-decoration:none;padding:0.75rem 2rem;border-radius:50px;font-weight:700;font-size:1rem;display:inline-block;'>Read Now</a>"
             + "</div>"
             + "<p style='color:rgba(255,255,255,0.3);font-size:0.72rem;text-align:center;'>You received this because you bookmarked this series on MangaVerse.</p>"
             + "</div></body></html>";
    }

    private String buildWelcomeHtml(String username) {
        return "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#0d0d1a;font-family:sans-serif;'>"
             + "<div style='max-width:540px;margin:0 auto;padding:2rem 1rem;'>"
             + "<div style='background:linear-gradient(135deg,#1a1a3e,#2d1b69);border-radius:16px;padding:2rem;text-align:center;'>"
             + "<div style='font-size:3rem;margin-bottom:1rem;'>👻</div>"
             + "<h1 style='color:#fff;font-size:1.5rem;margin:0 0 0.75rem;'>Welcome to MangaVerse!</h1>"
             + "<p style='color:rgba(255,255,255,0.75);margin:0 0 1.5rem;font-size:0.95rem;'>Hey " + username + ", your account is ready.</p>"
             + "<a href='" + frontendUrl + "' style='background:#e94560;color:#fff;text-decoration:none;padding:0.75rem 2rem;border-radius:50px;font-weight:700;font-size:1rem;display:inline-block;'>Start Reading</a>"
             + "</div></div></body></html>";
    }
}
