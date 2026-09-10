package com.rupesh.Postman.Clone.Environment;

import com.rupesh.Postman.Clone.Authentication.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {

    List<Environment> findByOwner(User owner);

    Optional<Environment> findByIdAndOwner(Long id, User owner);

    boolean existsByNameAndOwner(String name, User owner);
}
