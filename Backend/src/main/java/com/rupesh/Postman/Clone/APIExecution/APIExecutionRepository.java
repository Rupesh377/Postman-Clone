package com.rupesh.Postman.Clone.APIExecution;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface APIExecutionRepository extends JpaRepository<APIExecution, Long> {

    List<APIExecution> findByApiRequestIdOrderByExecutedAtDesc(Long apiRequestId);
}