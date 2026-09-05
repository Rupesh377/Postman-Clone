package com.rupesh.Postman.Clone.Workspace;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Collection.CollectionResponseDTO;
import com.rupesh.Postman.Clone.Exception.BadRequestException;
import com.rupesh.Postman.Clone.Exception.DuplicateResourceException;
import com.rupesh.Postman.Clone.Exception.ForbiddenException;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceMember;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceMemberRepository;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceMemberService;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceRole;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public WorkspaceService(WorkspaceRepository workspaceRepository, UserRepository userRepository, WorkspaceMemberRepository workspaceMemberRepository) {
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    @Transactional
    public WorkspaceResponseDTO createWorkspace(WorkspaceRequestDTO request, Authentication authentication) {

        String email = authentication.getName();
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (workspaceRepository.existsByOwnerAndName(owner ,request.getName())) {
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

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));


        List<Workspace> ownedWorkspaces = workspaceRepository.findByOwner(user);

        List<Workspace> memberWorkspaces = workspaceMemberRepository.findByUser(user)
                        .stream()
                        .map(WorkspaceMember::getWorkspace)
                        .toList();


        return java.util.stream.Stream.concat(ownedWorkspaces.stream(), memberWorkspaces.stream())
                .distinct().map(Mapper::toDTO).toList();
    }

    public WorkspaceResponseDTO getWorkspace(Long workspaceId, Authentication authentication) {
        Workspace workspace = getOwnedWorkspace(workspaceId, authentication);
        return Mapper.toDTO(workspace);
    }

    @Transactional
    public WorkspaceResponseDTO updateWorkspace(Long workspaceId, WorkspaceRequestDTO request,
                                                Authentication authentication) {
        Workspace workspace = getOwnedWorkspace(workspaceId, authentication);
        workspace.setName(request.getName());
        workspace.setDescription(request.getDescription());
        workspace.setVisibility(request.getVisibility());
        workspaceRepository.save(workspace);

        return Mapper.toDTO(workspace);
    }

    @Transactional
    public void deleteWorkspace(Long workspaceId, Authentication authentication) {
        Workspace workspace = getOwnedWorkspace(workspaceId, authentication);
        workspaceRepository.delete(workspace);
    }

    private Workspace getOwnedWorkspace(Long workspaceId, Authentication authentication) {

        String email = authentication.getName();
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        if (!workspace.getOwner().getId().equals(owner.getId())) {
            throw new ForbiddenException("You are not the owner of this workspace.");
        }
        return workspace;
    }


}
