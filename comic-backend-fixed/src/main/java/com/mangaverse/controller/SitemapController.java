package com.mangaverse.controller;

import com.mangaverse.entity.Comic;
import com.mangaverse.repository.ComicRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
public class SitemapController {

    private final ComicRepository comicRepo;

    // Configure via app.frontend.url (set to your production domain in application.properties / env)
    @Value("${app.frontend.url:http://localhost:5173}")
    private String baseUrl;

    private static final DateTimeFormatter ISO = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final String[] GENRES = {
        "action","adventure","fantasy","romance","horror","comedy",
        "sci-fi","drama","slice-of-life","mystery","thriller","sports","historical"
    };

    public SitemapController(ComicRepository comicRepo) {
        this.comicRepo = comicRepo;
    }

    /** GET /sitemap.xml — auto-generated sitemap for all comics, genres and authors */
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        List<Comic> comics = comicRepo.findAll(Sort.by("id").descending());
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Static pages
        for (String path : new String[]{"", "/browse", "/community", "/faq", "/contact", "/announcements"}) {
            sb.append("  <url>\n");
            sb.append("    <loc>").append(baseUrl).append(path).append("</loc>\n");
            sb.append("    <changefreq>daily</changefreq>\n");
            sb.append("    <priority>").append(path.isEmpty() ? "1.0" : "0.7").append("</priority>\n");
            sb.append("  </url>\n");
        }

        // Genre landing pages
        for (String genre : GENRES) {
            sb.append("  <url>\n");
            sb.append("    <loc>").append(baseUrl).append("/genre/").append(genre).append("</loc>\n");
            sb.append("    <changefreq>daily</changefreq>\n");
            sb.append("    <priority>0.6</priority>\n");
            sb.append("  </url>\n");
        }

        // Author pages — collect distinct, non-blank author names from comics
        Set<String> authors = new LinkedHashSet<>();
        for (Comic c : comics) {
            if (c.getAuthor() != null && !c.getAuthor().isBlank()) {
                authors.add(c.getAuthor().trim());
            }
        }
        for (String author : authors) {
            sb.append("  <url>\n");
            sb.append("    <loc>").append(baseUrl).append("/author/")
              .append(URLEncoder.encode(author, StandardCharsets.UTF_8)).append("</loc>\n");
            sb.append("    <changefreq>weekly</changefreq>\n");
            sb.append("    <priority>0.5</priority>\n");
            sb.append("  </url>\n");
        }

        // Comic detail pages
        for (Comic c : comics) {
            sb.append("  <url>\n");
            sb.append("    <loc>").append(baseUrl).append("/comic/").append(c.getId()).append("</loc>\n");
            if (c.getUpdatedAt() != null) {
                sb.append("    <lastmod>").append(c.getUpdatedAt().format(ISO)).append("</lastmod>\n");
            }
            sb.append("    <changefreq>weekly</changefreq>\n");
            sb.append("    <priority>0.8</priority>\n");
            sb.append("  </url>\n");
        }

        sb.append("</urlset>");
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=3600")
            .body(sb.toString());
    }

    /** GET /robots.txt */
    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> robots() {
        return ResponseEntity.ok(
            "User-agent: *\n" +
            "Allow: /\n" +
            "Disallow: /admin\n" +
            "Disallow: /api/\n" +
            "Sitemap: " + baseUrl + "/sitemap.xml\n"
        );
    }
}
