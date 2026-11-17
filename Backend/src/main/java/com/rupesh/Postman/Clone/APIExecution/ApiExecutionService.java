
package com.rupesh.Postman.Clone.APIExecution;

import com.rupesh.Postman.Clone.APIRequest.ApiRequest;
import com.rupesh.Postman.Clone.APIRequest.ApiRequestRepository;
import com.rupesh.Postman.Clone.Environment.Environment;
import com.rupesh.Postman.Clone.Environment.EnvironmentRepository;
import com.rupesh.Postman.Clone.Environment.Variable.VariableResolver;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.History.RequestHistoryService;
import com.rupesh.Postman.Clone.Workspace.Workspace;
import com.rupesh.Postman.Clone.Workspace.WorkspacePermissionService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
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
    private final WorkspacePermissionService workspacePermissionService;

    @Transactional
    public ApiExecutionResponseDTO execute(Long requestId, Long environmentId, Authentication authentication) {

        validateAuthentication(authentication);

        ApiRequest apiRequest = apiRequestRepository.findById(requestId).orElseThrow(() ->
                        new ResourceNotFoundException("API Request not found with id: " + requestId));

        Workspace workspace = apiRequest.getCollection().getWorkspace();
        workspacePermissionService.checkViewAccess(workspace, authentication);

        if (environmentId != null) {
            Environment environment = environmentRepository.findById(environmentId).orElseThrow(() ->
                            new ResourceNotFoundException("Environment not found"));

            if (!environment.getOwner().getEmail().equalsIgnoreCase(authentication.getName())) {

                throw new AccessDeniedException("You are not allowed to access this environment");
            }
        }

        long startTime = System.currentTimeMillis();
        String resolvedUrl = apiRequest.getUrl();
        ResponseEntity<String> response;

        try {

            resolvedUrl = variableResolver.resolve(apiRequest.getUrl(), environmentId);

            Map<String, String> queryParams = convertJsonToMap(apiRequest.getQueryParams());

            UriComponentsBuilder urlBuilder = UriComponentsBuilder.fromUriString(resolvedUrl);

            queryParams.forEach((key, value) -> {
                String resolvedKey = variableResolver.resolve(key, environmentId);
                String resolvedValue = variableResolver.resolve(value, environmentId);
                urlBuilder.queryParam(resolvedKey, resolvedValue);
            });

            resolvedUrl = urlBuilder.toUriString();

            HttpMethod httpMethod = HttpMethod.valueOf(apiRequest.getMethod().name());

            RestClient.RequestBodySpec requestSpec = restClient.method(httpMethod).uri(resolvedUrl);

            Map<String, String> headers = convertJsonToMap(apiRequest.getHeaders());

            headers.forEach((key, value) -> {

                String resolvedKey = variableResolver.resolve(key, environmentId);

                String resolvedValue = variableResolver.resolve(value, environmentId);

                requestSpec.header(resolvedKey, resolvedValue);
            });

            if (apiRequest.getBody() != null && !apiRequest.getBody().isBlank()) {

                String resolvedBody = variableResolver.resolve(apiRequest.getBody(), environmentId);

                response = requestSpec.body(resolvedBody)
                        .exchange((request, clientResponse) -> ResponseEntity
                                        .status(clientResponse.getStatusCode())
                                        .headers(clientResponse.getHeaders())
                                        .body(clientResponse.bodyTo(String.class)));

            } else {
                response = requestSpec.exchange((request, clientResponse) ->
                                ResponseEntity
                                        .status(clientResponse.getStatusCode())
                                        .headers(clientResponse.getHeaders())
                                        .body(clientResponse.bodyTo(String.class)));
            }

        } catch (ResourceAccessException exception) {

            long responseTime = System.currentTimeMillis() - startTime;

            String errorMessage = "Connection failed or request timed out: " + exception.getMessage();

            return saveFailedExecution(apiRequest, resolvedUrl, errorMessage, responseTime, authentication);
        } catch (Exception exception) {

            long responseTime = System.currentTimeMillis() - startTime;

            String errorMessage = "Request execution failed: "
                    + exception.getMessage();

            return saveFailedExecution(apiRequest, resolvedUrl, errorMessage, responseTime, authentication);
        }

        long responseTime = System.currentTimeMillis() - startTime;

        Map<String, String> responseHeaders = response.getHeaders().toSingleValueMap();

        APIExecution apiExecution = APIExecution.builder()
                .apiRequest(apiRequest)
                .statusCode(response.getStatusCode().value())
                .responseHeaders(convertMapToJson(responseHeaders))
                .responseBody(response.getBody())
                .responseTime(responseTime)
                .executedAt(LocalDateTime.now())
                .build();

        apiExecutionRepository.save(apiExecution);

        requestHistoryService.saveHistory(
                apiRequest.getId(),
                apiRequest.getName(),
                apiRequest.getMethod(),
                resolvedUrl,
                response.getStatusCode().value(),
                responseTime,
                authentication);

        return ApiExecutionResponseDTO.builder()
                .statusCode(response.getStatusCode().value())
                .headers(responseHeaders)
                .body(response.getBody())
                .responseTime(responseTime)
                .build();
    }


    private ApiExecutionResponseDTO saveFailedExecution(ApiRequest apiRequest, String resolvedUrl,
            String errorMessage, long responseTime, Authentication authentication) {

        APIExecution apiExecution = APIExecution.builder()
                .apiRequest(apiRequest)
                .statusCode(0)
                .responseHeaders("{}")
                .responseBody(errorMessage)
                .responseTime(responseTime)
                .executedAt(LocalDateTime.now())
                .build();

        apiExecutionRepository.save(apiExecution);

        requestHistoryService.saveHistory(apiRequest.getId(),
                apiRequest.getName(),
                apiRequest.getMethod(),
                resolvedUrl,
                0,
                responseTime,
                authentication);

        return ApiExecutionResponseDTO.builder()
                .statusCode(0)
                .headers(Collections.emptyMap())
                .body(errorMessage)
                .responseTime(responseTime)
                .build();
    }


    @Transactional(readOnly = true)
    public APIExecution getExecutionById(Long executionId, Authentication authentication) {

        validateAuthentication(authentication);
        APIExecution execution = apiExecutionRepository.findById(executionId).orElseThrow(() ->
                        new ResourceNotFoundException("API execution not found with id: " + executionId));

        Workspace workspace = execution.getApiRequest().getCollection().getWorkspace();

        workspacePermissionService.checkViewAccess(workspace, authentication);
        return execution;
    }


    @Transactional(readOnly = true)
    public List<ApiExecutionResponseDTO> getExecutionHistory(Long requestId, Authentication authentication) {

        validateAuthentication(authentication);
        ApiRequest apiRequest = apiRequestRepository.findById(requestId).orElseThrow(() ->
                        new ResourceNotFoundException("API Request not found"));

        Workspace workspace = apiRequest.getCollection().getWorkspace();

        workspacePermissionService.checkViewAccess(workspace, authentication);

        List<APIExecution> executions = apiExecutionRepository
                        .findByApiRequestIdOrderByExecutedAtDesc(requestId);

        return executions.stream()
                .map(execution -> ApiExecutionResponseDTO.builder()
                        .statusCode(execution.getStatusCode())
                        .headers(convertHeaders(execution.getResponseHeaders()))
                        .body(execution.getResponseBody())
                        .responseTime(execution.getResponseTime())
                        .build())
                .toList();
    }


    private void validateAuthentication(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {

            throw new AccessDeniedException("Authentication is required");
        }
    }


    private Map<String, String> convertJsonToMap(String json) throws Exception {

        if (json == null || json.isBlank()) {
            return Map.of();
        }

        return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
    }


    private String convertMapToJson(Map<String, String> map) {

        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception exception) {
            return "{}";
        }
    }


    private Map<String, String> convertHeaders(String responseHeaders) {

        try {
            if (responseHeaders == null || responseHeaders.isBlank()) {
                return Collections.emptyMap();
            }

            return objectMapper.readValue(responseHeaders, new TypeReference<Map<String, String>>() {});

        } catch (Exception exception) {
            return Collections.emptyMap();
        }
    }
}
