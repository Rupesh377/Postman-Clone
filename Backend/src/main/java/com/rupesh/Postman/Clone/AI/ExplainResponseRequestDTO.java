package com.rupesh.Postman.Clone.AI;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ExplainResponseRequestDTO {

    @NotNull(message = "Status code is required")
    @Min(value = 100, message = "Status code must be at least 100")
    @Max(value = 599, message = "Status code cannot exceed 599")
    private Integer statusCode;

    @Size(max = 20000, message = "Response body is too large")
    private String responseBody;

    @Size(max = 10000, message = "Response headers are too large")
    private String responseHeaders;

    public ExplainResponseRequestDTO() {
    }

    public Integer getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(Integer statusCode) {
        this.statusCode = statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }

    public void setResponseBody(String responseBody) {
        this.responseBody = responseBody;
    }

    public String getResponseHeaders() {
        return responseHeaders;
    }

    public void setResponseHeaders(String responseHeaders) {
        this.responseHeaders = responseHeaders;
    }
}

