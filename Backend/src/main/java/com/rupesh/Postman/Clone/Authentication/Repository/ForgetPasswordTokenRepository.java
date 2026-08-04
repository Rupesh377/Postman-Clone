package com.rupesh.Postman.Clone.Authentication.Repository;

import com.rupesh.Postman.Clone.Authentication.Entity.ForgetPasswordToken;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ForgetPasswordTokenRepository extends JpaRepository<ForgetPasswordToken, UUID> {

    Optional<ForgetPasswordToken> findByToken(String token);

    void deleteByUser(User user);
}