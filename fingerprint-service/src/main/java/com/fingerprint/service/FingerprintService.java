package com.fingerprint.service;

import com.fingerprint.service.FingerprintCryptoService.EncryptedResult;
import com.machinezoo.sourceafis.FingerprintImage;
import com.machinezoo.sourceafis.FingerprintMatcher;
import com.machinezoo.sourceafis.FingerprintTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalTime;
import java.util.*;

@Service
public class FingerprintService {

    private static final Logger logger = LoggerFactory.getLogger(FingerprintService.class);
    private static final double MATCH_THRESHOLD = 30.0; // SourceAFIS matching threshold
    private static final java.time.ZoneId IST_ZONE = java.time.ZoneId.of("Asia/Kolkata");

    private final JdbcTemplate jdbcTemplate;
    private final FingerprintCryptoService cryptoService;

    public FingerprintService(JdbcTemplate jdbcTemplate, FingerprintCryptoService cryptoService) {
        this.jdbcTemplate = jdbcTemplate;
        this.cryptoService = cryptoService;
    }

    /**
     * Enrolls an employee's fingerprint:
     * 1. Extracts OpenAFIS template from image.
     * 2. Encrypts template with AES-256-GCM (secure random IV).
     * 3. Stores encrypted template + IV + key_version in NeonDB `fingerprint` table.
     * 4. Plaintext image & template are never stored or logged.
     */
    public Map<String, Object> enroll(String employeeIdentifier, String imageBase64) {
        if (employeeIdentifier == null || employeeIdentifier.trim().isEmpty()) {
            throw new IllegalArgumentException("Employee ID or email is required");
        }
        if (imageBase64 == null || imageBase64.trim().isEmpty()) {
            throw new IllegalArgumentException("Fingerprint image data is required");
        }

        String employeeId = resolveEmployeeId(employeeIdentifier.trim());
        if (employeeId == null) {
            throw new IllegalArgumentException("Employee not found for identifier: " + employeeIdentifier);
        }

        byte[] imageBytes = decodeBase64Image(imageBase64);

        // Extract FingerprintTemplate using OpenAFIS
        FingerprintImage image = new FingerprintImage().dpi(500).decode(imageBytes);
        FingerprintTemplate template = new FingerprintTemplate(image);
        byte[] templateBytes = template.toByteArray();

        // Encrypt template using AES-256-GCM
        EncryptedResult encrypted = cryptoService.encrypt(templateBytes);
        cryptoService.wipe(templateBytes); // Wipe unencrypted template from memory

        // Store encrypted template into NeonDB
        String upsertSql = """
            INSERT INTO fingerprint (employee_id, encryted_template, iv, key_version, updated_at)
            VALUES (?::uuid, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (employee_id) DO UPDATE SET
                encryted_template = EXCLUDED.encryted_template,
                iv = EXCLUDED.iv,
                key_version = EXCLUDED.key_version,
                updated_at = CURRENT_TIMESTAMP
            """;

        jdbcTemplate.update(upsertSql, employeeId, encrypted.cipherTextBase64(), encrypted.ivBase64(), encrypted.keyVersion());
        logger.info("Successfully enrolled AES-256-GCM encrypted fingerprint for employeeId: {}", employeeId);

        Map<String, Object> result = new HashMap<>();
        result.put("employeeId", employeeId);
        result.put("enrolled", true);
        result.put("keyVersion", encrypted.keyVersion());
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    /**
     * Checks whether an employee has a registered fingerprint template in NeonDB.
     */
    public boolean hasFingerprint(String employeeIdentifier) {
        String employeeId = resolveEmployeeId(employeeIdentifier);
        if (employeeId == null) return false;

        String sql = "SELECT COUNT(*) FROM fingerprint WHERE employee_id = ?::uuid";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, employeeId);
        return count != null && count > 0;
    }

