package com.fingerprint.model;

public class EnrollRequest {
    private String id;
    private String employeeId;
    private String image; // Base64 or DataURL of the captured fingerprint image

    public EnrollRequest() {
    }

    public EnrollRequest(String id, String image) {
        this.id = id;
        this.employeeId = id;
        this.image = image;
    }

    public String getId() {
        return id != null && !id.trim().isEmpty() ? id : employeeId;
    }

    public void setId(String id) {
        this.id = id;
        if (this.employeeId == null) this.employeeId = id;
    }

    public String getEmployeeId() {
        return employeeId != null && !employeeId.trim().isEmpty() ? employeeId : id;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
        if (this.id == null) this.id = employeeId;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
