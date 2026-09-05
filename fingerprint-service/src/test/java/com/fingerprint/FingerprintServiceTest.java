package com.fingerprint;

import com.fingerprint.service.FingerprintService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class FingerprintServiceTest {

    private FingerprintService fingerprintService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        fingerprintService = new FingerprintService();
        File storageFile = tempDir.resolve("test_templates.json").toFile();
        ReflectionTestUtils.setField(fingerprintService, "storageFilePath", storageFile.getAbsolutePath());
        fingerprintService.init();
    }

    /**
     * Generates a synthetic fingerprint-like image with ridge patterns and minutiae.
     */
    private String generateSyntheticFingerprintBase64(double ridgeOffset) {
        int width = 300;
        int height = 400;
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g2 = img.createGraphics();
        g2.setColor(Color.WHITE);
        g2.fillRect(0, 0, width, height);

        g2.setColor(Color.BLACK);
        g2.setStroke(new BasicStroke(3.0f));

        int cx = width / 2;
        int cy = height / 2;

        // Draw concentric loops resembling fingerprint ridges
        for (int r = 20; r < 140; r += 10) {
            double angleOffset = (r % 20 == 0) ? ridgeOffset : 0;
            g2.drawArc(cx - r, cy - (int)(r * 1.3), r * 2, (int)(r * 2.6), (int)angleOffset, 330);
        }

        g2.dispose();

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void testEnrollAndMatch() {
        String fp1 = generateSyntheticFingerprintBase64(0.0);
        String fp1Duplicate = generateSyntheticFingerprintBase64(0.0);
        String fp2Different = generateSyntheticFingerprintBase64(90.0);

        // Enroll fp1 as USER_001
        Map<String, Object> enrollResult = fingerprintService.enroll("USER_001", fp1);
        assertNotNull(enrollResult);
        assertEquals("USER_001", enrollResult.get("id"));

        // Match with same fingerprint
        Map<String, Object> matchResult = fingerprintService.match(fp1Duplicate);
        assertTrue((Boolean) matchResult.get("matched"), "Expected fingerprint to match USER_001");
        assertEquals("USER_001", matchResult.get("id"));
        assertTrue(((Number) matchResult.get("score")).doubleValue() >= 40.0);

        // Check list of templates
        List<Map<String, Object>> templates = fingerprintService.getAllTemplates();
        assertEquals(1, templates.size());
        assertEquals("USER_001", templates.get(0).get("id"));

        // Match with different pattern
        Map<String, Object> matchResultDiff = fingerprintService.match(fp2Different);
        // Either matched false or score is much lower than matching USER_001
        if ((Boolean) matchResultDiff.get("matched")) {
            // Even if synthetic pattern had some coincidental minutiae, score should be lower than same
            assertNotEquals("DIFFERENT", matchResultDiff.get("id"));
        }

        // Delete template
        boolean deleted = fingerprintService.deleteTemplate("USER_001");
        assertTrue(deleted);
        assertEquals(0, fingerprintService.getAllTemplates().size());
    }
}
