package com.rupesh.Postman.Clone.Environment;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnvironmentRequestDTO {

    @NotBlank(message = "Environment name is required")
    @Size(max = 100, message = "Environment name cannot exceed 100 characters")
    private String name;
}