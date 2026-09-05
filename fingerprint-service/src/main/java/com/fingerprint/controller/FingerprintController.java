package com.fingerprint.controller;

import com.fingerprint.model.ApiResponse;
import com.fingerprint.model.EnrollRequest;
import com.fingerprint.model.MatchRequest;
import com.fingerprint.service.FingerprintService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fingerprint")
@CrossOrigin(origins = "*")
public class FingerprintController {

    private final FingerprintService fingerprintService;

    public FingerprintController(FingerprintService fingerprintService) {
        this.fingerprintService = fingerprintService;
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse> health() {
        return ResponseEntity.ok(ApiResponse.ok("Fingerprint OpenAFIS Backend is running"));
    }

    /**
     * Enrolls a new fingerprint scan: extracts OpenAFIS template and stores it in templates.json.
     * Raw image is NOT stored.
     */
    @PostMapping("/enroll")
    public ResponseEntity<ApiResponse> enroll(@RequestBody EnrollRequest request) {
        try {
            if (request.getId() == null || request.getId().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Template / User ID cannot be empty"));
            }
            if (request.getImage() == null || request.getImage().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Fingerprint image data is required"));
            }

            Map<String, Object> result = fingerprintService.enroll(request.getId(), request.getImage());
            return ResponseEntity.ok(ApiResponse.ok("Fingerprint template successfully extracted and enrolled", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to enroll fingerprint: " + e.getMessage()));
        }
    }

    /**
     * Matches a fingerprint scan against all templates stored in templates.json.
     */
    @PostMapping("/match")
    public ResponseEntity<ApiResponse> match(@RequestBody MatchRequest request) {
        try {
            if (request.getImage() == null || request.getImage().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Fingerprint image data is required for matching"));
            }

            Map<String, Object> result = fingerprintService.match(request.getImage());
            boolean matched = Boolean.TRUE.equals(result.get("matched"));
            String message = (String) result.get("message");

            return ResponseEntity.ok(new ApiResponse(matched, message, result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to perform fingerprint match: " + e.getMessage()));
        }
    }

    /**
     * Lists all enrolled fingerprint templates (IDs and metadata).
     */
    @GetMapping("/templates")
    public ResponseEntity<ApiResponse> getAllTemplates() {
        try {
            List<Map<String, Object>> templates = fingerprintService.getAllTemplates();
            return ResponseEntity.ok(ApiResponse.ok("Templates retrieved successfully", templates));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve templates: " + e.getMessage()));
        }
    }

    /**
     * Deletes an enrolled fingerprint template by ID.
     */
    @DeleteMapping("/templates/{id}")
    public ResponseEntity<ApiResponse> deleteTemplate(@PathVariable String id) {
        try {
            boolean deleted = fingerprintService.deleteTemplate(id);
            if (deleted) {
                return ResponseEntity.ok(ApiResponse.ok("Template deleted successfully for ID: " + id));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Template not found for ID: " + id));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete template: " + e.getMessage()));
        }
    }
}
