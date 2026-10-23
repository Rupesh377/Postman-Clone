package com.rupesh.Postman.Clone.AI;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GenerateDocsRequestDTO {

    @NotBlank(message = "URL is required")
    @Size(max = 2000, message = "URL is too long")
    private String url;

    @NotBlank(message = "HTTP method is required")
    private String method;

    @Size(max = 10000, message = "Request headers are too large")
    private String requestHeaders;

    @Size(max = 20000, message = "Request body is too large")
    private String requestBody;

    @Min(value = 100, message = "Status code must be at least 100")
    @Max(value = 599, message = "Status code cannot exceed 599")
    private Integer responseStatusCode;

    @Size(max = 20000, message = "Response body is too large")
    private String responseBody;

    public GenerateDocsRequestDTO() {
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

    public String getRequestHeaders() {
        return requestHeaders;
    }

    public void setRequestHeaders(String requestHeaders) {
        this.requestHeaders = requestHeaders;
    }

    public String getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(String requestBody) {
        this.requestBody = requestBody;
    }

    public Integer getResponseStatusCode() {
        return responseStatusCode;
    }

    public void setResponseStatusCode(Integer responseStatusCode) {
        this.responseStatusCode = responseStatusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }

    public void setResponseBody(String responseBody) {
        this.responseBody = responseBody;
    }
}
