package com.mangaverse.controller;

import com.mangaverse.entity.*;
import com.mangaverse.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import com.mangaverse.repository.AnnouncementRepository;
import com.mangaverse.repository.ContactMessageRepository;
import com.mangaverse.service.EmailService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ComicRepository           comicRepo;
    private final ChapterRepository         chapterRepo;
    private final UserRepository            userRepo;
    private final BookmarkRepository        bookmarkRepo;
    private final NotificationRepository    notifRepo;
    private final CommentRepository         commentRepo;
    private final ComicLikeRepository       likeRepo;
    private final RatingRepository          ratingRepo;
    private final AnnouncementRepository    announcementRepo;
    private final ContactMessageRepository  contactRepo;
    private final CommunityPostRepository   communityPostRepo;
    private final EmailService              emailService;

    public AdminController(ComicRepository comicRepo, ChapterRepository chapterRepo,
                           UserRepository userRepo, BookmarkRepository bookmarkRepo,
                           NotificationRepository notifRepo, CommentRepository commentRepo,
                           ComicLikeRepository likeRepo, RatingRepository ratingRepo,
                           AnnouncementRepository announcementRepo,
                           ContactMessageRepository contactRepo,
                           CommunityPostRepository communityPostRepo,
                           EmailService emailService) {
        this.comicRepo         = comicRepo;    this.chapterRepo = chapterRepo;
        this.userRepo          = userRepo;     this.bookmarkRepo = bookmarkRepo;
        this.notifRepo         = notifRepo;    this.commentRepo = commentRepo;
        this.likeRepo          = likeRepo;     this.ratingRepo  = ratingRepo;
        this.announcementRepo  = announcementRepo;
        this.contactRepo       = contactRepo;
        this.communityPostRepo = communityPostRepo;
        this.emailService      = emailService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(Map.of(
            "comics",   comicRepo.count(),
            "chapters", chapterRepo.count(),
            "users",    userRepo.count()
        ));
    }

    @GetMapping("/comics/{id}")
    public ResponseEntity<Comic> getComic(@PathVariable Long id) {
        return comicRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/comics")
    public ResponseEntity<Comic> addComic(@RequestBody ComicRequest req) {
        Comic comic = Comic.builder()
                .title(req.getTitle()).author(req.getAuthor()).genre(req.getGenre())
                .tags(req.getTags())
                .description(req.getDescription()).coverImage(req.getCoverImage())
                .status(req.getStatus() != null ? req.getStatus() : Comic.Status.ONGOING)
                .build();
        return ResponseEntity.ok(comicRepo.save(comic));
    }

    @PutMapping("/comics/{id}")
    public ResponseEntity<?> updateComic(@PathVariable Long id, @RequestBody ComicRequest req) {
        Comic comic = comicRepo.findById(id).orElse(null);
        if (comic == null) return ResponseEntity.notFound().build();
        if (req.getTitle()       != null) comic.setTitle(req.getTitle());
        if (req.getAuthor()      != null) comic.setAuthor(req.getAuthor());
        if (req.getGenre()       != null) comic.setGenre(req.getGenre());
        // FIX: tags was missing from ComicRequest entirely, so even though the
        // frontend form now sends it, Spring silently dropped the unknown JSON
        // field and comic.tags was never updated — the admin UI "worked" but
        // nothing was actually saved. Added req.getTags() below + the field
        // itself to the DTO (see ComicRequest class).
        if (req.getTags()        != null) comic.setTags(req.getTags());
        if (req.getDescription() != null) comic.setDescription(req.getDescription());
        if (req.getCoverImage()  != null) comic.setCoverImage(req.getCoverImage());
        if (req.getStatus()      != null) comic.setStatus(req.getStatus());
        return ResponseEntity.ok(comicRepo.save(comic));
    }

    @DeleteMapping("/comics/{id}")
    @Transactional
    public ResponseEntity<?> deleteComic(@PathVariable Long id) {
        if (!comicRepo.existsById(id)) return ResponseEntity.notFound().build();
        bookmarkRepo.deleteByComicId(id);
        likeRepo.deleteByComicId(id);
        ratingRepo.deleteByComicId(id);
        commentRepo.deleteByComicId(id);
        notifRepo.deleteByReferenceId(id);
        chapterRepo.deleteByComicId(id);
        comicRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Comic and all related data deleted."));
    }

    // FIX [08]: @Valid activates constraint validation; @Size(max=500) on imageUrls
    // prevents OOM from unbounded list payloads.
    @PostMapping("/chapters")
    @Transactional
    public ResponseEntity<?> addChapter(@Valid @RequestBody ChapterRequest req) {
        Comic comic = comicRepo.findById(req.getComicId()).orElse(null);
        if (comic == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Comic not found: " + req.getComicId()));

        Chapter chapter = Chapter.builder()
                .comic(comic).chapterNumber(req.getChapterNumber())
                .title(req.getTitle()).pages(new ArrayList<>()).build();

        if (req.getImageUrls() != null) {
            List<ChapterPage> pages = new ArrayList<>();
            for (int i = 0; i < req.getImageUrls().size(); i++) {
                pages.add(ChapterPage.builder().chapter(chapter)
                        .pageNumber(i + 1).imageUrl(req.getImageUrls().get(i)).build());
            }
            chapter.setPages(pages);
        }
        Chapter saved = chapterRepo.save(chapter);

        try {
            bookmarkRepo.findByComicId(comic.getId()).forEach(bk ->
                notifRepo.save(Notification.builder()
                    .user(bk.getUser())
                    .message("New chapter " + req.getChapterNumber() + " added to " + comic.getTitle())
                    .type("NEW_CHAPTER").referenceId(saved.getId()).build()));
        } catch (Exception ignored) {}

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/chapters/{id}")
    @Transactional
    public ResponseEntity<?> deleteChapter(@PathVariable Long id) {
        if (!chapterRepo.existsById(id)) return ResponseEntity.notFound().build();
        chapterRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Chapter deleted."));
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers() { return ResponseEntity.ok(userRepo.findAll()); }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        try {
            user.setRole(User.Role.valueOf(body.get("role")));
            return ResponseEntity.ok(userRepo.save(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role."));
        }
    }

    @GetMapping("/announcements")
    public ResponseEntity<List<Announcement>> listAnnouncements() {
        return ResponseEntity.ok(announcementRepo.findAllForAdmin());
    }

    @PostMapping("/announcements")
    public ResponseEntity<Announcement> createAnnouncement(@RequestBody AnnouncementRequest req) {
        Announcement a = new Announcement();
        a.setTitle(req.getTitle()); a.setContent(req.getContent());
        a.setType(req.getType() != null ? req.getType() : "INFO");
        a.setActive(req.isActive()); a.setPinned(req.isPinned());
        if (req.getPublishAt() != null && !req.getPublishAt().isBlank())
            a.setPublishAt(java.time.LocalDateTime.parse(req.getPublishAt()));
        return ResponseEntity.ok(announcementRepo.save(a));
    }

    @PutMapping("/announcements/{id}")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id,
                                                 @RequestBody AnnouncementRequest req) {
        Announcement a = announcementRepo.findById(id).orElse(null);
        if (a == null) return ResponseEntity.notFound().build();
        if (req.getTitle()   != null) a.setTitle(req.getTitle());
        if (req.getContent() != null) a.setContent(req.getContent());
        if (req.getType()    != null) a.setType(req.getType());
        a.setActive(req.isActive()); a.setPinned(req.isPinned());
        if (req.getPublishAt() != null && !req.getPublishAt().isBlank())
            a.setPublishAt(java.time.LocalDateTime.parse(req.getPublishAt()));
        else
            a.setPublishAt(null);
        return ResponseEntity.ok(announcementRepo.save(a));
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        if (!announcementRepo.existsById(id)) return ResponseEntity.notFound().build();
        announcementRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Announcement deleted."));
    }

    @DeleteMapping("/community/posts/{id}")
    public ResponseEntity<?> deleteCommunityPost(@PathVariable Long id) {
        if (!communityPostRepo.existsById(id)) return ResponseEntity.notFound().build();
        communityPostRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Post deleted."));
    }

    @GetMapping("/contact")
    public ResponseEntity<?> listContactMessages(@RequestParam(defaultValue = "UNREAD") String status) {
        return ResponseEntity.ok(contactRepo.findByStatusOrderByCreatedAtDesc(status));
    }

    @PutMapping("/contact/{id}/status")
    public ResponseEntity<?> updateContactStatus(@PathVariable Long id, @RequestParam String status) {
        var msg = contactRepo.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.notFound().build();
        msg.setStatus(status.toUpperCase());
        contactRepo.save(msg);
        return ResponseEntity.ok(Map.of("message", "Status updated to " + status));
    }

    // ─── DTOs ─────────────────────────────────────────────────────────────
    public static class ComicRequest {
        private String title, author, genre, tags, description, coverImage;
        private Comic.Status status;
        public String getTitle()        { return title; }       public void setTitle(String t)        { this.title=t; }
        public String getAuthor()       { return author; }      public void setAuthor(String a)       { this.author=a; }
        public String getGenre()        { return genre; }       public void setGenre(String g)        { this.genre=g; }
        public String getTags()         { return tags; }        public void setTags(String t)         { this.tags=t; }
        public String getDescription()  { return description; } public void setDescription(String d)  { this.description=d; }
        public String getCoverImage()   { return coverImage; }  public void setCoverImage(String c)   { this.coverImage=c; }
        public Comic.Status getStatus() { return status; }      public void setStatus(Comic.Status s) { this.status=s; }
    }

    public static class ChapterRequest {
        @NotNull  private Long    comicId;
        @NotNull  private Integer chapterNumber;
        private String title;
        // FIX [08]: cap imageUrls to 500 entries max — prevents OOM from unbounded payloads.
        @Size(max = 500, message = "A chapter cannot have more than 500 pages.")
        private List<String> imageUrls;
        public Long    getComicId()          { return comicId; }       public void setComicId(Long c)          { this.comicId=c; }
        public Integer getChapterNumber()    { return chapterNumber; } public void setChapterNumber(Integer n) { this.chapterNumber=n; }
        public String  getTitle()            { return title; }         public void setTitle(String t)          { this.title=t; }
        public List<String> getImageUrls()   { return imageUrls; }     public void setImageUrls(List<String> u){ this.imageUrls=u; }
    }

    public static class AnnouncementRequest {
        private String title, content, type, publishAt;
        private boolean active = true, pinned = false;
        public String  getTitle()     { return title; }     public void setTitle(String t)     { this.title=t; }
        public String  getContent()   { return content; }   public void setContent(String c)   { this.content=c; }
        public String  getType()      { return type; }      public void setType(String t)       { this.type=t; }
        public boolean isActive()     { return active; }    public void setActive(boolean a)   { this.active=a; }
        public boolean isPinned()     { return pinned; }    public void setPinned(boolean p)   { this.pinned=p; }
        public String  getPublishAt() { return publishAt; } public void setPublishAt(String v) { this.publishAt=v; }
    }
}
