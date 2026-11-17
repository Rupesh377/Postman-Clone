package com.rupesh.Postman.Clone.APIExecution;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface APIExecutionRepository extends JpaRepository<APIExecution, Long> {

    List<APIExecution> findByApiRequestIdOrderByExecutedAtDesc(Long apiRequestId);
    Optional<APIExecution> findById(Long id);

}