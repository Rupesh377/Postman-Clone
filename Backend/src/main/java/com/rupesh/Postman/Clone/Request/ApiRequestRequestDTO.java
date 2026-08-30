package com.rupesh.Postman.Clone.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApiRequestRequestDTO {

    @NotBlank(message = "Request name is required")
    private String name;

    @NotNull(message = "HTTP method is required")
    private HttpMethod method;

    @NotBlank(message = "URL is required")
    private String url;

    private String headers;

    private String queryParams;

    private String body;

    private Long folderId;
}
