package com.rupesh.Postman.Clone.Authentication.Repository;

import com.rupesh.Postman.Clone.Authentication.Entity.EmailVerificationToken;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByToken(String token);

    Optional<EmailVerificationToken> findByUser(User user);

    void deleteByUser(User user);
}