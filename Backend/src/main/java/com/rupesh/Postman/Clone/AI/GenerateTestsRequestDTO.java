package com.rupesh.Postman.Clone.AI;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GenerateTestsRequestDTO {

    @NotBlank(message = "URL is required")
    @Size(max = 2000, message = "URL is too long")
    private String url;

    @NotBlank(message = "HTTP method is required")
    private String method;

    @Size(max = 20000, message = "Request body is too large")
    private String requestBody;

    @Min(value = 100, message = "Status code must be at least 100")
    @Max(value = 599, message = "Status code cannot exceed 599")
    private Integer expectedStatusCode;

    @Size(max = 20000, message = "Response body is too large")
    private String sampleResponseBody;

    public GenerateTestsRequestDTO() {
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

    public Integer getExpectedStatusCode() {
        return expectedStatusCode;
    }

    public void setExpectedStatusCode(Integer expectedStatusCode) {
        this.expectedStatusCode = expectedStatusCode;
    }

    public String getSampleResponseBody() {
        return sampleResponseBody;
    }

    public void setSampleResponseBody(String sampleResponseBody) {
        this.sampleResponseBody = sampleResponseBody;
    }
}
