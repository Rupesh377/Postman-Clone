package com.rupesh.Postman.Clone.Folder;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FolderResponseDTO {

    private Long id;
    private String name;
    private String description;
    private Long collectionId;

}