    /**
     * Performs biometric match (1:N) and Punch In / Punch Out:
     * 1. Decodes probe image and generates probe template.
     * 2. Reads all encrypted templates from NeonDB.
     * 3. Decrypts candidate template in-memory strictly for SourceAFIS comparison, wiping buffer immediately.
     * 4. If matched employee found:
     *    - If currently punched out → Punch In
     *    - If currently punched in → Punch Out
     *    - Updates NeonDB `attendance` table.
     * 5. If no match found: returns "No user exists".
     */
    public Map<String, Object> punchAttendance(String imageBase64) {
        if (imageBase64 == null || imageBase64.trim().isEmpty()) {
            throw new IllegalArgumentException("Fingerprint image data is required for matching");
        }

        byte[] probeBytes = decodeBase64Image(imageBase64);
        FingerprintImage probeImage = new FingerprintImage().dpi(500).decode(probeBytes);
        FingerprintTemplate probeTemplate = new FingerprintTemplate(probeImage);
        FingerprintMatcher matcher = new FingerprintMatcher(probeTemplate);

        // Fetch all enrolled encrypted templates from NeonDB
        String querySql = "SELECT employee_id, encryted_template, iv, key_version FROM fingerprint";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(querySql);

        if (rows.isEmpty()) {
            Map<String, Object> notFound = new HashMap<>();
            notFound.put("success", false);
            notFound.put("matched", false);
            notFound.put("score", 0.0);
            notFound.put("message", "No user exists");
            notFound.put("announcement", "No user exists");
            return notFound;
        }

        String matchedEmployeeId = null;
        double bestScore = 0.0;

        for (Map<String, Object> row : rows) {
            String empId = String.valueOf(row.get("employee_id"));
            String cipherText = (String) row.get("encryted_template");
            String iv = (String) row.get("iv");
            String keyVersion = (String) row.get("key_version");

            if (cipherText == null || iv == null) continue;

            byte[] decryptedTemplate = null;
            try {
                // In-memory AES-256-GCM Decryption
                decryptedTemplate = cryptoService.decrypt(cipherText, iv, keyVersion);
                FingerprintTemplate candidateTemplate = new FingerprintTemplate(decryptedTemplate);

                double score = matcher.match(candidateTemplate);
                logger.info("Biometric match evaluated for employee {}: score = {}", empId, score);
                if (score > bestScore) {
                    bestScore = score;
                    if (score >= MATCH_THRESHOLD) {
                        matchedEmployeeId = empId;
                    }
                }
            } catch (Exception e) {
                logger.error("Could not match template for candidate employee {}: {}", empId, e.getMessage(), e);
            } finally {
                if (decryptedTemplate != null) {
                    cryptoService.wipe(decryptedTemplate); // Wipe decrypted plaintext from memory
                }
            }
        }

        if (matchedEmployeeId == null || bestScore < MATCH_THRESHOLD) {
            logger.info("Fingerprint match failed. Best score: {}. Threshold: {}", bestScore, MATCH_THRESHOLD);
            Map<String, Object> notFound = new HashMap<>();
            notFound.put("success", false);
            notFound.put("matched", false);
            notFound.put("score", Math.round(bestScore * 10.0) / 10.0);
            notFound.put("message", "No user exists");
            notFound.put("announcement", "No user exists");
            return notFound;
        }

        // Matched! Now execute Punch In / Punch Out in NeonDB attendance
        return executePunch(matchedEmployeeId, bestScore);
    }

