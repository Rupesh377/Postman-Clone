package com.rupesh.Postman.Clone.WorkspaceMember;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.Workspace.Workspace;
import com.rupesh.Postman.Clone.Workspace.WorkspaceRepository;
import com.rupesh.Postman.Clone.WorkspaceMember.DTO.InviteMemberRequestDTO;
import com.rupesh.Postman.Clone.WorkspaceMember.DTO.MemberResponseDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkspaceMemberService {

    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public WorkspaceMemberService(WorkspaceMemberRepository memberRepository,
                                  WorkspaceRepository workspaceRepository, UserRepository userRepository, WorkspaceMemberRepository workspaceMemberRepository) {
        this.memberRepository = memberRepository;
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    public MemberResponseDTO inviteMember(Long workspaceId,
                                          InviteMemberRequestDTO request, Authentication authentication) {

        Workspace workspace = getWorkspace(workspaceId);
        User currentUser = getCurrentUser(authentication);

        checkAdminPermission(workspace, currentUser);
        User invitedUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (memberRepository.existsByWorkspaceAndUser(workspace, invitedUser)) {
            throw new IllegalStateException("User is already a member of this workspace");
        }

        if (request.getRole() == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Cannot assign OWNER role");
        }
        WorkspaceMember member = new WorkspaceMember();
        member.setWorkspace(workspace);
        member.setUser(invitedUser);
        member.setRole(request.getRole());

        WorkspaceMember savedMember = memberRepository.save(member);

        return Mapper.toDTO(savedMember);
    }


    public List<MemberResponseDTO> getMembers(Long workspaceId, Authentication authentication) {

        Workspace workspace = getWorkspace(workspaceId);
        User currentUser = getCurrentUser(authentication);
        checkMemberAccess(workspace, currentUser);

        return memberRepository.findByWorkspace(workspace).stream().map(Mapper::toDTO).toList();
    }


    public MemberResponseDTO updateRole(Long workspaceId, Long memberId, WorkspaceRole newRole, Authentication authentication) {

        Workspace workspace = getWorkspace(workspaceId);
        User currentUser = getCurrentUser(authentication);
        checkOwnerPermission(workspace, currentUser);
        WorkspaceMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if (!member.getWorkspace().getId().equals(workspaceId)) {
            throw new IllegalArgumentException("Member does not belong to this workspace");
        }

        if (member.getRole() == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Owner role cannot be changed");
        }

        if (newRole == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Cannot assign OWNER role");
        }

        member.setRole(newRole);
        WorkspaceMember updatedMember = memberRepository.save(member);
        return Mapper.toDTO(updatedMember);
    }


    public void removeMember(Long workspaceId, Long memberId, Authentication authentication) {

        Workspace workspace = getWorkspace(workspaceId);
        User currentUser = getCurrentUser(authentication);
        checkAdminPermission(workspace, currentUser);
        WorkspaceMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if (!member.getWorkspace().getId().equals(workspaceId)) {
            throw new IllegalArgumentException("Member does not belong to this workspace");
        }

        if (member.getRole() == WorkspaceRole.OWNER) {
            throw new IllegalArgumentException("Workspace owner cannot be removed");
        }
        memberRepository.delete(member);
    }


    private Workspace getWorkspace(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }


    private void checkAdminPermission(Workspace workspace, User currentUser) {

        if (workspace.getOwner().getId().equals(currentUser.getId())) {
            return;
        }

        WorkspaceMember member = memberRepository.findByWorkspaceAndUser(workspace, currentUser)
                .orElseThrow(() -> new SecurityException("You are not a member of this workspace"));

        if (member.getRole() != WorkspaceRole.ADMIN) {
            throw new SecurityException("You do not have permission");
        }
    }


    private void checkOwnerPermission(Workspace workspace, User currentUser) {

        if (!workspace.getOwner().getId().equals(currentUser.getId())) {
            throw new SecurityException("Only workspace owner can perform this action");
        }
    }


    private void checkMemberAccess(Workspace workspace, User currentUser) {

        if (workspace.getOwner().getId().equals(currentUser.getId())) {
            return;
        }

        if (!memberRepository.existsByWorkspaceAndUser(workspace, currentUser )){
            throw new SecurityException("You do not have access to this workspace"
            );
        }
    }
}
