package com.fingerprint.controller;

import com.fingerprint.model.ApiResponse;
import com.fingerprint.model.EnrollRequest;
import com.fingerprint.model.MatchRequest;
import com.fingerprint.service.FingerprintService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        return ResponseEntity.ok(ApiResponse.ok("Fingerprint OpenAFIS + AES-256-GCM Backend is running"));
    }

    /**
     * Enrolls an employee's fingerprint:
     * Extracts OpenAFIS template, encrypts via AES-256-GCM with secure random IV,
     * and saves into NeonDB.
     */
    @PostMapping("/enroll")
    public ResponseEntity<ApiResponse> enroll(@RequestBody EnrollRequest request) {
        try {
            String employeeId = request.getId();
            if (employeeId == null || employeeId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Employee ID or email cannot be empty"));
            }
            if (request.getImage() == null || request.getImage().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Fingerprint image data is required"));
            }

            Map<String, Object> result = fingerprintService.enroll(employeeId, request.getImage());
            return ResponseEntity.ok(ApiResponse.ok("Fingerprint successfully encrypted with AES-256-GCM and enrolled", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to enroll fingerprint: " + e.getMessage()));
        }
    }

    /**
     * Biometric punch terminal endpoint:
     * Matches scanned fingerprint against AES-256-GCM encrypted templates in NeonDB.
     * Decrypts candidate template in-memory strictly for SourceAFIS matching.
     * If matched:
     *   - If currently punched out → Punch In
     *   - If currently punched in → Punch Out
     * Updates NeonDB attendance table.
     * If no match: returns "No user exists".
     */
    @PostMapping("/punch")
    public ResponseEntity<ApiResponse> punch(@RequestBody MatchRequest request) {
        try {
            if (request.getImage() == null || request.getImage().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Fingerprint image data is required for matching"));
            }

            String identifier = request.getEmployeeCode();
            if (identifier == null || identifier.trim().isEmpty()) {
                identifier = request.getEmployeeId();
            }

            Map<String, Object> result = fingerprintService.punchAttendance(identifier, request.getImage());
            boolean matched = Boolean.TRUE.equals(result.get("matched"));
            String message = (String) result.get("message");

            return ResponseEntity.ok(new ApiResponse(matched, message, result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Biometric matching failed: " + e.getMessage()));
        }
    }

    /**
     * Alias for punch endpoint to preserve compatibility with existing frontend calls.
     */
    @PostMapping("/match")
    public ResponseEntity<ApiResponse> match(@RequestBody MatchRequest request) {
        return punch(request);
    }

    /**
     * Checks if an employee has an enrolled fingerprint template in NeonDB.
     */
    @GetMapping("/status/{employeeId}")
    public ResponseEntity<ApiResponse> getFingerprintStatus(@PathVariable String employeeId) {
        try {
            boolean enrolled = fingerprintService.hasFingerprint(employeeId);
            Map<String, Object> data = Map.of(
                    "employeeId", employeeId,
                    "enrolled", enrolled
            );
            return ResponseEntity.ok(ApiResponse.ok(enrolled ? "Fingerprint enrolled" : "Fingerprint not enrolled", data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to check fingerprint status: " + e.getMessage()));
        }
    }

    /**
     * Retrieves today's attendance punch status for an employee.
     */
    @GetMapping("/attendance-status/{employeeId}")
    public ResponseEntity<ApiResponse> getAttendanceStatus(@PathVariable String employeeId) {
        try {
            Map<String, Object> status = fingerprintService.getTodayAttendanceStatus(employeeId);
            return ResponseEntity.ok(ApiResponse.ok("Attendance status retrieved", status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve attendance status: " + e.getMessage()));
        }
    }

    /**
     * Deletes an enrolled fingerprint template by employee ID.
     */
    @DeleteMapping("/templates/{employeeId}")
    public ResponseEntity<ApiResponse> deleteTemplate(@PathVariable String employeeId) {
        try {
            boolean deleted = fingerprintService.deleteFingerprint(employeeId);
            if (deleted) {
                return ResponseEntity.ok(ApiResponse.ok("Biometric template deleted successfully for employee: " + employeeId));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("No template found for employee: " + employeeId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete template: " + e.getMessage()));
        }
    }
}
