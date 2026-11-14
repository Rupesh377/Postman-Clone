
package com.rupesh.Postman.Clone.WorkspaceMember;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Exception.BadRequestException;
import com.rupesh.Postman.Clone.Exception.DuplicateResourceException;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.Workspace.Workspace;
import com.rupesh.Postman.Clone.Workspace.WorkspacePermissionService;
import com.rupesh.Postman.Clone.Workspace.WorkspaceRepository;
import com.rupesh.Postman.Clone.WorkspaceMember.DTO.InviteMemberRequestDTO;
import com.rupesh.Postman.Clone.WorkspaceMember.DTO.MemberResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceMemberService {

    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final WorkspacePermissionService workspacePermissionService;


    @Transactional
    public MemberResponseDTO inviteMember(Long workspaceId, InviteMemberRequestDTO request, Authentication authentication) {

        Workspace workspace = getWorkspace(workspaceId);

        workspacePermissionService.checkAdminAccess(workspace, authentication);

        User invitedUser = userRepository.findByEmail(request.getEmail()).orElseThrow(() ->
                        new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (memberRepository.existsByWorkspaceAndUser(workspace, invitedUser)) {
            throw new DuplicateResourceException("User is already a member of this workspace");
        }

        if (request.getRole() == null || request.getRole() == WorkspaceRole.OWNER) {
            throw new BadRequestException("Cannot assign OWNER role");
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

        workspacePermissionService.checkViewAccess(workspace, authentication);

        return memberRepository.findByWorkspace(workspace)
                .stream()
                .map(Mapper::toDTO)
                .toList();
    }


    @Transactional
    public MemberResponseDTO updateRole(Long workspaceId, Long memberId, WorkspaceRole newRole, Authentication authentication) {

        Workspace workspace = getWorkspace(workspaceId);

        workspacePermissionService.checkOwnerAccess(workspace, authentication);

        WorkspaceMember member = memberRepository.findByIdAndWorkspaceId(memberId, workspaceId).orElseThrow(() ->
                        new ResourceNotFoundException("Member not found in this workspace"));

        if (member.getRole() == WorkspaceRole.OWNER) {
            throw new BadRequestException("Owner role cannot be changed");
        }

        if (newRole == null || newRole == WorkspaceRole.OWNER) {
            throw new BadRequestException("Cannot assign OWNER role");
        }

        member.setRole(newRole);

        WorkspaceMember updatedMember = memberRepository.save(member);

        return Mapper.toDTO(updatedMember);
    }


    @Transactional
    public void removeMember(Long workspaceId, Long memberId, Authentication authentication) {

        Workspace workspace = getWorkspace(workspaceId);

        workspacePermissionService.checkAdminAccess(workspace, authentication);

        WorkspaceMember member = memberRepository.findByIdAndWorkspaceId(memberId, workspaceId).orElseThrow(() ->
                        new ResourceNotFoundException("Member not found in this workspace"));

        if (member.getRole() == WorkspaceRole.OWNER) {
            throw new BadRequestException("Workspace owner cannot be removed");
        }

        WorkspaceRole currentUserRole = workspacePermissionService.getUserRole(workspace, authentication);

        if (member.getRole() == WorkspaceRole.ADMIN && currentUserRole != WorkspaceRole.OWNER) {

            throw new AccessDeniedException("Admins cannot remove other admins");
        }
        memberRepository.delete(member);
    }


    private Workspace getWorkspace(Long workspaceId) {

        return workspaceRepository.findById(workspaceId).orElseThrow(
                () -> new ResourceNotFoundException("Workspace not found"));
    }
}
