
package com.rupesh.Postman.Clone.Folder;

import com.rupesh.Postman.Clone.Collection.Collection;
import com.rupesh.Postman.Clone.Collection.CollectionRepository;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import com.rupesh.Postman.Clone.Workspace.WorkspacePermissionService;
import com.rupesh.Postman.Clone.Workspace.WorkspaceRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final CollectionRepository collectionRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspacePermissionService workspacePermissionService;

    @Transactional
    public FolderResponseDTO createFolder(Long collectionId, FolderRequestDTO request, Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId).orElseThrow(() ->
                        new ResourceNotFoundException("Collection not found"));

        validateCollectionAccess(collection, authentication, true);
        Folder folder = new Folder();
        folder.setName(request.getName());
        folder.setDescription(request.getDescription());
        folder.setCollection(collection);
        Folder savedFolder = folderRepository.save(folder);

        return mapToResponseDTO(savedFolder);
    }


    @Transactional(readOnly = true)
    public List<FolderResponseDTO> getFoldersByCollection(Long collectionId, Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId).orElseThrow(() ->
                        new ResourceNotFoundException("Collection not found"));

        validateCollectionAccess(collection, authentication, false);
        return folderRepository.findByCollectionId(collectionId)
                .stream()
                .map(this::mapToResponseDTO)
                .toList();
    }


    @Transactional(readOnly = true)
    public FolderResponseDTO getFolderById(Long folderId, Authentication authentication) {

        Folder folder = folderRepository.findById(folderId).orElseThrow(() ->
                        new ResourceNotFoundException("Folder not found"));

        validateCollectionAccess(folder.getCollection(), authentication, false);

        return mapToResponseDTO(folder);
    }

    @Transactional
    public FolderResponseDTO updateFolder(Long folderId, FolderRequestDTO request, Authentication authentication) {

        Folder folder = folderRepository.findById(folderId).orElseThrow(() ->
                        new ResourceNotFoundException("Folder not found"));

        validateCollectionAccess(folder.getCollection(), authentication, true);

        folder.setName(request.getName());
        folder.setDescription(request.getDescription());

        Folder updatedFolder = folderRepository.save(folder);

        return mapToResponseDTO(updatedFolder);
    }

    @Transactional
    public void deleteFolder(Long folderId, Authentication authentication) {

        Folder folder = folderRepository.findById(folderId).orElseThrow(() ->
                        new ResourceNotFoundException("Folder not found"));

        validateCollectionAccess(folder.getCollection(), authentication, true);

        folderRepository.delete(folder);
    }

    private void validateCollectionAccess(Collection collection, Authentication authentication, boolean editRequired) {

        Long workspaceId = collection.getWorkspace().getId();
        var workspace = workspaceRepository.findById(workspaceId).orElseThrow(() ->
                        new ResourceNotFoundException("Workspace not found"));

        if (editRequired) {
            workspacePermissionService.checkEditAccess(workspace, authentication);
        } else {
            workspacePermissionService.checkViewAccess(workspace, authentication);
        }
    }

    private FolderResponseDTO mapToResponseDTO(Folder folder) {

        return new FolderResponseDTO(
                folder.getId(),
                folder.getName(),
                folder.getDescription(),
                folder.getCollection().getId());
    }
}
