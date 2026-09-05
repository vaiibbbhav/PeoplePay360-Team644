package com.fingerprint.model;

public class MatchRequest {
    private String image; // Base64 or DataURL of the captured fingerprint image to match

    public MatchRequest() {
    }

    public MatchRequest(String image) {
        this.image = image;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
