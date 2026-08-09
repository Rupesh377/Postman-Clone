package com.rupesh.Postman.Clone.Authentication.Repository;

import com.rupesh.Postman.Clone.Authentication.Entity.RefreshToken;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUser(User user);

    Optional<RefreshToken> findByUser(User user);
}
