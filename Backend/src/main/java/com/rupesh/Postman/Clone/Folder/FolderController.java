package com.rupesh.Postman.Clone.Folder;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping("/collections/{collectionId}/folders")
    public ResponseEntity<FolderResponseDTO> createFolder(@PathVariable Long collectionId,
                @Valid @RequestBody FolderRequestDTO request, Authentication authentication) {

        return ResponseEntity.status(HttpStatus.CREATED).body(folderService.createFolder(
                collectionId, request, authentication));
    }


    @GetMapping("/collections/{collectionId}/folders")
    public ResponseEntity<List<FolderResponseDTO>> getFoldersByCollection(@PathVariable Long collectionId,
                                                                          Authentication authentication) {

        return ResponseEntity.ok(folderService.getFoldersByCollection(collectionId, authentication));
    }


    @GetMapping("/folders/{folderId}")
    public ResponseEntity<FolderResponseDTO> getFolderById(@PathVariable Long folderId, Authentication authentication) {
        return ResponseEntity.ok(folderService.getFolderById(folderId, authentication));
    }


    @PutMapping("/folders/{folderId}")
    public ResponseEntity<FolderResponseDTO> updateFolder(@PathVariable Long folderId,
           @Valid @RequestBody FolderRequestDTO request, Authentication authentication) {
        return ResponseEntity.ok(folderService.updateFolder(folderId, request, authentication));
    }


    @DeleteMapping("/folders/{folderId}")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long folderId, Authentication authentication) {
        folderService.deleteFolder(folderId, authentication);
        return ResponseEntity.noContent().build();
    }
}
