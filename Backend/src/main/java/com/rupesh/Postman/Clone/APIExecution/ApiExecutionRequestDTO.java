package com.rupesh.Postman.Clone.APIExecution;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApiExecutionRequestDTO {

    @NotBlank(message = "Request name is required")
    @Size(max = 100, message = "Request name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "HTTP method is required")
    private String method;

    @NotBlank(message = "URL is required")
    @Size(max = 2000, message = "URL cannot exceed 2000 characters")
    private String url;

    private String headers;

    private String queryParams;

    private String body;
}
