package com.rupesh.Postman.Clone.APIExecution;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class ApiExecutionResponseDTO {

    private int statusCode;
    private Map<String, String> headers;
    private String body;
    private long responseTime;
}
