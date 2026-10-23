package com.rupesh.Postman.Clone.AI;


import tools.jackson.databind.JsonNode;
public class GenerateBodyResponseDTO {

    private JsonNode body;

    public GenerateBodyResponseDTO(JsonNode body) {
        this.body = body;
    }

    public GenerateBodyResponseDTO() {
    }

    public JsonNode getBody() {
        return body;
    }

    public void setBody(JsonNode body) {
        this.body = body;
    }
}
