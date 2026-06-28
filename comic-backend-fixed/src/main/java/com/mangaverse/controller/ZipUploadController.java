package com.mangaverse.controller;

import com.mangaverse.entity.*;
import com.mangaverse.repository.*;
import com.mangaverse.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@RestController
@RequestMapping("/api/admin/chapters/zip")
public class ZipUploadController {

    private static final List<String> IMAGE_EXTS       = List.of(".jpg", ".jpeg", ".png", ".webp", ".gif");
    private static final long         MAX_ZIP_SIZE      = 200L * 1024 * 1024;  // 200 MB
    private static final long         MAX_UNCOMPRESSED  = 500L * 1024 * 1024;  // 500 MB zip-bomb cap
    private static final int          MAX_PAGES         = 500;                 // FIX [08]

    private final ChapterRepository      chapterRepo;
    private final ComicRepository        comicRepo;
    private final BookmarkRepository     bookmarkRepo;
    private final NotificationRepository notifRepo;
    private final EmailService           emailService;

    public ZipUploadController(ChapterRepository chapterRepo, ComicRepository comicRepo,
                                BookmarkRepository bookmarkRepo, NotificationRepository notifRepo,
                                EmailService emailService) {
        this.chapterRepo  = chapterRepo;  this.comicRepo   = comicRepo;
        this.bookmarkRepo = bookmarkRepo; this.notifRepo   = notifRepo;
        this.emailService = emailService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> uploadZip(
            @RequestParam("file")          MultipartFile zipFile,
            @RequestParam("comicId")       Long comicId,
            @RequestParam("chapterNumber") Integer chapterNumber,
            @RequestParam(value = "title", defaultValue = "") String title) {

        if (zipFile.isEmpty())              return bad("No file provided.");
        if (zipFile.getSize() > MAX_ZIP_SIZE) return bad("ZIP exceeds 200 MB limit.");
        String fname = zipFile.getOriginalFilename();
        if (fname == null || !fname.toLowerCase().endsWith(".zip"))
            return bad("File must be a .zip archive.");

        Comic comic = comicRepo.findById(comicId).orElse(null);
        if (comic == null) return bad("Comic not found: " + comicId);

        if (chapterRepo.existsByComicIdAndChapterNumber(comicId, chapterNumber))
            return bad("Chapter " + chapterNumber + " already exists for this comic.");

        try {
            Path tempDir = Files.createTempDirectory("mangaverse_zip_");
            Map<String, byte[]> imageData = new LinkedHashMap<>();
            long totalBytes = 0;

            try (ZipInputStream zis = new ZipInputStream(zipFile.getInputStream())) {
                ZipEntry entry;
                while ((entry = zis.getNextEntry()) != null) {
                    if (entry.isDirectory()) { zis.closeEntry(); continue; }

                    // Path-traversal guard: filename only + destination check.
                    String safeName = Paths.get(entry.getName()).getFileName().toString();
                    Path   dest     = tempDir.resolve(safeName).normalize();
                    if (!dest.startsWith(tempDir)) { zis.closeEntry(); continue; }

                    if (!hasImageExtension(safeName)) { zis.closeEntry(); continue; }

                    // FIX [08]: cap page count inside ZIP as well.
                    if (imageData.size() >= MAX_PAGES)
                        return bad("ZIP contains more than " + MAX_PAGES + " images.");

                    byte[] bytes = zis.readAllBytes();
                    totalBytes += bytes.length;
                    if (totalBytes > MAX_UNCOMPRESSED)
                        return bad("ZIP contents exceed 500 MB uncompressed limit.");

                    // FIX [07]: verify magic bytes — extension alone is not trustworthy.
                    if (!hasValidImageMagic(bytes))
                        return bad("File '" + safeName + "' is not a valid image (magic bytes mismatch).");

                    imageData.put(safeName, bytes);
                    zis.closeEntry();
                }
            }

            if (imageData.isEmpty()) return bad("No valid images found in ZIP. Supported: JPG, PNG, WEBP, GIF.");

            List<String> imageNames = imageData.keySet().stream()
                .sorted(Comparator.comparingInt(ZipUploadController::leadingNumber)
                    .thenComparing(Comparator.naturalOrder()))
                .collect(Collectors.toList());

            for (String name : imageNames)
                Files.write(tempDir.resolve(name).normalize(), imageData.get(name));

            Chapter chapter = new Chapter();
            chapter.setComic(comic);
            chapter.setChapterNumber(chapterNumber);
            chapter.setTitle(title.isBlank() ? "Chapter " + chapterNumber : title);
            chapter.setPages(new ArrayList<>());

            List<ChapterPage> pages = new ArrayList<>();
            for (int i = 0; i < imageNames.size(); i++) {
                ChapterPage page = new ChapterPage();
                page.setChapter(chapter);
                page.setPageNumber(i + 1);
                page.setImageUrl("zip://" + imageNames.get(i));
                pages.add(page);
            }
            chapter.setPages(pages);
            Chapter saved = chapterRepo.save(chapter);

            bookmarkRepo.findByComicId(comicId).forEach(bk -> {
                notifRepo.save(Notification.builder()
                    .user(bk.getUser()).type("CHAPTER_UPDATE")
                    .message("New chapter " + chapterNumber + " added to " + comic.getTitle())
                    .referenceId(saved.getId()).build());
                if (bk.getUser().getEmail() != null && !bk.getUser().getEmail().isBlank()) {
                    emailService.sendNewChapterNotification(
                        bk.getUser().getEmail(), bk.getUser().getUsername(),
                        comic.getTitle(), chapterNumber, comicId);
                }
            });

            return ResponseEntity.ok(Map.of(
                "chapterId",  saved.getId(),
                "totalPages", imageNames.size(),
                "pageNames",  imageNames,
                "message",    "Chapter " + chapterNumber + " created with " + imageNames.size() + " pages."
            ));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to process ZIP: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/pages")
    public ResponseEntity<?> updatePageUrls(@PathVariable Long id,
                                             @RequestBody List<String> imageUrls) {
        // FIX [08]: cap list size on the manual PUT path as well.
        if (imageUrls == null || imageUrls.size() > MAX_PAGES)
            return ResponseEntity.badRequest()
                .body(Map.of("error", "imageUrls must contain between 1 and " + MAX_PAGES + " entries."));

        Chapter chapter = chapterRepo.findById(id).orElse(null);
        if (chapter == null) return ResponseEntity.notFound().build();

        List<ChapterPage> pages = chapter.getPages();
        for (int i = 0; i < Math.min(pages.size(), imageUrls.size()); i++)
            pages.get(i).setImageUrl(imageUrls.get(i));
        chapterRepo.save(chapter);
        return ResponseEntity.ok(Map.of("updated", Math.min(pages.size(), imageUrls.size())));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private static boolean hasImageExtension(String name) {
        String lower = name.toLowerCase();
        return IMAGE_EXTS.stream().anyMatch(lower::endsWith);
    }

    /**
     * FIX [07]: verify file magic bytes — the only reliable signal of true file type.
     * Extensions and MIME types are controlled by the uploader and cannot be trusted.
     *
     * Signatures checked:
     *   JPEG  → FF D8 FF
     *   PNG   → 89 50 4E 47 0D 0A 1A 0A
     *   GIF   → 47 49 46 38 (GIF8)
     *   WEBP  → 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
     */
    private static boolean hasValidImageMagic(byte[] bytes) {
        if (bytes == null || bytes.length < 12) return false;
        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF &&
            (bytes[1] & 0xFF) == 0xD8 &&
            (bytes[2] & 0xFF) == 0xFF) return true;
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89 &&
            (bytes[1] & 0xFF) == 0x50 &&
            (bytes[2] & 0xFF) == 0x4E &&
            (bytes[3] & 0xFF) == 0x47) return true;
        // GIF: 47 49 46 38
        if ((bytes[0] & 0xFF) == 0x47 &&
            (bytes[1] & 0xFF) == 0x49 &&
            (bytes[2] & 0xFF) == 0x46 &&
            (bytes[3] & 0xFF) == 0x38) return true;
        // WEBP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
        if ((bytes[0] & 0xFF) == 0x52 &&
            (bytes[1] & 0xFF) == 0x49 &&
            (bytes[2] & 0xFF) == 0x46 &&
            (bytes[3] & 0xFF) == 0x46 &&
            (bytes[8]  & 0xFF) == 0x57 &&
            (bytes[9]  & 0xFF) == 0x45 &&
            (bytes[10] & 0xFF) == 0x42 &&
            (bytes[11] & 0xFF) == 0x50) return true;
        return false;
    }

    private static int leadingNumber(String name) {
        try {
            String digits = name.replaceAll("[^0-9].*", "").replaceAll("\\D", "");
            return digits.isEmpty() ? Integer.MAX_VALUE : Integer.parseInt(digits);
        } catch (NumberFormatException e) { return Integer.MAX_VALUE; }
    }

    private ResponseEntity<Map<String, String>> bad(String msg) {
        return ResponseEntity.badRequest().body(Map.of("error", msg));
    }
}
