package com.rupesh.Postman.Clone.Environment.EnvironmentVariable;


import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnvironmentVariableRequestDTO {

    @NotBlank
    private String variableKey;

    @NotBlank
    private String variableValue;
}