package com.rupesh.Postman.Clone.AI;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SuggestHeadersRequestDTO {

    @NotBlank(message = "URL is required")
    @Size(max = 2000, message = "URL is too long")
    private String url;

    @NotBlank(message = "HTTP method is required")
    private String method;

    @Size(max = 20000, message = "Request body is too large")
    private String requestBody;

    @Size(max = 10000, message = "Existing headers are too large")
    private String existingHeaders;

    public SuggestHeadersRequestDTO() {
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(String requestBody) {
        this.requestBody = requestBody;
    }

    public String getExistingHeaders() {
        return existingHeaders;
    }

    public void setExistingHeaders(String existingHeaders) {
        this.existingHeaders = existingHeaders;
    }
}
