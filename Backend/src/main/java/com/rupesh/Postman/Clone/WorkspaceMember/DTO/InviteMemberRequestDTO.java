package com.rupesh.Postman.Clone.WorkspaceMember.DTO;

import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InviteMemberRequestDTO {

    @Email
    private String email;

    @NotNull
    private WorkspaceRole role;
}
