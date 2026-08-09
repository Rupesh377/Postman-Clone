package com.rupesh.Postman.Clone.Workspace;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @PostMapping
    public ResponseEntity<WorkspaceResponseDTO> createWorkspace(@Valid @RequestBody WorkspaceRequestDTO request,
                                                                Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workspaceService.createWorkspace(request, authentication));
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceResponseDTO>> getMyWorkspaces(Authentication authentication) {
        return ResponseEntity.ok(workspaceService.getMyWorkspaces(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceResponseDTO> getWorkspace(@PathVariable Long id, Authentication authentication) {

        return ResponseEntity.ok(workspaceService.getWorkspace(id, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkspaceResponseDTO> updateWorkspace(@PathVariable Long id,
                                                                @Valid @RequestBody WorkspaceRequestDTO request, Authentication authentication) {

        return ResponseEntity.ok(workspaceService.updateWorkspace(id, request, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable Long id, Authentication authentication) {

        workspaceService.deleteWorkspace(id, authentication);
        return ResponseEntity.noContent().build();
    }
}

