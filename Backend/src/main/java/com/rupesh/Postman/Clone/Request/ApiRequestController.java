package com.rupesh.Postman.Clone.Request;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ApiRequestController {

    private final ApiRequestService apiRequestService;

    @PostMapping("/collections/{collectionId}/requests")
    public ResponseEntity<ApiRequestResponseDTO> createApiRequest(@PathVariable Long collectionId, @Valid @RequestBody ApiRequestRequestDTO request,
            Authentication authentication) {

        ApiRequestResponseDTO response = apiRequestService.createApiRequest(collectionId, request, authentication);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @GetMapping("/collections/{collectionId}/requests")
    public ResponseEntity<List<ApiRequestResponseDTO>> getRequestsByCollection(@PathVariable Long collectionId,
            Authentication authentication) {

        return ResponseEntity.ok(apiRequestService.getRequestsByCollection(collectionId, authentication));
    }


    @GetMapping("/folders/{folderId}/requests")
    public ResponseEntity<List<ApiRequestResponseDTO>> getRequestsByFolder(@PathVariable Long folderId, Authentication authentication) {

        return ResponseEntity.ok(apiRequestService.getRequestsByFolder(folderId, authentication));
    }

    @GetMapping("/requests/{requestId}")
    public ResponseEntity<ApiRequestResponseDTO> getApiRequestById(@PathVariable Long requestId,Authentication authentication) {

        return ResponseEntity.ok(apiRequestService.getApiRequestById(requestId, authentication));
    }


    @PutMapping("/requests/{requestId}")
    public ResponseEntity<ApiRequestResponseDTO> updateApiRequest(@PathVariable Long requestId,
            @Valid @RequestBody ApiRequestRequestDTO request, Authentication authentication) {

        return ResponseEntity.ok(apiRequestService.updateApiRequest(requestId, request, authentication));
    }


    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<Void> deleteApiRequest(@PathVariable Long requestId, Authentication authentication) {

        apiRequestService.deleteApiRequest(requestId, authentication);
        return ResponseEntity.noContent().build();
    }
}