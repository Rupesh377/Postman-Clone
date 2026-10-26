package com.rupesh.Postman.Clone.AI;

import com.rupesh.Postman.Clone.AI.RunTestsResponseDTO.TestResult;

import com.rupesh.Postman.Clone.APIExecution.ApiExecutionService;
import com.rupesh.Postman.Clone.APIExecution.ApiExecutionResponseDTO;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ApiTestRunnerService {

    private final ApiExecutionService apiExecutionService;
    private final ObjectMapper objectMapper;

    public ApiTestRunnerService(ApiExecutionService apiExecutionService, ObjectMapper objectMapper) {
        this.apiExecutionService = apiExecutionService;
        this.objectMapper = objectMapper;
    }


    public RunTestsResponseDTO runTests(Long requestId, Long environmentId, RunTestsRequestDTO request
            , Authentication authentication) {

        ApiExecutionResponseDTO response = apiExecutionService.execute(requestId, environmentId, authentication );

        List<TestResult> results = new ArrayList<>();
        int passed = 0;
        int failed = 0;

        for (RunTestsRequestDTO.TestAssertionDTO assertion : request.getAssertions()) {
            TestResult result = evaluate(assertion, response);
            results.add(result);
            if (result.isPassed()) {
                passed++;
            } else {
                failed++;
            }
        }
        return new RunTestsResponseDTO(results.size(), passed, failed, results);
    }


    private TestResult evaluate(RunTestsRequestDTO.TestAssertionDTO assertion, ApiExecutionResponseDTO response) {

        RunTestsRequestDTO.AssertionType type = assertion.getType();
        String description = assertion.getDescription() != null ? assertion.getDescription() : type.name();

        try {
            return switch (type)
            {
                case STATUS_CODE_EQUALS -> {
                    Integer expected = assertion.getExpectedStatusCode();

                    boolean success = expected != null && expected == response.getStatusCode();
                    yield result(assertion, success, String.valueOf(expected), String.valueOf(response.getStatusCode()),
                            success ? "Status code matched." : "Status code did not match.");
                }

                case JSON_PATH_EXISTS -> {
                    JsonNode node = findJsonPath(response.getBody(), assertion.getJsonPath());
                    boolean success = node != null;
                    yield result(assertion, success, "JSON path exists: " + assertion.getJsonPath(),
                            success ? node.toString() : "Path not found",
                            success ? "JSON path exists." : "JSON path was not found.");
                }

                case JSON_PATH_EQUALS -> {
                    JsonNode node = findJsonPath(response.getBody(), assertion.getJsonPath());

                    String actual = node == null ? null : node.toString();
                    String expected = assertion.getExpectedValue();

                    boolean success = node != null && expected != null && (actual.equals(expected)
                            || actual.equals(objectMapper.writeValueAsString(expected)));

                    yield result(assertion, success, expected, actual,
                            success ? "JSON value matched." : "JSON value did not match.");
                }

                case HEADER_CONTAINS -> {
                    String headerName = assertion.getHeaderName();
                    String expected = assertion.getExpectedValue();

                    String actual = findHeader(response.getHeaders(), headerName);

                    boolean success = actual != null && expected != null && actual.contains(expected);

                    yield result(assertion, success, expected, actual, success ?
                            "Header contains the expected value." : "Header was missing or did not contain the expected value.");
                }

                case RESPONSE_TIME_LESS_THAN_MS -> {
                    Long maximum = assertion.getMaxResponseTimeMs();
                    long actual = response.getResponseTime();

                    boolean success = maximum != null && maximum > 0 && actual < maximum;

                    yield result(assertion, success, "Less than " + maximum + " ms", actual + " ms",
                            success ? "Response time was within the limit." : "Response time exceeded the limit.");
                }
            };

        } catch (Exception exception) {
            return new TestResult(description, type.name(), false, assertion.getExpectedValue(), null,
                    "Could not evaluate assertion: " + exception.getMessage());
        }
    }


    private TestResult result(RunTestsRequestDTO.TestAssertionDTO assertion, boolean passed,
                              String expected, String actual, String message) {

        String description = assertion.getDescription() != null ? assertion.getDescription() : assertion.getType().name();
        return new TestResult(description, assertion.getType().name(), passed, expected, actual, message);
    }


    private JsonNode findJsonPath(String body, String path) throws Exception {

        if (body == null || body.isBlank() || path == null || path.isBlank()) {
            return null;
        }

        JsonNode current = objectMapper.readTree(body);
        for (String part : path.split("\\.")) {
            if (current == null || !current.isObject()) {
                return null;
            }
            current = current.get(part);
            if (current == null || current.isNull()) {
                return null;
            }
        }
        return current;
    }


    private String findHeader(Map<String, String> headers, String requestedName) {
        if (headers == null || requestedName == null) {
            return null;
        }
        return headers.entrySet().stream()
                .filter(entry -> entry.getKey().equalsIgnoreCase(requestedName))
                .map(Map.Entry::getValue).findFirst().orElse(null);
    }


    public RunTestsRequestDTO convertToRunTestsRequest(GenerateTestsResponseDTO generatedTests) {

        RunTestsRequestDTO request = new RunTestsRequestDTO();
        List<RunTestsRequestDTO.TestAssertionDTO> assertions = new ArrayList<>();

        for (GenerateTestsResponseDTO.TestCase testCase : generatedTests.getTestCases()) {

            RunTestsRequestDTO.TestAssertionDTO assertion = new RunTestsRequestDTO.TestAssertionDTO();

            assertion.setDescription(testCase.getName() + ": " + testCase.getDescription());

            String testType = testCase.getTestType().trim().toUpperCase().replaceAll("[\\s-]+", "_");

            switch (testType) {
                case "STATUS_CODE":
                case "STATUS_CODE_EQUALS":
                case "STATUS":
                    assertion.setType(RunTestsRequestDTO.AssertionType.STATUS_CODE_EQUALS);

                    assertion.setExpectedStatusCode(Integer.parseInt(testCase.getExpectedResult().trim()));
                    break;

                case "RESPONSE_TIME":
                case "RESPONSE_TIME_LESS_THAN_MS":
                    assertion.setType(RunTestsRequestDTO.AssertionType.RESPONSE_TIME_LESS_THAN_MS);

                    assertion.setMaxResponseTimeMs(Long.parseLong(testCase.getExpectedResult().trim()));
                    break;

                default:
                    throw new IllegalArgumentException("Unsupported generated test type: " + testCase.getTestType());
            }
            assertions.add(assertion);
        }
        request.setAssertions(assertions);
        return request;
    }
}