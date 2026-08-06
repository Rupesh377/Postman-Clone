package com.rupesh.Postman.Clone.Workspace;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    public WorkspaceService(WorkspaceRepository workspaceRepository, UserRepository userRepository) {
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
    }

    public WorkspaceResponseDTO createWorkspace(WorkspaceRequestDTO request, Authentication authentication) {

        String email = authentication.getName();
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Workspace workspace = Mapper.toEntity(request);
        workspace.setOwner(owner);

        workspaceRepository.save(workspace);
        return Mapper.toDTO(workspace);
    }

    public List<WorkspaceResponseDTO> getMyWorkspaces(Authentication authentication) {

        String email = authentication.getName();
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        return workspaceRepository.findByOwner(owner).stream().map(Mapper::toDTO).toList();
    }

    public WorkspaceResponseDTO getWorkspace(Long workspaceId, Authentication authentication) {

        Workspace workspace = getOwnedWorkspace(workspaceId, authentication);
        return Mapper.toDTO(workspace);
    }

    public WorkspaceResponseDTO updateWorkspace(Long workspaceId, WorkspaceRequestDTO request,
                                                Authentication authentication) {

        Workspace workspace = getOwnedWorkspace(workspaceId, authentication);
        workspace.setName(request.getName());
        workspace.setDescription(request.getDescription());
        workspace.setVisibility(request.getVisibility());
        workspaceRepository.save(workspace);

        return Mapper.toDTO(workspace);
    }

    public void deleteWorkspace(Long workspaceId, Authentication authentication) {
        Workspace workspace = getOwnedWorkspace(workspaceId, authentication);
        workspaceRepository.delete(workspace);
    }

    private Workspace getOwnedWorkspace(Long workspaceId, Authentication authentication) {

        String email = authentication.getName();
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new EntityNotFoundException("Workspace not found"));

        if (!workspace.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("You are not the owner of this workspace.");
        }
        return workspace;
    }
}
