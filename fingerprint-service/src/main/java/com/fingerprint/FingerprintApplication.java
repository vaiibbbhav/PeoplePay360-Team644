package com.fingerprint;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

@SpringBootApplication
public class FingerprintApplication {
    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(FingerprintApplication.class, args);
    }

    private static void loadDotEnv() {
        File[] possibleFiles = new File[] {
            new File(".env"),
            new File("fingerprint-service/.env"),
            new File("../.env")
        };

        for (File f : possibleFiles) {
            if (f.exists() && f.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(f))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                            continue;
                        }
                        int idx = line.indexOf("=");
                        String key = line.substring(0, idx).trim();
                        String val = line.substring(idx + 1).trim();
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, val);
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}
