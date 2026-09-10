package com.rupesh.Postman.Clone.Environment;

import com.rupesh.Postman.Clone.Environment.EnvironmentVariable.EnvironmentVariableResponseDTO;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class EnvironmentResponseDTO {

    private Long id;
    private String name;
    private List<EnvironmentVariableResponseDTO> variables;
}
