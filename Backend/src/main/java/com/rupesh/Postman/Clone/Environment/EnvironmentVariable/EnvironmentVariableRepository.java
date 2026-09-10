package com.rupesh.Postman.Clone.Environment.EnvironmentVariable;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EnvironmentVariableRepository extends JpaRepository<EnvironmentVariable, Long> {

    Optional<EnvironmentVariable> findByIdAndEnvironmentId(Long id, Long environmentId);

    Optional<EnvironmentVariable> findByVariableKeyAndEnvironmentId(String variableKey, Long environmentId);

    boolean existsByVariableKeyAndEnvironmentId(String variableKey, Long environmentId);
}