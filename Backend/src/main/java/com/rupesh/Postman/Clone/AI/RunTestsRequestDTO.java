package com.rupesh.Postman.Clone.AI;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class RunTestsRequestDTO {

    @NotEmpty
    @Valid
    private List<TestAssertionDTO> assertions;

    public List<TestAssertionDTO> getAssertions() {
        return assertions;
    }

    public void setAssertions(List<TestAssertionDTO> assertions) {
        this.assertions = assertions;
    }

    public static class TestAssertionDTO {

        @NotNull
        private AssertionType type;

        @Size(max = 500)
        private String description;

        private Integer expectedStatusCode;

        @Size(max = 500)
        private String jsonPath;

        @Size(max = 2000)
        private String expectedValue;

        @Size(max = 200)
        private String headerName;

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
}