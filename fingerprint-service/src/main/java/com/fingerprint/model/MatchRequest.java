package com.fingerprint.model;

public class MatchRequest {
    private String image; // Base64 or DataURL of the captured fingerprint image to match
    private String employeeCode; // Optional employee code (e.g. EMP-003) for 1:1 biometric verification
    private String employeeId;   // Optional employee UUID or identifier

    public MatchRequest() {
    }

    public MatchRequest(String image) {
        this.image = image;
    }

    public MatchRequest(String image, String employeeCode) {
        this.image = image;
        this.employeeCode = employeeCode;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }
}
