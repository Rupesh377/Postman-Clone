package com.rupesh.Postman.Clone.WorkspaceMember;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Workspace.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

    List<WorkspaceMember> findByWorkspace(Workspace workspace);

    Optional<WorkspaceMember> findByWorkspaceAndUser(Workspace workspace, User user);

    boolean existsByWorkspaceAndUser(Workspace workspace, User user);

    void deleteByWorkspaceAndUser(Workspace workspace, User user);

    List<WorkspaceMember> findByUser(User user);

}
