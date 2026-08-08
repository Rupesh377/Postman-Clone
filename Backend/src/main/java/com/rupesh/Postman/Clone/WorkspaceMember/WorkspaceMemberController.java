package com.rupesh.Postman.Clone.WorkspaceMember;


import com.rupesh.Postman.Clone.WorkspaceMember.DTO.InviteMemberRequestDTO;
import com.rupesh.Postman.Clone.WorkspaceMember.DTO.MemberResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/members")
public class WorkspaceMemberController {

    private final WorkspaceMemberService memberService;

    public WorkspaceMemberController(
            WorkspaceMemberService memberService
    ) {
        this.memberService = memberService;
    }


    @PostMapping
    public ResponseEntity<MemberResponseDTO> inviteMember(@PathVariable Long workspaceId,
            @Valid @RequestBody InviteMemberRequestDTO request,Authentication authentication) {

        MemberResponseDTO response = memberService.inviteMember(workspaceId, request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @GetMapping
    public ResponseEntity<List<MemberResponseDTO>> getMembers(@PathVariable Long workspaceId, Authentication authentication) {

        return ResponseEntity.ok(memberService.getMembers(workspaceId, authentication));
    }


    @PutMapping("/{memberId}")
    public ResponseEntity<MemberResponseDTO> updateRole(@PathVariable Long workspaceId, @PathVariable Long memberId,
            @RequestParam WorkspaceRole role, Authentication authentication) {

        return ResponseEntity.ok(
                memberService.updateRole(workspaceId, memberId, role, authentication));
    }


    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long workspaceId, @PathVariable Long memberId, Authentication authentication) {

        memberService.removeMember(workspaceId, memberId, authentication);
        return ResponseEntity.noContent().build();
    }
}