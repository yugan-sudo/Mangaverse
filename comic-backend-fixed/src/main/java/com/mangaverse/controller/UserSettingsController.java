package com.mangaverse.controller;

import com.mangaverse.entity.User;
import com.mangaverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/me")
public class UserSettingsController {

    private final UserRepository userRepo;

    public UserSettingsController(UserRepository userRepo) { this.userRepo = userRepo; }

    /** GET /api/me/theme — returns saved theme preference */
    @GetMapping("/theme")
    public ResponseEntity<?> getTheme(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.ok(Map.of("theme", "dark"));
        User user = userRepo.findByUsername(principal.getUsername()).orElse(null);
        if (user == null) return ResponseEntity.ok(Map.of("theme", "dark"));
        return ResponseEntity.ok(Map.of("theme", user.getThemePreference()));
    }

    /** GET /api/me/profile */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userRepo.findByUsername(principal.getUsername()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of(
            "displayName",     user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
            "bio",             user.getBio() != null ? user.getBio() : "",
            "avatar",          user.getAvatar(),
            "favouriteGenres", user.getFavouriteGenres() != null ? user.getFavouriteGenres() : ""
        ));
    }

    /** PUT /api/me/profile */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetails principal,
                                            @RequestBody Map<String, String> body) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userRepo.findByUsername(principal.getUsername()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        if (body.containsKey("displayName"))     user.setDisplayName(body.get("displayName"));
        if (body.containsKey("bio"))             user.setBio(body.get("bio"));
        if (body.containsKey("avatar"))          user.setAvatar(body.get("avatar"));
        if (body.containsKey("favouriteGenres")) user.setFavouriteGenres(body.get("favouriteGenres"));
        try {
            userRepo.save(user);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "message", "Failed to save profile",
                "error", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            ));
        }
        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }

    /** PUT /api/me/theme { theme: "dark" | "light" } */
    @PutMapping("/theme")
    public ResponseEntity<?> saveTheme(@AuthenticationPrincipal UserDetails principal,
                                       @RequestBody Map<String, String> body) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userRepo.findByUsername(principal.getUsername()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        String theme = body.getOrDefault("theme", "dark");
        if (!theme.equals("dark") && !theme.equals("light")) theme = "dark";
        user.setThemePreference(theme);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("theme", theme));
    }
}