    /**
     * Executes Punch In or Punch Out for a verified employee in NeonDB.
     */
    private Map<String, Object> executePunch(String employeeId, double score) {
        // Fetch employee details from users table joined via employees.user_id
        String empSql = """
            SELECT e.id, u.email,
                   COALESCE(u.first_name, 'Employee') as first_name,
                   COALESCE(u.last_name, 'User') as last_name
            FROM employees e
            JOIN users u ON e.user_id = u.id
            WHERE e.id = ?::uuid
            LIMIT 1
            """;

        List<Map<String, Object>> empList = jdbcTemplate.queryForList(empSql, employeeId);
        String employeeName = "Employee";
        String employeeEmail = "";
        if (!empList.isEmpty()) {
            Map<String, Object> emp = empList.get(0);
            employeeName = emp.get("first_name") + " " + emp.get("last_name");
            employeeEmail = emp.get("email") != null ? (String) emp.get("email") : "";
        }

        // Query today's attendance record in Indian Standard Time (Asia/Kolkata)
        java.time.LocalDate todayIst = java.time.LocalDate.now(IST_ZONE);
        java.sql.Date todaySqlDate = java.sql.Date.valueOf(todayIst);

        String attSql = """
            SELECT id, check_in, check_out, status, worked_hours
            FROM attendance
            WHERE employee_id = ?::uuid AND date = ?
            LIMIT 1
            """;

        List<Map<String, Object>> attList = jdbcTemplate.queryForList(attSql, employeeId, todaySqlDate);

        String action;
        String status;
        Instant now = Instant.now();
        Timestamp nowTs = Timestamp.from(now);
        BigDecimal workedHours = BigDecimal.ZERO;
        String checkInStr = null;
        String checkOutStr = null;

        if (attList.isEmpty()) {
            // Case 1: Not checked in today -> INSERT PUNCH IN
            action = "PUNCH_IN";
            LocalTime localTime = LocalTime.now(IST_ZONE);
            boolean isLate = localTime.isAfter(LocalTime.of(9, 30));
            status = isLate ? "Late" : "Present";
            checkInStr = now.toString();

            String insertSql = """
                INSERT INTO attendance (employee_id, date, check_in, check_out, worked_hours, status, is_manual_edit, created_at, updated_at)
                VALUES (?::uuid, ?, ?, NULL, 0.0, ?, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """;
            jdbcTemplate.update(insertSql, employeeId, todaySqlDate, nowTs, status);
            logger.info("Employee {} punched in at {} with status {}", employeeName, now, status);
        } else {
            Map<String, Object> record = attList.get(0);
            String attId = String.valueOf(record.get("id"));
            Timestamp checkInTs = (Timestamp) record.get("check_in");
            Timestamp checkOutTs = (Timestamp) record.get("check_out");

            if (checkInTs == null) {
                // Not checked in yet -> PUNCH IN
                action = "PUNCH_IN";
                LocalTime localTime = LocalTime.now(IST_ZONE);
                boolean isLate = localTime.isAfter(LocalTime.of(9, 30));
                status = isLate ? "Late" : "Present";
                checkInStr = now.toString();

                String updateSql = """
                    UPDATE attendance
                    SET check_in = ?, check_out = NULL, worked_hours = 0.0, status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?::uuid
                    """;
                jdbcTemplate.update(updateSql, nowTs, status, attId);
                logger.info("Employee {} punched in at {} with status {}", employeeName, now, status);
            } else if (checkOutTs == null) {
                // Case 2: Punched in, not yet punched out -> PUNCH OUT
                action = "PUNCH_OUT";
                checkInStr = checkInTs.toInstant().toString();
                checkOutStr = now.toString();

                long diffMs = Math.max(0, nowTs.getTime() - checkInTs.getTime());
                double hoursDouble = diffMs / (1000.0 * 60 * 60);
                workedHours = BigDecimal.valueOf(hoursDouble).setScale(2, RoundingMode.HALF_UP);

                status = String.valueOf(record.get("status"));
                if (workedHours.compareTo(BigDecimal.valueOf(8.5)) > 0) {
                    status = "Overtime";
                } else if (workedHours.compareTo(BigDecimal.valueOf(4.0)) < 0) {
                    status = "Half-day";
                }

                String updateSql = """
                    UPDATE attendance
                    SET check_out = ?, worked_hours = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?::uuid
                    """;
                jdbcTemplate.update(updateSql, nowTs, workedHours, status, attId);
                logger.info("Employee {} punched out at {} (worked {} hrs)", employeeName, now, workedHours);
            } else {
                // Case 3: Punched out previously today -> Re-Punch In
                action = "PUNCH_IN";
                status = "Present";
                checkInStr = now.toString();

                String rePunchSql = """
                    UPDATE attendance
                    SET check_in = ?, check_out = NULL, worked_hours = 0.0, status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?::uuid
                    """;
                jdbcTemplate.update(rePunchSql, nowTs, status, attId);
                logger.info("Employee {} re-punched in at {}", employeeName, now);
            }
        }

        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)
            .withZone(IST_ZONE);
        String timeStr = timeFormatter.format(now);

        String announcement = action.equals("PUNCH_IN")
            ? "Welcome " + employeeName + "! Punched in at " + timeStr
            : "Goodbye " + employeeName + "! Punched out at " + timeStr;

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("matched", true);
        response.put("action", action);
        response.put("employeeId", employeeId);
        response.put("employeeName", employeeName);
        response.put("employeeEmail", employeeEmail);
        response.put("status", status);
        response.put("checkIn", checkInStr);
        response.put("checkOut", checkOutStr);
        response.put("time", timeStr);
        response.put("announcement", announcement);
        response.put("workedHours", workedHours);

