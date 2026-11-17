
package com.rupesh.Postman.Clone.APIRequest;

import com.rupesh.Postman.Clone.Collection.Collection;
import com.rupesh.Postman.Clone.Collection.CollectionRepository;
import com.rupesh.Postman.Clone.Exception.BadRequestException;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.Folder.Folder;
import com.rupesh.Postman.Clone.Folder.FolderRepository;
import com.rupesh.Postman.Clone.Workspace.WorkspacePermissionService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApiRequestService {

    private final ApiRequestRepository apiRequestRepository;
    private final CollectionRepository collectionRepository;
    private final FolderRepository folderRepository;
    private final WorkspacePermissionService workspacePermissionService;


    @Transactional
    public ApiRequestResponseDTO createApiRequest(Long collectionId, ApiRequestRequestDTO request,
            Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId).orElseThrow(() ->
                        new ResourceNotFoundException("Collection not found"));

        validateCollectionAccess(collection, authentication, true);
        Folder folder = null;
        if (request.getFolderId() != null) {
            folder = folderRepository.findById(request.getFolderId()).orElseThrow(() ->
                            new ResourceNotFoundException("Folder not found"));

            if (!folder.getCollection().getId().equals(collectionId)) {
                throw new BadRequestException("Folder does not belong to this collection");
            }
        }

        ApiRequest apiRequest = new ApiRequest();

        apiRequest.setName(request.getName());
        apiRequest.setMethod(request.getMethod());
        apiRequest.setUrl(request.getUrl());
        apiRequest.setHeaders(request.getHeaders());
        apiRequest.setQueryParams(request.getQueryParams());
        apiRequest.setBody(request.getBody());
        apiRequest.setCollection(collection);
        apiRequest.setFolder(folder);

        ApiRequest savedRequest = apiRequestRepository.save(apiRequest);

        return mapToResponseDTO(savedRequest);
    }


    @Transactional(readOnly = true)
    public List<ApiRequestResponseDTO> getRequestsByCollection(Long collectionId, Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId).orElseThrow(() ->
                        new ResourceNotFoundException("Collection not found"));

        validateCollectionAccess(collection, authentication, false);

        return apiRequestRepository.findByCollectionId(collectionId)
                .stream()
                .map(this::mapToResponseDTO)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<ApiRequestResponseDTO> getRequestsByFolder(Long folderId, Authentication authentication) {

        Folder folder = folderRepository.findById(folderId).orElseThrow(() ->
                        new ResourceNotFoundException("Folder not found"));

        validateCollectionAccess(folder.getCollection(), authentication, false);

        return apiRequestRepository.findByFolderId(folderId)
                .stream()
                .map(this::mapToResponseDTO)
                .toList();
    }


    @Transactional(readOnly = true)
    public ApiRequestResponseDTO getApiRequestById(Long requestId, Authentication authentication) {

        ApiRequest apiRequest = apiRequestRepository.findById(requestId).orElseThrow(() ->
                        new ResourceNotFoundException("API Request not found"));

        validateCollectionAccess(apiRequest.getCollection(), authentication, false);

        return mapToResponseDTO(apiRequest);
    }


    @Transactional
    public ApiRequestResponseDTO updateApiRequest(Long requestId, ApiRequestRequestDTO request, Authentication authentication) {

        ApiRequest apiRequest = apiRequestRepository.findById(requestId).orElseThrow(() ->
                        new ResourceNotFoundException("API Request not found"));

        validateCollectionAccess(apiRequest.getCollection(), authentication, true);

        apiRequest.setName(request.getName());
        apiRequest.setMethod(request.getMethod());
        apiRequest.setUrl(request.getUrl());
        apiRequest.setHeaders(request.getHeaders());
        apiRequest.setQueryParams(request.getQueryParams());
        apiRequest.setBody(request.getBody());

        if (request.getFolderId() != null) {

            Folder folder = folderRepository.findById(request.getFolderId()).orElseThrow(() ->
                            new ResourceNotFoundException("Folder not found"));

            if (!folder.getCollection().getId().equals(apiRequest.getCollection().getId())) {

                throw new BadRequestException(
                        "Folder does not belong to the same collection");
            }
            apiRequest.setFolder(folder);
        } else
            apiRequest.setFolder(null);

        ApiRequest updatedRequest = apiRequestRepository.save(apiRequest);
        return mapToResponseDTO(updatedRequest);
    }


    @Transactional
    public void deleteApiRequest(Long requestId, Authentication authentication) {

        ApiRequest apiRequest = apiRequestRepository.findById(requestId).orElseThrow(() ->
                        new ResourceNotFoundException("API Request not found"));

        validateCollectionAccess(apiRequest.getCollection(), authentication, true);
        apiRequestRepository.delete(apiRequest);
    }


    private void validateCollectionAccess(Collection collection, Authentication authentication, boolean editRequired) {

        var workspace = collection.getWorkspace();
        if (editRequired) {
            workspacePermissionService.checkEditAccess(workspace, authentication);
        } else {
            workspacePermissionService.checkViewAccess(workspace, authentication);
        }
    }


    private ApiRequestResponseDTO mapToResponseDTO(ApiRequest apiRequest) {

        return new ApiRequestResponseDTO(
                apiRequest.getId(),
                apiRequest.getName(),
                apiRequest.getMethod(),
                apiRequest.getUrl(),
                apiRequest.getHeaders(),
                apiRequest.getQueryParams(),
                apiRequest.getBody(),
                apiRequest.getCollection().getId(),
                apiRequest.getFolder() != null
                        ? apiRequest.getFolder().getId()
                        : null
        );
    }
}
