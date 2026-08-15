package com.rupesh.Postman.Clone.Folder;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FolderRequestDTO {

    @NotBlank(message = "Folder name is required")
    private String name;

    private String description;
}
