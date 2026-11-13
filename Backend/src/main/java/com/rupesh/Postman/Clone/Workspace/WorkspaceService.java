
package com.rupesh.Postman.Clone.Workspace;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Exception.DuplicateResourceException;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceMember;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceMemberRepository;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspacePermissionService workspacePermissionService;


    @Transactional
    public WorkspaceResponseDTO createWorkspace(WorkspaceRequestDTO request, Authentication authentication) {

        User owner = getCurrentUser(authentication);
        if (workspaceRepository.existsByOwnerAndName(owner, request.getName())) {
            throw new DuplicateResourceException("Workspace with same name already exists. Try with a new name.");
        }

        Workspace workspace = Mapper.toEntity(request);
        workspace.setOwner(owner);

        WorkspaceMember ownerMember = new WorkspaceMember();
        ownerMember.setWorkspace(workspace);
        ownerMember.setUser(owner);
        ownerMember.setRole(WorkspaceRole.OWNER);

        workspace.getMembers().add(ownerMember);

        Workspace savedWorkspace = workspaceRepository.save(workspace);

        return Mapper.toDTO(savedWorkspace);
    }


    public List<WorkspaceResponseDTO> getMyWorkspaces(Authentication authentication) {

        User user = getCurrentUser(authentication);

        List<Workspace> ownedWorkspaces = workspaceRepository.findByOwner(user);

        List<Workspace> memberWorkspaces = workspaceMemberRepository.findByUser(user)
                        .stream()
                        .map(WorkspaceMember::getWorkspace)
                        .toList();

        return Stream.concat(ownedWorkspaces.stream(), memberWorkspaces.stream())
                .distinct()
                .map(Mapper::toDTO)
                .toList();
    }


    public WorkspaceResponseDTO getWorkspace(Long workspaceId, Authentication authentication) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        workspacePermissionService.checkViewAccess(workspace, authentication);

        return Mapper.toDTO(workspace);
    }


    @Transactional
    public WorkspaceResponseDTO updateWorkspace(Long workspaceId, WorkspaceRequestDTO request, Authentication authentication) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        workspacePermissionService.checkAdminAccess(workspace, authentication);

        workspace.setName(request.getName());
        workspace.setDescription(request.getDescription());
        workspace.setVisibility(request.getVisibility());

        Workspace updatedWorkspace = workspaceRepository.save(workspace);

        return Mapper.toDTO(updatedWorkspace);
    }

    @Transactional
    public void deleteWorkspace(Long workspaceId, Authentication authentication) {

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        workspacePermissionService.checkOwnerAccess(workspace, authentication);

        workspaceRepository.delete(workspace);
    }


    private User getCurrentUser(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
