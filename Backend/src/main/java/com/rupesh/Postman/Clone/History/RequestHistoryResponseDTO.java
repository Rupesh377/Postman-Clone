package com.rupesh.Postman.Clone.History;

import com.rupesh.Postman.Clone.APIRequest.HttpMethod;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RequestHistoryResponseDTO {

    private Long id;

    private String requestName;

    private HttpMethod method;

    private String url;

    private Integer statusCode;

    private Long responseTime;

    private LocalDateTime executedAt;
}
