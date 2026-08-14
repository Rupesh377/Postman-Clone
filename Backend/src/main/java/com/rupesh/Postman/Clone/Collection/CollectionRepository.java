package com.rupesh.Postman.Clone.Collection;

import com.rupesh.Postman.Clone.Workspace.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {

    List<Collection> findByWorkspace(Workspace workspace);
    Optional<Collection> findByIdAndWorkspace(Long id, Workspace workspace);
}
