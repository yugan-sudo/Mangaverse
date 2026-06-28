package com.mangaverse.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Catches /api/comics/undefined — returns 400 instead of 500 */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String param = ex.getName();
        String value = ex.getValue() != null ? ex.getValue().toString() : "null";
        return ResponseEntity.badRequest().body(Map.of(
            "error",   "Invalid parameter",
            "param",   param,
            "value",   value,
            "message", "Expected a numeric ID but received: \"" + value + "\""
        ));
    }

    /** Catches 404 resource not found */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.status(404).body(Map.of("error", "Not found", "path", ex.getResourcePath()));
    }

    /** Catches generic runtime exceptions */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {
        return ResponseEntity.internalServerError().body(Map.of(
            "error",   "Internal server error",
            "message", ex.getMessage() != null ? ex.getMessage() : "Unknown error"
        ));
    }
}
