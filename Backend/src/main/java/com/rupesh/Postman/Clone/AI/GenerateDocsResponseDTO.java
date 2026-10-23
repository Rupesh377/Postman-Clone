package com.rupesh.Postman.Clone.AI;

public class GenerateDocsResponseDTO {

    private String documentation;

    public GenerateDocsResponseDTO() {
    }

    public GenerateDocsResponseDTO(String documentation) {
        this.documentation = documentation;
    }

    public String getDocumentation() {
        return documentation;
    }

    public void setDocumentation(String documentation) {
        this.documentation = documentation;
    }
}

