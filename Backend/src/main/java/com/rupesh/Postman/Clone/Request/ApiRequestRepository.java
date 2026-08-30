package com.rupesh.Postman.Clone.Request;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiRequestRepository extends JpaRepository<ApiRequest, Long> {

    List<ApiRequest> findByCollectionId(Long collectionId);

    List<ApiRequest> findByFolderId(Long folderId);

    List<ApiRequest> findByCollectionIdAndFolderIsNull(Long collectionId);
}
