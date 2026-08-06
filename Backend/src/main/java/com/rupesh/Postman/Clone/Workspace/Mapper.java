package com.rupesh.Postman.Clone.Workspace;

public class Mapper {

    public static Workspace toEntity(WorkspaceRequestDTO dto) {

        Workspace workspace = new Workspace();
        workspace.setName(dto.getName());
        workspace.setDescription(dto.getDescription());
        workspace.setVisibility(dto.getVisibility());
        return workspace;
    }

    public static WorkspaceResponseDTO toDTO(Workspace workspace) {

        WorkspaceResponseDTO dto = new WorkspaceResponseDTO();
        dto.setId(workspace.getId());
        dto.setName(workspace.getName());
        dto.setDescription(workspace.getDescription());
        dto.setVisibility(workspace.getVisibility());
        dto.setOwnerName(workspace.getOwner().getName());
        dto.setCreatedAt(workspace.getCreatedAt());
        return dto;
    }
}
