package com.rupesh.Postman.Clone.Environment.EnvironmentVariable;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnvironmentVariableRequestDTO {

    @NotBlank(message = "Variable key is required")
    @Size(max = 100, message = "Variable key cannot exceed 100 characters")
    private String variableKey;

    @NotBlank(message = "Variable value is required")
    @Size(max = 10000, message = "Variable value cannot exceed 10000 characters")
    private String variableValue;
}