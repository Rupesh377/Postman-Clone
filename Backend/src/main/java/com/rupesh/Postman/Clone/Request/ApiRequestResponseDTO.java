package com.rupesh.Postman.Clone.Request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ApiRequestResponseDTO {

    private Long id;

    private String name;

    private HttpMethod method;

    private String url;

    private String headers;

    private String queryParams;

    private String body;

    private Long collectionId;

    private Long folderId;
}
