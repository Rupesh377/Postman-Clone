package com.rupesh.Postman.Clone.Environment.EnvironmentVariable;

import com.rupesh.Postman.Clone.Environment.Environment;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "environment_variables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnvironmentVariable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String variableKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String variableValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "environment_id", nullable = false)
    private Environment environment;
}
