package com.fingerprint.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fingerprint.model.StoredTemplate;
import com.machinezoo.sourceafis.FingerprintImage;
import com.machinezoo.sourceafis.FingerprintMatcher;
import com.machinezoo.sourceafis.FingerprintTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Service
public class FingerprintService {

    private static final Logger logger = LoggerFactory.getLogger(FingerprintService.class);
    private static final double MATCH_THRESHOLD = 40.0; // SourceAFIS standard threshold

    @Value("${fingerprint.storage.file:data/templates.json}")
    private String storageFilePath;

    private final ObjectMapper objectMapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();

    // In-memory cache of stored templates: ID -> StoredTemplate
    private final Map<String, StoredTemplate> templateCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        loadTemplatesFromFile();
    }

    /**
     * Loads templates from the JSON storage file into memory.
     */
    public void loadTemplatesFromFile() {
        rwLock.writeLock().lock();
        try {
            File file = new File(storageFilePath);
            if (!file.exists()) {
                File parent = file.getParentFile();
                if (parent != null && !parent.exists()) {
                    parent.mkdirs();
                }
                saveTemplatesToFile(new ArrayList<>());
            } else {
                List<StoredTemplate> list = objectMapper.readValue(file, new TypeReference<List<StoredTemplate>>() {});
                templateCache.clear();
                for (StoredTemplate st : list) {
                    if (st.getId() != null && st.getTemplate() != null) {
                        templateCache.put(st.getId(), st);
                    }
                }
                logger.info("Loaded {} fingerprint templates from {}", templateCache.size(), storageFilePath);
            }
        } catch (Exception e) {
            logger.error("Error loading templates from file: {}", e.getMessage(), e);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    /**
     * Persists the current templates to the JSON file.
     */
    private void saveTemplatesToFile(List<StoredTemplate> templates) throws IOException {
        File file = new File(storageFilePath);
        File parent = file.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }
        objectMapper.writeValue(file, templates);
    }

    /**
     * Extracts an OpenAFIS FingerprintTemplate from an input image base64,
     * serializes the template, and saves it into templates.json with the given ID.
     * Note: The raw image is NEVER stored; only the extracted template is stored.
     */
    public Map<String, Object> enroll(String id, String imageBase64) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("User / Template ID cannot be empty");
        }
        id = id.trim();

        if (imageBase64 == null || imageBase64.trim().isEmpty()) {
            throw new IllegalArgumentException("Fingerprint image data is required");
        }

        byte[] imageBytes = decodeBase64Image(imageBase64);

        // Extract FingerprintTemplate using OpenAFIS (SourceAFIS)
        FingerprintImage image = new FingerprintImage().dpi(500).decode(imageBytes);
        FingerprintTemplate template = new FingerprintTemplate(image);

        // Serialize template to bytes (no image data is retained)
        byte[] templateBytes = template.toByteArray();
        String serializedTemplate = Base64.getEncoder().encodeToString(templateBytes);

        String timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now());
        StoredTemplate stored = new StoredTemplate(id, serializedTemplate, timestamp, templateBytes.length);

        rwLock.writeLock().lock();
        try {
            templateCache.put(id, stored);
            saveTemplatesToFile(new ArrayList<>(templateCache.values()));
            logger.info("Successfully enrolled template for ID '{}' into {}", id, storageFilePath);
        } catch (IOException e) {
            logger.error("Failed to persist template to JSON file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save template to JSON storage: " + e.getMessage());
        } finally {
            rwLock.writeLock().unlock();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", id);
        result.put("enrolledAt", timestamp);
        result.put("templateSizeBytes", templateBytes.length);
        result.put("totalTemplates", templateCache.size());
        return result;
    }

    /**
     * Matches a scanned fingerprint against all stored templates in templates.json.
     * Returns the matched ID and similarity score if matched, or false if not.
     */
    public Map<String, Object> match(String imageBase64) {
        if (imageBase64 == null || imageBase64.trim().isEmpty()) {
            throw new IllegalArgumentException("Fingerprint image data is required for matching");
        }

        byte[] imageBytes = decodeBase64Image(imageBase64);

        // Extract probe template from the acquired scan using OpenAFIS
        FingerprintImage probeImage = new FingerprintImage().dpi(500).decode(imageBytes);
        FingerprintTemplate probeTemplate = new FingerprintTemplate(probeImage);

        // Prepare OpenAFIS Matcher
        FingerprintMatcher matcher = new FingerprintMatcher(probeTemplate);

        String bestMatchId = null;
        double bestScore = 0.0;

        rwLock.readLock().lock();
        try {
            if (templateCache.isEmpty()) {
                Map<String, Object> resp = new HashMap<>();
                resp.put("matched", false);
                resp.put("id", null);
                resp.put("score", 0.0);
                resp.put("message", "No enrolled fingerprint templates exist in database");
                return resp;
            }

            // Compare probe against each candidate template stored in JSON file
            for (StoredTemplate candidate : templateCache.values()) {
                try {
                    byte[] candidateBytes = Base64.getDecoder().decode(candidate.getTemplate());
                    FingerprintTemplate candidateTemplate = new FingerprintTemplate(candidateBytes);

                    double score = matcher.match(candidateTemplate);
                    logger.debug("Compared with ID '{}' -> score: {}", candidate.getId(), score);

                    if (score > bestScore) {
                        bestScore = score;
                        bestMatchId = candidate.getId();
                    }
                } catch (Exception ex) {
                    logger.warn("Could not deserialize template for ID '{}': {}", candidate.getId(), ex.getMessage());
                }
            }
        } finally {
            rwLock.readLock().unlock();
        }

        boolean isMatched = bestScore >= MATCH_THRESHOLD;
        Map<String, Object> resp = new HashMap<>();
        resp.put("matched", isMatched);
        resp.put("id", isMatched ? bestMatchId : null);
        resp.put("score", Math.round(bestScore * 100.0) / 100.0);
        resp.put("threshold", MATCH_THRESHOLD);

        if (isMatched) {
            resp.put("message", "Fingerprint matched successfully with ID: " + bestMatchId);
        } else {
            resp.put("message", "No matching fingerprint found. (Best score: " + Math.round(bestScore * 10.0) / 10.0 + ")");
        }

        return resp;
    }

    /**
     * Lists all enrolled fingerprint IDs and metadata (without raw template strings).
     */
    public List<Map<String, Object>> getAllTemplates() {
        rwLock.readLock().lock();
        try {
            List<Map<String, Object>> list = new ArrayList<>();
            for (StoredTemplate st : templateCache.values()) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", st.getId());
                item.put("createdAt", st.getCreatedAt());
                item.put("minutiaeCount", st.getMinutiaeCount());
                list.add(item);
            }
            list.sort(Comparator.comparing(a -> String.valueOf(a.get("id"))));
            return list;
        } finally {
            rwLock.readLock().unlock();
        }
    }

    /**
     * Deletes a template by ID from the JSON file.
     */
    public boolean deleteTemplate(String id) {
        rwLock.writeLock().lock();
        try {
            if (templateCache.remove(id) != null) {
                saveTemplatesToFile(new ArrayList<>(templateCache.values()));
                logger.info("Deleted template ID '{}'", id);
                return true;
            }
            return false;
        } catch (IOException e) {
            logger.error("Failed to update templates.json after deletion: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete template: " + e.getMessage());
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    /**
     * Helper to decode Base64 dataURL or raw Base64 string into byte array.
     */
    private byte[] decodeBase64Image(String input) {
        String clean = input.trim();
        if (clean.contains(",")) {
            clean = clean.substring(clean.indexOf(",") + 1);
        }
        // Remove line breaks / whitespace
        clean = clean.replaceAll("\\s+", "");
        return Base64.getDecoder().decode(clean);
    }
}
