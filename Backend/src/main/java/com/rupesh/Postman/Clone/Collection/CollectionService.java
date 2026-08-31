package com.rupesh.Postman.Clone.Collection;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;


import com.rupesh.Postman.Clone.Exception.ForbiddenException;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.Workspace.Workspace;
import com.rupesh.Postman.Clone.Workspace.WorkspaceRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    public CollectionService(CollectionRepository collectionRepository, WorkspaceRepository workspaceRepository,
                             UserRepository userRepository) {
        this.collectionRepository = collectionRepository;
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
    }

    public CollectionResponseDTO createCollection(Long workspaceId, CollectionRequestDTO request,
            Authentication authentication) {
        Workspace workspace = getOwnedWorkspace(workspaceId, authentication);
        Collection collection = new Collection();
        collection.setName(request.getName());
        collection.setDescription(request.getDescription());
        collection.setWorkspace(workspace);
        Collection savedCollection = collectionRepository.save(collection);

        return Mapper.toDTO(savedCollection);
    }


    public List<CollectionResponseDTO> getCollections(Long workspaceId, Authentication authentication) {

        Workspace workspace = getOwnedWorkspace(workspaceId, authentication);
        return collectionRepository.findByWorkspace(workspace)
                .stream()
                .map(Mapper::toDTO)
                .toList();
    }


    public CollectionResponseDTO getCollection(Long collectionId, Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found"));

        getOwnedWorkspace(collection.getWorkspace().getId(), authentication);
        return Mapper.toDTO(collection);
    }


    public CollectionResponseDTO updateCollection(Long collectionId, CollectionRequestDTO request,
                                                  Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new  ResourceNotFoundException("Collection not found"));


        getOwnedWorkspace(collection.getWorkspace().getId(), authentication);
        collection.setName(request.getName());
        collection.setDescription(request.getDescription());
        Collection updatedCollection = collectionRepository.save(collection);

        return Mapper.toDTO(updatedCollection);
    }


    public void deleteCollection(Long collectionId, Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found"));
        getOwnedWorkspace(collection.getWorkspace().getId(), authentication);
        collectionRepository.delete(collection);

    }


    private Workspace getOwnedWorkspace(Long workspaceId, Authentication authentication) {

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        if (!workspace.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("You are not the owner of this workspace.");
        }
        return workspace;
    }

}