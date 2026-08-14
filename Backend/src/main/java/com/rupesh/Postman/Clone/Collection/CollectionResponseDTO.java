package com.rupesh.Postman.Clone.Collection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CollectionResponseDTO {

    private Long id;
    private String name;
    private String description;
    private Long workspaceId;
}
