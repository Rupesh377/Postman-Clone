package com.rupesh.Postman.Clone.Collection;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping("/workspaces/{workspaceId}/collections")
    public ResponseEntity<CollectionResponseDTO> createCollection(@PathVariable Long workspaceId,
                @Valid @RequestBody CollectionRequestDTO request , Authentication authentication)
    {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(collectionService.createCollection(workspaceId, request,authentication));
    }

    @GetMapping("/workspaces/{workspaceId}/collections")
    public ResponseEntity<List<CollectionResponseDTO>> getCollections(@PathVariable Long workspaceId, Authentication authentication) {
        return ResponseEntity.ok(collectionService.getCollections(workspaceId,authentication));
    }

    @GetMapping("/collections/{collectionId}")
    public ResponseEntity<CollectionResponseDTO> getCollection(@PathVariable Long collectionId, Authentication authentication) {
        return ResponseEntity.ok(collectionService.getCollection(collectionId,authentication));
    }

    @PutMapping("/collections/{collectionId}")
    public ResponseEntity<CollectionResponseDTO> updateCollection(@PathVariable Long collectionId,
            @Valid @RequestBody CollectionRequestDTO request, Authentication authentication) {
        return ResponseEntity.ok(collectionService.updateCollection(collectionId, request,authentication));
    }

    @DeleteMapping("/collections/{collectionId}")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long collectionId,Authentication authentication) {
        collectionService.deleteCollection(collectionId,authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/workspaces/{workspaceId}/collections")
    public ResponseEntity<List<CollectionResponseDTO>> getCollectionsByWorkspace(
            @PathVariable Long workspaceId, Authentication authentication) {
        return ResponseEntity.ok(collectionService.getCollectionsByWorkspace(workspaceId, authentication));
    }
}
