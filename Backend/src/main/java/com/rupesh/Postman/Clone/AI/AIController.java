package com.rupesh.Postman.Clone.AI;


import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/ask")
    public ResponseEntity<GenerateBodyResponseDTO> generateRequestBody(@Valid @RequestBody GenerateBodyRequestDTO request) {

        GenerateBodyResponseDTO response = aiService.generateRequestBody(request);
        return ResponseEntity.ok(response);
    }
}