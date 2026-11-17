
package com.rupesh.Postman.Clone.Collection;

import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.Workspace.Workspace;
import com.rupesh.Postman.Clone.Workspace.WorkspacePermissionService;
import com.rupesh.Postman.Clone.Workspace.WorkspaceRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspacePermissionService workspacePermissionService;

    @Transactional
    public CollectionResponseDTO createCollection(Long workspaceId, CollectionRequestDTO request, Authentication authentication) {

        Workspace workspace = getAccessibleWorkspace(workspaceId, authentication, true);

        Collection collection = new Collection();
        collection.setName(request.getName());
        collection.setDescription(request.getDescription());
        collection.setWorkspace(workspace);

        Collection savedCollection = collectionRepository.save(collection);

        return Mapper.toDTO(savedCollection);
    }

    @Transactional(readOnly = true)
    public List<CollectionResponseDTO> getCollections(Long workspaceId, Authentication authentication) {

        Workspace workspace = getAccessibleWorkspace(workspaceId, authentication, false);

        return collectionRepository.findByWorkspace(workspace)
                .stream()
                .map(Mapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public CollectionResponseDTO getCollection(Long collectionId, Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found"));

        getAccessibleWorkspace(collection.getWorkspace().getId(), authentication, false);

        return Mapper.toDTO(collection);
    }

    @Transactional
    public CollectionResponseDTO updateCollection(Long collectionId, CollectionRequestDTO request, Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId).orElseThrow(() ->
                        new ResourceNotFoundException("Collection not found"));

        getAccessibleWorkspace(collection.getWorkspace().getId(), authentication, true);

        collection.setName(request.getName());
        collection.setDescription(request.getDescription());

        Collection updatedCollection = collectionRepository.save(collection);

        return Mapper.toDTO(updatedCollection);
    }

    @Transactional
    public void deleteCollection(Long collectionId, Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId).orElseThrow(() ->
                        new ResourceNotFoundException("Collection not found"));

        getAccessibleWorkspace(collection.getWorkspace().getId(), authentication, true);

        collectionRepository.delete(collection);
    }

    private Workspace getAccessibleWorkspace(Long workspaceId, Authentication authentication, boolean editRequired) {

        Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        if (editRequired) {
            workspacePermissionService.checkEditAccess(workspace, authentication);
        } else {
            workspacePermissionService.checkViewAccess(
                    workspace, authentication);
        }
        return workspace;
    }
}
