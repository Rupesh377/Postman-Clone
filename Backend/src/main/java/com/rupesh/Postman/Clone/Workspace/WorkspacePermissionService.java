package com.rupesh.Postman.Clone.Workspace;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceMember;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceMemberRepository;
import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceRole;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class WorkspacePermissionService {

    private final UserRepository userRepository;
    private final WorkspaceMemberRepository memberRepository;

    public WorkspacePermissionService(UserRepository userRepository, WorkspaceMemberRepository memberRepository) {
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
    }

    private User getCurrentUser(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public WorkspaceRole getUserRole(Workspace workspace, Authentication authentication) {

        User user = getCurrentUser(authentication);

        if (workspace.getOwner().getId().equals(user.getId())) {
            return WorkspaceRole.OWNER;
        }

        WorkspaceMember member = memberRepository.findByWorkspaceAndUser(workspace, user)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this workspace"));
        return member.getRole();
    }

    public void checkViewAccess(Workspace workspace, Authentication authentication) {
        getUserRole(workspace, authentication);
    }

    public void checkEditAccess(Workspace workspace, Authentication authentication) {

        WorkspaceRole role = getUserRole(workspace, authentication);
        if (role == WorkspaceRole.VIEWER) {
            throw new AccessDeniedException("You do not have permission to modify this workspace");
        }
    }

    public void checkAdminAccess(Workspace workspace, Authentication authentication) {
        WorkspaceRole role = getUserRole(workspace, authentication);
        if (role != WorkspaceRole.OWNER && role != WorkspaceRole.ADMIN) {
            throw new AccessDeniedException("Only workspace owners and admins can perform this action");
        }
    }

    public void checkOwnerAccess(Workspace workspace, Authentication authentication) {
        WorkspaceRole role = getUserRole(workspace, authentication);
        if (role != WorkspaceRole.OWNER) {
            throw new AccessDeniedException("Only the workspace owner can perform this action");
        }
    }
}
