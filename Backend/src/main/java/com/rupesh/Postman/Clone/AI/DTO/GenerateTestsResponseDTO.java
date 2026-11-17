
package com.rupesh.Postman.Clone.AI.DTO;

import java.util.List;

public class GenerateTestsResponseDTO {

    private List<TestCase> testCases;

    public GenerateTestsResponseDTO() {
    }

    public GenerateTestsResponseDTO(List<TestCase> testCases) {
        this.testCases = testCases;
    }

    public List<TestCase> getTestCases() {
        return testCases;
    }

    public void setTestCases(List<TestCase> testCases) {
        this.testCases = testCases;
    }

    public static class TestCase {

        private String name;
        private String description;
        private String testType;

        private Integer expectedStatusCode;
        private String jsonPath;
        private String expectedValue;
        private String headerName;
        private Long maxResponseTimeMs;

        public TestCase() {
        }

        public TestCase(String name, String description, String testType,
                        Integer expectedStatusCode, String jsonPath,
                        String expectedValue, String headerName,
                        Long maxResponseTimeMs) {
            this.name = name;
            this.description = description;
            this.testType = testType;
            this.expectedStatusCode = expectedStatusCode;
            this.jsonPath = jsonPath;
            this.expectedValue = expectedValue;
            this.headerName = headerName;
            this.maxResponseTimeMs = maxResponseTimeMs;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getTestType() {
            return testType;
        }

        public void setTestType(String testType) {
            this.testType = testType;
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
