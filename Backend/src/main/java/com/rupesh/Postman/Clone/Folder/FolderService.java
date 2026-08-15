package com.rupesh.Postman.Clone.Folder;


import com.rupesh.Postman.Clone.Collection.Collection;
import com.rupesh.Postman.Clone.Collection.CollectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final CollectionRepository collectionRepository;

    public FolderResponseDTO createFolder(Long collectionId, FolderRequestDTO request, Authentication authentication) {

        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found"));

        validateCollectionAccess(collection, authentication);

        Folder folder = new Folder();
        folder.setName(request.getName());
        folder.setDescription(request.getDescription());
        folder.setCollection(collection);
        Folder savedFolder = folderRepository.save(folder);

        return mapToResponseDTO(savedFolder);
    }


    public List<FolderResponseDTO> getFoldersByCollection(Long collectionId, Authentication authentication) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found"));

        validateCollectionAccess(collection, authentication);

        return folderRepository.findByCollectionId(collectionId)
                .stream()
                .map(this::mapToResponseDTO)
                .toList();
    }


    public FolderResponseDTO getFolderById(Long folderId, Authentication authentication) {

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));
        validateCollectionAccess(folder.getCollection(), authentication);

        return mapToResponseDTO(folder);
    }


    public FolderResponseDTO updateFolder(Long folderId, FolderRequestDTO request, Authentication authentication) {

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        validateCollectionAccess(folder.getCollection(), authentication);
        folder.setName(request.getName());
        folder.setDescription(request.getDescription());
        Folder updatedFolder = folderRepository.save(folder);

        return mapToResponseDTO(updatedFolder);
    }


    public void deleteFolder(Long folderId, Authentication authentication) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        validateCollectionAccess(folder.getCollection(), authentication);
        folderRepository.delete(folder);
        }


    private void validateCollectionAccess(Collection collection, Authentication authentication) {

        String email = authentication.getName();
        if (!collection.getWorkspace().getOwner().getEmail().equals(email)) {
            throw new RuntimeException("You do not have access to this collection");
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
