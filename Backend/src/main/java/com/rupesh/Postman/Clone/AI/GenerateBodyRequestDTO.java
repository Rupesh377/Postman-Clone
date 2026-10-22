package com.rupesh.Postman.Clone.AI;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GenerateBodyRequestDTO {

    @NotBlank(message = "Description cannot be empty")
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    public GenerateBodyRequestDTO() {
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
