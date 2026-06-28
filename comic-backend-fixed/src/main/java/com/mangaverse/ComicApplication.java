package com.mangaverse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

@SpringBootApplication
@EnableAsync
@EnableCaching
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
public class ComicApplication {
    public static void main(String[] args) {
        SpringApplication.run(ComicApplication.class, args);
    }
}
