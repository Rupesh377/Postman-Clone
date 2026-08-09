package com.rupesh.Postman.Clone.WorkspaceMember.DTO;

import com.rupesh.Postman.Clone.WorkspaceMember.WorkspaceRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MemberResponseDTO {

    private Long id;

    private String name;

    private String email;

    private WorkspaceRole role;

    private LocalDateTime joinedAt;

}
