package com.rupesh.Postman.Clone.APIExecution;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/api-requests")
public class ApiExecutionController {

    private final ApiExecutionService apiExecutionService;

    public ApiExecutionController(ApiExecutionService apiExecutionService) {
        this.apiExecutionService = apiExecutionService;
    }

    @PostMapping("/{requestId}/execute")
    public ResponseEntity<ApiExecutionResponseDTO> executeApi(@PathVariable Long requestId, @RequestParam Long environmentId) {
            ApiExecutionResponseDTO response = apiExecutionService.execute(requestId, environmentId);
            return ResponseEntity.ok(response);
    }


    @GetMapping("/{requestId}/history")
    public ResponseEntity<List<ApiExecutionResponseDTO>> getExecutionHistory(@PathVariable Long requestId) {

        return ResponseEntity.ok(apiExecutionService.getExecutionHistory(requestId));
    }
}
