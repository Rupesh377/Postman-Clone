package com.rupesh.Postman.Clone.Workspace;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkspaceResponseDTO {

    private Long id;
    private String name;
    private String description;
    private WorkspaceVisibility visibility;
    private String ownerName;
    private LocalDateTime createdAt;
}
