package com.rupesh.Postman.Clone.WorkspaceMember;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Workspace.Workspace;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "workspace_members", uniqueConstraints = {@UniqueConstraint(columnNames = {"workspace_id", "user_id"})})
public class WorkspaceMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkspaceRole role;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    public void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
