package com.rupesh.Postman.Clone.AI;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public class RunTestsRequestDTO {

    @NotEmpty(message = "At least one test assertion is required")
    @Valid
    @Size(max = 50, message = "A maximum of 50 assertions is allowed")
    private List<TestAssertionDTO> assertions;

    public List<TestAssertionDTO> getAssertions() {
        return assertions;
    }

    public void setAssertions(List<TestAssertionDTO> assertions) {
        this.assertions = assertions;
    }

    public static class TestAssertionDTO {

        @NotNull(message = "Assertion type is required")
        private AssertionType type;

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        private String description;

        @Min(value = 100, message = "Expected status code must be at least 100")
        @Max(value = 599, message = "Expected status code cannot exceed 599")
        private Integer expectedStatusCode;

        @Size(max = 500, message = "JSON path cannot exceed 500 characters")
        private String jsonPath;

        @Size(max = 2000, message = "Expected value cannot exceed 2000 characters")
        private String expectedValue;

        @Size(max = 200, message = "Header name cannot exceed 200 characters")
        private String headerName;

        @Positive(message = "Maximum response time must be positive")
        private Long maxResponseTimeMs;

        public AssertionType getType() {
            return type;
        }

        public void setType(AssertionType type) {
            this.type = type;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public Integer getExpectedStatusCode() {
            return expectedStatusCode;
        }

        public void setExpectedStatusCode(Integer expectedStatusCode) {
            this.expectedStatusCode = expectedStatusCode;
        }

        public String getJsonPath() {
            return jsonPath;
        }

        public void setJsonPath(String jsonPath) {
            this.jsonPath = jsonPath;
        }

        public String getExpectedValue() {
            return expectedValue;
        }

        public void setExpectedValue(String expectedValue) {
            this.expectedValue = expectedValue;
        }

        public String getHeaderName() {
            return headerName;
        }

        public void setHeaderName(String headerName) {
            this.headerName = headerName;
        }

        public Long getMaxResponseTimeMs() {
            return maxResponseTimeMs;
        }

        public void setMaxResponseTimeMs(Long maxResponseTimeMs) {
            this.maxResponseTimeMs = maxResponseTimeMs;
        }
    }

    public enum AssertionType {
        STATUS_CODE_EQUALS,
        JSON_PATH_EXISTS,
        JSON_PATH_EQUALS,
        HEADER_CONTAINS,
        RESPONSE_TIME_LESS_THAN_MS
    }
}
