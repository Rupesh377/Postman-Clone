package com.rupesh.Postman.Clone.Collection;

public class Mapper {

    public static CollectionResponseDTO toDTO(Collection collection) {
        CollectionResponseDTO dto = new CollectionResponseDTO();
        dto.setId(collection.getId());
        dto.setName(collection.getName());
        dto.setDescription(collection.getDescription());
        dto.setWorkspaceId(collection.getWorkspace().getId());
        return dto;
    }
}
