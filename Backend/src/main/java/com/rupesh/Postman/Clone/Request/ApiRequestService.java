package com.rupesh.Postman.Clone.Request;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Collection.Collection;
import com.rupesh.Postman.Clone.Collection.CollectionRepository;
import com.rupesh.Postman.Clone.Folder.Folder;
import com.rupesh.Postman.Clone.Folder.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApiRequestService {

    private final ApiRequestRepository apiRequestRepository;
    private final CollectionRepository collectionRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;


    public ApiRequestResponseDTO createApiRequest(Long collectionId, ApiRequestRequestDTO request,
            Authentication authentication) {

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Collection collection = collectionRepository.findById(collectionId).orElseThrow(
                () -> new RuntimeException("Collection not found"));
        validateCollectionAccess(collection, user);
        Folder folder = null;

        if (request.getFolderId() !=null)
        {
            folder = folderRepository.findById(request.getFolderId()).orElseThrow(
                    () -> new RuntimeException("Folder not found"));

            if (!folder.getCollection().getId().equals(collectionId))
                throw new RuntimeException("Folder does not belong to this collection");
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

        ApiRequest savedRequest =apiRequestRepository.save(apiRequest);
        return mapToResponseDTO(savedRequest);
    }

    public List<ApiRequestResponseDTO> getRequestsByCollection(Long collectionId, Authentication authentication) {

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Collection collection = collectionRepository.findById(collectionId).orElseThrow(
                        () -> new RuntimeException("Collection not found"));
        validateCollectionAccess(collection, user);

        return apiRequestRepository.findByCollectionId(collectionId).stream()
                .map(this::mapToResponseDTO).toList();
    }


    public List<ApiRequestResponseDTO> getRequestsByFolder(Long folderId, Authentication authentication) {

        String email = authentication.getName();
        User user =userRepository.findByEmail(email).orElseThrow(()->new RuntimeException("User not found"));

        Folder folder=folderRepository.findById(folderId).orElseThrow(()->new RuntimeException("Folder not found"));
        validateCollectionAccess(folder.getCollection(), user);

        return apiRequestRepository.findByFolderId(folderId).stream().map(this::mapToResponseDTO).toList();
    }

    public ApiRequestResponseDTO getApiRequestById(Long requestId, Authentication authentication) {
        String email = authentication.getName();

        User user =userRepository.findByEmail(email).orElseThrow(() ->new RuntimeException("User not found"));

        ApiRequest apiRequest = apiRequestRepository.findById(requestId).orElseThrow(
                ()->new RuntimeException("API Request not found"));

        validateCollectionAccess(apiRequest.getCollection(), user);
        return mapToResponseDTO(apiRequest);
    }

    public ApiRequestResponseDTO updateApiRequest(Long requestId,ApiRequestRequestDTO request,
                                                  Authentication authentication) {

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow(()->new RuntimeException("User not found"));

        ApiRequest apiRequest = apiRequestRepository.findById(requestId).orElseThrow(
                ()->new RuntimeException("API Request not found"));
        validateCollectionAccess(apiRequest.getCollection(), user);


        apiRequest.setName(request.getName());
        apiRequest.setMethod(request.getMethod());
        apiRequest.setUrl(request.getUrl());
        apiRequest.setHeaders(request.getHeaders());
        apiRequest.setQueryParams(request.getQueryParams());
        apiRequest.setBody(request.getBody());

        if (request.getFolderId() != null)
        {
            Folder folder = folderRepository.findById(request.getFolderId()).orElseThrow(()->
                            new RuntimeException("Folder not found"));

            if (!folder.getCollection().getId().equals(apiRequest.getCollection().getId()))
            {
                throw new RuntimeException("Folder does not belong to the same collection");
            }
            apiRequest.setFolder(folder);
        } else {
            apiRequest.setFolder(null);
        }
        ApiRequest updatedRequest = apiRequestRepository.save(apiRequest);
        return mapToResponseDTO(updatedRequest);
    }


    public void deleteApiRequest(Long requestId, Authentication authentication) {

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow(()->new RuntimeException("User not found"));

        ApiRequest apiRequest = apiRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("API Request not found"));

        validateCollectionAccess(apiRequest.getCollection(), user);

        apiRequestRepository.delete(apiRequest);
    }


    private void validateCollectionAccess(Collection collection, User user)
    {
        if (!collection.getWorkspace().getOwner().getId().equals(user.getId()))
            throw new RuntimeException("You do not have access to this collection");
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
                apiRequest.getFolder() != null ? apiRequest.getFolder().getId() : null);
    }
}