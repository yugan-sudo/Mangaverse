package com.mangaverse.repository;

import com.mangaverse.entity.Comic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.time.LocalDateTime;

public interface ComicRepository extends JpaRepository<Comic, Long> {

    // Used by main browse grid (with genre + tag + status + text filter)
    @Query("""
        SELECT c FROM Comic c
        WHERE (:q     IS NULL OR LOWER(c.title)  LIKE LOWER(CONCAT('%',:q,'%'))
                              OR LOWER(c.author) LIKE LOWER(CONCAT('%',:q,'%')))
        AND   (:genre IS NULL OR LOWER(c.genre)  LIKE LOWER(CONCAT('%',:genre,'%')))
        AND   (:tag   IS NULL OR LOWER(c.tags)   LIKE LOWER(CONCAT('%',:tag,'%')))
        AND   (:statusEnum IS NULL OR c.status = :statusEnum)
    """)
    Page<Comic> searchWithFilter(@Param("q")          String q,
                                  @Param("genre")      String genre,
                                  @Param("tag")        String tag,
                                  @Param("statusEnum") com.mangaverse.entity.Comic.Status statusEnum,
                                  Pageable pageable);

    // Used by search suggestions — returns only id, title, genre, coverImage (fast)
    @Query("""
        SELECT c FROM Comic c
        WHERE LOWER(c.title)  LIKE LOWER(CONCAT('%',:q,'%'))
           OR LOWER(c.author) LIKE LOWER(CONCAT('%',:q,'%'))
        ORDER BY c.title ASC
    """)
    List<Comic> findSuggestions(@Param("q") String q, Pageable pageable);

    // Analytics: count per genre
    @Query("SELECT c.genre, COUNT(c) FROM Comic c GROUP BY c.genre ORDER BY COUNT(c) DESC")
    List<Object[]> countByGenre();

    // Analytics: comics created in last N days
    @Query("SELECT FUNCTION('DATE', c.createdAt), COUNT(c) FROM Comic c WHERE c.createdAt >= :since GROUP BY FUNCTION('DATE', c.createdAt) ORDER BY FUNCTION('DATE', c.createdAt)")
    List<Object[]> countByDay(@Param("since") java.time.LocalDateTime since);

}
