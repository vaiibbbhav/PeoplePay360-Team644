package com.fingerprint.model;

public class StoredTemplate {
    private String id;
    private String template; // Base64-encoded OpenAFIS template bytes
    private String createdAt;
    private int minutiaeCount;

    public StoredTemplate() {
    }

    public StoredTemplate(String id, String template, String createdAt, int minutiaeCount) {
        this.id = id;
        this.template = template;
        this.createdAt = createdAt;
        this.minutiaeCount = minutiaeCount;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTemplate() {
        return template;
    }

    public void setTemplate(String template) {
        this.template = template;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public int getMinutiaeCount() {
        return minutiaeCount;
    }

    public void setMinutiaeCount(int minutiaeCount) {
        this.minutiaeCount = minutiaeCount;
    }
}
