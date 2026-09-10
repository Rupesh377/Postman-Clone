package com.rupesh.Postman.Clone.APIExecution;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/api-requests")
public class ApiExecutionController {

    private final ApiExecutionService apiExecutionService;

    public ApiExecutionController(ApiExecutionService apiExecutionService) {
        this.apiExecutionService = apiExecutionService;
    }

    @PostMapping("/{requestId}/execute")
    public ResponseEntity<ApiExecutionResponseDTO> executeApi( @PathVariable Long requestId) {
        ApiExecutionResponseDTO response = apiExecutionService.execute(requestId);
        return ResponseEntity.ok(response);
    }
}
