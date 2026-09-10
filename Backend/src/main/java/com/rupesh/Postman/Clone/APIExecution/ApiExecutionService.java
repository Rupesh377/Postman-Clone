package com.rupesh.Postman.Clone.APIExecution;


import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.APIRequest.ApiRequest;
import com.rupesh.Postman.Clone.APIRequest.ApiRequestRepository;
import com.rupesh.Postman.Clone.Variable.VariableResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ApiExecutionService {

    private final RestClient restClient;
    private final ApiRequestRepository apiRequestRepository;
    private final APIExecutionRepository apiExecutionRepository;
    private final ObjectMapper objectMapper;
    private final VariableResolver variableResolver;

    public ApiExecutionResponseDTO execute(Long requestId , Long environmentId) {
        long startTime = System.currentTimeMillis();
        try {
            ApiRequest apiRequest = apiRequestRepository.findById(requestId)
                    .orElseThrow(() -> new ResourceNotFoundException("API Request not found with id: " + requestId));

            String resolvedUrl = variableResolver.resolve(apiRequest.getUrl(), environmentId);

            //String url = buildUrl(apiRequest);
            RestClient.RequestBodySpec requestSpec = restClient
                    .method(org.springframework.http.HttpMethod.valueOf(apiRequest.getMethod().name()))
                    .uri(resolvedUrl);

            Map<String, String> headers = convertJsonToMap(apiRequest.getHeaders());
            if (headers != null) {
                headers.forEach(requestSpec::header);
            }
            ResponseEntity<String> response;

            if (apiRequest.getBody() != null && !apiRequest.getBody().isBlank()) {

                response = requestSpec.body(apiRequest.getBody())
                        .exchange((request, clientResponse) -> ResponseEntity
                                        .status(clientResponse.getStatusCode())
                                        .headers(clientResponse.getHeaders())
                                        .body(clientResponse.bodyTo(String.class)));
            }
            else
            {
                response = requestSpec.exchange((request, clientResponse) ->
                                ResponseEntity.status(clientResponse.getStatusCode())
                                        .headers(clientResponse.getHeaders())
                                        .body(clientResponse.bodyTo(String.class)));
            }


            long responseTime = System.currentTimeMillis()-startTime;
            return ApiExecutionResponseDTO.builder()
                    .statusCode(response.getStatusCode().value())
                    .headers(convertHeaders(String.valueOf(response.getHeaders())))
                    .body(response.getBody())
                    .responseTime(responseTime)
                    .build();

        }catch(ResourceAccessException exception) {

            long responseTime = System.currentTimeMillis() - startTime;
            return ApiExecutionResponseDTO.builder()
                    .statusCode(0)
                    .headers(Map.of())
                    .body("Connection failed or request timed out: " + exception.getMessage())
                    .responseTime(responseTime)
                    .build();

        }catch (Exception exception) {
            long responseTime = System.currentTimeMillis() -startTime;
            return ApiExecutionResponseDTO.builder()
                    .statusCode(0)
                    .headers(Map.of())
                    .body("Request execution failed: " +exception.getMessage())
                    .responseTime(responseTime)
                    .build();
        }
    }


    public List<ApiExecutionResponseDTO> getExecutionHistory(Long requestId) {
        apiRequestRepository.findById(requestId).orElseThrow(() ->
                        new ResourceNotFoundException("API Request not found with id: " + requestId));

        List<APIExecution> executions = apiExecutionRepository.findByApiRequestIdOrderByExecutedAtDesc(requestId);

        return executions.stream()
                .map(execution -> {
                    try {
                        return ApiExecutionResponseDTO.builder()
                                .statusCode(execution.getStatusCode())
                                .headers(convertHeaders(execution.getResponseHeaders()))
                                .body(execution.getResponseBody())
                                .responseTime(execution.getResponseTime())
                                .build();
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                })
                .toList();
    }

    private String buildUrl(ApiRequest apiRequest)
            throws Exception {

        String url = apiRequest.getUrl();
        Map<String, String> queryParams = convertJsonToMap(apiRequest.getQueryParams());

        if (queryParams == null || queryParams.isEmpty()) {
            return url;
        }

        StringBuilder queryString = new  StringBuilder();

        for (Map.Entry<String, String> entry : queryParams.entrySet()) {
            if (queryString.length() > 0)
                queryString.append("&");

            queryString.append(entry.getKey()).append("=").append(entry.getValue());
        }
        return url + "?" + queryString;
    }

    private Map<String, String> convertJsonToMap(String json) throws Exception {

        if (json == null || json.isBlank()) {
            return Map.of();
        }
        return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
    }

    private Map<String, String> convertHeaders(String headers)throws Exception {

        if (headers == null || headers.isBlank()) {
            return Map.of();
        }

        return objectMapper.readValue(
                headers,
                new TypeReference<Map<String, String>>() {}
        );
    }
}