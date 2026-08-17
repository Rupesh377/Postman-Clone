package com.rupesh.Postman.Clone.Workspace;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import org.hibernate.jdbc.Work;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    List<Workspace> findByOwner(User owner);

    Boolean existsByName(String name);
}
