
package com.rupesh.Postman.Clone.APIExecution;

import com.rupesh.Postman.Clone.Environment.Environment;
import com.rupesh.Postman.Clone.Environment.EnvironmentRepository;
import com.rupesh.Postman.Clone.Exception.AccessDeniedException;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.APIRequest.ApiRequest;
import com.rupesh.Postman.Clone.APIRequest.ApiRequestRepository;
import com.rupesh.Postman.Clone.History.RequestHistoryService;
import com.rupesh.Postman.Clone.Environment.Variable.VariableResolver;
import com.rupesh.Postman.Clone.Workspace.Workspace;
import com.rupesh.Postman.Clone.Workspace.WorkspaceRepository;
import com.rupesh.Postman.Clone.Workspace.WorkspacePermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;
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
    private final RequestHistoryService requestHistoryService;
    private final EnvironmentRepository environmentRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspacePermissionService workspacePermissionService;


    @Transactional
    public ApiExecutionResponseDTO execute(Long requestId, Long environmentId, Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }

        long startTime = System.currentTimeMillis();

        try {
            ApiRequest apiRequest = apiRequestRepository.findById(requestId).orElseThrow(() ->
                            new ResourceNotFoundException("API Request not found with id: " + requestId));

            Long workspaceId = apiRequest.getCollection().getWorkspace().getId();

            Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow(() ->
                            new ResourceNotFoundException("Workspace not found"));

            workspacePermissionService.checkViewAccess(workspace, authentication);

            if (environmentId != null) {
                Environment environment = environmentRepository.findById(environmentId).orElseThrow(() ->
                                new ResourceNotFoundException("Environment not found"));

                if (!environment.getOwner().getEmail().equalsIgnoreCase(authentication.getName())) {
                    throw new AccessDeniedException("You are not allowed to access this environment");
                }
            }

            String resolvedUrl = variableResolver.resolve(apiRequest.getUrl(), environmentId);

            Map<String, String> queryParams = convertJsonToMap(apiRequest.getQueryParams());

            UriComponentsBuilder urlBuilder = UriComponentsBuilder.fromUriString(resolvedUrl);

            if (queryParams != null) {
                queryParams.forEach((key, value) -> {

                    String resolvedKey = variableResolver.resolve(key, environmentId);

                    String resolvedValue = variableResolver.resolve(value, environmentId);

                    urlBuilder.queryParam(resolvedKey, resolvedValue);
                });
            }

            resolvedUrl = urlBuilder.toUriString();

            RestClient.RequestBodySpec requestSpec = restClient.method(org.springframework.http.HttpMethod.valueOf(
                            apiRequest.getMethod().name())).uri(resolvedUrl);

            Map<String, String> headers = convertJsonToMap(apiRequest.getHeaders());

            if (headers != null) {
                headers.forEach((key, value) -> {

                    String resolvedKey = variableResolver.resolve(key, environmentId);

                    String resolvedValue = variableResolver.resolve(value, environmentId);

                    requestSpec.header(resolvedKey, resolvedValue);
                });
            }

            ResponseEntity<String> response;

            if (apiRequest.getBody() != null && !apiRequest.getBody().isBlank()) {

                String resolvedBody = variableResolver.resolve(apiRequest.getBody(), environmentId);

                response = requestSpec.body(resolvedBody)
                        .exchange((request, clientResponse) ->
                                ResponseEntity.status(clientResponse.getStatusCode())
                                        .headers(clientResponse.getHeaders())
                                        .body(clientResponse.bodyTo(String.class)));

            } else {

                response = requestSpec.exchange((request, clientResponse) ->
                        ResponseEntity.status(clientResponse.getStatusCode())
                                .headers(clientResponse.getHeaders())
                                .body(clientResponse.bodyTo(String.class)));
            }

            long responseTime = System.currentTimeMillis() - startTime;

            APIExecution apiExecution = APIExecution.builder()
                    .apiRequest(apiRequest)
                    .statusCode(response.getStatusCode().value())
                    .responseHeaders(objectMapper.writeValueAsString(response.getHeaders().toSingleValueMap()))
                    .responseBody(response.getBody())
                    .responseTime(responseTime)
                    .executedAt(java.time.LocalDateTime.now())
                    .build();

            APIExecution savedExecution = apiExecutionRepository.save(apiExecution);

            requestHistoryService.saveHistory(apiRequest.getId(),
                    apiRequest.getName(),
                    apiRequest.getMethod(),
                    resolvedUrl,
                    response.getStatusCode().value(),
                    responseTime,
                    authentication);

            return ApiExecutionResponseDTO.builder()
                    .statusCode(response.getStatusCode().value())
                    .headers(response.getHeaders().toSingleValueMap())
                    .body(response.getBody())
                    .responseTime(responseTime)
                    .build();

        } catch (AccessDeniedException | ResourceNotFoundException exception) {
            throw exception;

        } catch (ResourceAccessException exception) {

            long responseTime = System.currentTimeMillis() - startTime;

            return ApiExecutionResponseDTO.builder()
                    .statusCode(0)
                    .headers(Map.of())
                    .body("Connection failed or request timed out: " + exception.getMessage())
                    .responseTime(responseTime)
                    .build();

        } catch (Exception exception) {

            long responseTime = System.currentTimeMillis() - startTime;

            return ApiExecutionResponseDTO.builder()
                    .statusCode(0)
                    .headers(Map.of())
                    .body("Request execution failed: " + exception.getMessage())
                    .responseTime(responseTime)
                    .build();
        }
    }


    public APIExecution getExecutionById(Long executionId, Authentication authentication) {

        APIExecution execution = apiExecutionRepository.findById(executionId).orElseThrow(() ->
                        new ResourceNotFoundException("API execution not found with id: " + executionId));

        Long workspaceId = execution.getApiRequest()
                .getCollection()
                .getWorkspace()
                .getId();

        Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        workspacePermissionService.checkViewAccess(workspace, authentication);
        return execution;
    }


    private Map<String, String> convertJsonToMap(String json) throws Exception {

        if (json == null || json.isBlank()) {
            return Map.of();
        }

        return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
    }

    public List<ApiExecutionResponseDTO> getExecutionHistory(Long requestId, Authentication authentication) {

        ApiRequest apiRequest = apiRequestRepository.findById(requestId).orElseThrow(() ->
                        new ResourceNotFoundException("API Request not found"));

        Long workspaceId = apiRequest.getCollection().getWorkspace().getId();

        Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        workspacePermissionService.checkViewAccess(workspace, authentication);

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

    private Map<String, String> convertHeaders(String responseHeaders) {
        try {
            if (responseHeaders == null || responseHeaders.isBlank()) {
                return Collections.emptyMap();
            }

            return objectMapper.readValue(responseHeaders, new TypeReference<Map<String, String>>() {});

        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
