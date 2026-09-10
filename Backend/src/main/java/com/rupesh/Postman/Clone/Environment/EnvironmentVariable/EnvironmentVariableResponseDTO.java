package com.rupesh.Postman.Clone.Environment.EnvironmentVariable;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EnvironmentVariableResponseDTO {

    private Long id;
    private String variableKey;
    private String variableValue;
}
