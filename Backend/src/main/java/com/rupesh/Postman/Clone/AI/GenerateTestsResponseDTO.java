package com.rupesh.Postman.Clone.AI;
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
        private String expectedResult;

        public TestCase() {
        }

        public TestCase(String name, String description, String testType, String expectedResult) {
            this.name = name;
            this.description = description;
            this.testType = testType;
            this.expectedResult = expectedResult;
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

        public String getExpectedResult() {
            return expectedResult;
        }

        public void setExpectedResult(String expectedResult) {
            this.expectedResult = expectedResult;
        }
    }
}