        double normalizedScore = score;
        if (normalizedScore > 100.0) {
            normalizedScore = Math.min(99.4, 80.0 + (score - 40.0) / 10.0);
        } else if (normalizedScore < 70.0) {
            normalizedScore = Math.max(72.0, normalizedScore);
        }
        response.put("score", Math.round(normalizedScore * 10.0) / 10.0);
        response.put("message", action.equals("PUNCH_IN") ? "Successfully Punched In" : "Successfully Punched Out");

        return response;
    }

    /**
     * Retrieves today's attendance status for an employee.
     */
    public Map<String, Object> getTodayAttendanceStatus(String employeeIdentifier) {
        String employeeId = resolveEmployeeId(employeeIdentifier);
        Map<String, Object> status = new HashMap<>();
        status.put("employeeId", employeeId);
        status.put("hasFingerprint", hasFingerprint(employeeIdentifier));

        if (employeeId == null) {
            status.put("punchedIn", false);
            return status;
        }

        java.time.LocalDate todayIst = java.time.LocalDate.now(IST_ZONE);
        String sql = """
            SELECT check_in, check_out, status, worked_hours
            FROM attendance
            WHERE employee_id = ?::uuid AND date = ?
            LIMIT 1
            """;

        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, employeeId, java.sql.Date.valueOf(todayIst));
        if (list.isEmpty() || list.get(0).get("check_in") == null) {
            status.put("punchedIn", false);
            status.put("checkIn", null);
            status.put("checkOut", null);
            status.put("status", "Not Punched In");
        } else {
            Map<String, Object> rec = list.get(0);
            boolean isPunchedIn = rec.get("check_out") == null;
            status.put("punchedIn", isPunchedIn);
            status.put("checkIn", rec.get("check_in") != null ? rec.get("check_in").toString() : null);
            status.put("checkOut", rec.get("check_out") != null ? rec.get("check_out").toString() : null);
            status.put("workedHours", rec.get("worked_hours"));
            status.put("status", rec.get("status"));
        }

        return status;
    }

    /**
     * Deletes an employee's enrolled fingerprint.
     */
    public boolean deleteFingerprint(String employeeIdentifier) {
        String employeeId = resolveEmployeeId(employeeIdentifier);
        if (employeeId == null) return false;

        String sql = "DELETE FROM fingerprint WHERE employee_id = ?::uuid";
        return jdbcTemplate.update(sql, employeeId) > 0;
    }

    /**
     * Resolves an employee identifier (UUID or email) to an employee UUID.
     */
    private String resolveEmployeeId(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) return null;
        String clean = identifier.trim();

        // Check if already a valid UUID (could be employees.id or users.id)
        if (clean.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
            // Check if it directly matches an employee id
            String checkEmp = "SELECT id FROM employees WHERE id = ?::uuid LIMIT 1";
            List<String> empList = jdbcTemplate.query(checkEmp, (rs, rowNum) -> rs.getString("id"), clean);
            if (!empList.isEmpty()) {
                return empList.get(0);
            }

            // Check if it matches a user id mapped to an employee
            String checkUser = "SELECT id FROM employees WHERE user_id = ?::uuid LIMIT 1";
            List<String> userEmpList = jdbcTemplate.query(checkUser, (rs, rowNum) -> rs.getString("id"), clean);
            if (!userEmpList.isEmpty()) {
                return userEmpList.get(0);
            }

            return clean;
        }

        // Look up by email in users table joined to employees
        String query = """
            SELECT e.id
            FROM employees e
            JOIN users u ON e.user_id = u.id
            WHERE LOWER(u.email) = LOWER(?)
            LIMIT 1
            """;
        List<String> list = jdbcTemplate.query(query, (rs, rowNum) -> rs.getString("id"), clean);
        return list.isEmpty() ? null : list.get(0);
    }

    /**
     * Decodes a base64 image string or dataURL into raw bytes.
     */
    private byte[] decodeBase64Image(String input) {
        String clean = input.trim();
        if (clean.contains(",")) {
            clean = clean.substring(clean.indexOf(",") + 1);
        }
        clean = clean.replaceAll("\\s+", "");
        return Base64.getDecoder().decode(clean);
    }
}
