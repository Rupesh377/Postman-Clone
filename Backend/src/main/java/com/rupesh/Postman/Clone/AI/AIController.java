package com.rupesh.Postman.Clone.AI;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;
    private final ApiTestRunnerService apiTestRunnerService;

    public AIController(AIService aiService, ApiTestRunnerService apiTestRunnerService) {
        this.aiService = aiService;
        this.apiTestRunnerService = apiTestRunnerService;
    }

    @PostMapping("/ask")
    public ResponseEntity<GenerateBodyResponseDTO> generateRequestBody(@Valid @RequestBody GenerateBodyRequestDTO request
            , Authentication authentication) {

        GenerateBodyResponseDTO response = aiService.generateRequestBody(request);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/explain-response")
    public ResponseEntity<ExplainResponseResponseDTO> explainResponse(@Valid @RequestBody ExplainResponseRequestDTO request
            , Authentication authentication) {

        return ResponseEntity.ok(aiService.explainResponse(request ));
    }

    @PostMapping("/suggest-headers")
    public ResponseEntity<SuggestHeadersResponseDTO> suggestHeaders(@Valid @RequestBody SuggestHeadersRequestDTO request
            , Authentication authentication) {

        return ResponseEntity.ok(aiService.suggestHeaders(request));
    }


    @PostMapping("/generate-tests")
    public ResponseEntity<GenerateTestsResponseDTO> generateTestCases(@Valid @RequestBody GenerateTestsRequestDTO request
            , Authentication authentication) {

        return ResponseEntity.ok(aiService.generateTestCases(request));
    }


    @PostMapping("/generate-docs")
    public ResponseEntity<GenerateDocsResponseDTO> generateDocumentation(@Valid @RequestBody GenerateDocsRequestDTO request
            , Authentication authentication) {

        return ResponseEntity.ok(aiService.generateDocumentation(request ));
    }

    @PostMapping("/run-tests/{requestId}")
    public ResponseEntity<RunTestsResponseDTO> runTests(@PathVariable Long requestId, @RequestParam(required = false) Long environmentId,
                                                        @Valid @RequestBody RunTestsRequestDTO request , Authentication authentication) {

        return ResponseEntity.ok(apiTestRunnerService.runTests(requestId, environmentId, request , authentication));
    }


    @PostMapping("/generate-and-run-tests/{requestId}")
    public ResponseEntity<RunTestsResponseDTO> generateAndRunTests(@PathVariable Long requestId, Authentication authentication,
            @RequestParam(required = false) Long environmentId, @Valid @RequestBody GenerateTestsRequestDTO request) {

        GenerateTestsResponseDTO generatedTests = aiService.generateTestCases(request);
        RunTestsRequestDTO runRequest = apiTestRunnerService.convertToRunTestsRequest(generatedTests);

        RunTestsResponseDTO results = apiTestRunnerService.runTests(requestId, environmentId, runRequest,authentication );
        return ResponseEntity.ok(results);
    }
}