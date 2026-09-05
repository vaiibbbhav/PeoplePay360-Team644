package com.fingerprint.model;

public class EnrollRequest {
    private String id;
    private String image; // Base64 or DataURL of the captured fingerprint image

    public EnrollRequest() {
    }

    public EnrollRequest(String id, String image) {
        this.id = id;
        this.image = image;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
