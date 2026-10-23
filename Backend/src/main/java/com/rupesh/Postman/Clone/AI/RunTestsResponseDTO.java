package com.rupesh.Postman.Clone.AI;

import java.util.List;

public class RunTestsResponseDTO {

    private int totalTests;
    private int passed;
    private int failed;
    private List<TestResult> results;

    public RunTestsResponseDTO(
            int totalTests,
            int passed,
            int failed,
            List<TestResult> results) {
        this.totalTests = totalTests;
        this.passed = passed;
        this.failed = failed;
        this.results = results;
    }

    public int getTotalTests() {
        return totalTests;
    }

    public int getPassed() {
        return passed;
    }

    public int getFailed() {
        return failed;
    }

    public List<TestResult> getResults() {
        return results;
    }

    public static class TestResult {

        private String description;
        private String assertionType;
        private boolean passed;
        private String expected;
        private String actual;
        private String message;

        public TestResult(
                String description,
                String assertionType,
                boolean passed,
                String expected,
                String actual,
                String message) {
            this.description = description;
            this.assertionType = assertionType;
            this.passed = passed;
            this.expected = expected;
            this.actual = actual;
            this.message = message;
        }

        public String getDescription() {
            return description;
        }

        public String getAssertionType() {
            return assertionType;
        }

        public boolean isPassed() {
            return passed;
        }

        public String getExpected() {
            return expected;
        }

        public String getActual() {
            return actual;
        }

        public String getMessage() {
            return message;
        }
    }
}