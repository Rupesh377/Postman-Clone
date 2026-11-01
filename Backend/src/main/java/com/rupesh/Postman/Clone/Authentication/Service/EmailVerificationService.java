package com.rupesh.Postman.Clone.Authentication.Service;

import com.rupesh.Postman.Clone.Authentication.Entity.EmailVerificationToken;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Enum.AuthProvider;
import com.rupesh.Postman.Clone.Authentication.Repository.EmailVerificationTokenRepository;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Exception.BadRequestException;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Transactional
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.email-verification.expiration-seconds:900}")
    private long expirationSeconds;

    public void sendVerificationEmail(User user) {

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified.");
        }

        tokenRepository.deleteByUser(user);
        tokenRepository.flush();

        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);

        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                        .token(token)
                        .user(user)
                        .expiryDate(Instant.now().plusSeconds(expirationSeconds))
                        .used(false)
                        .build();

        tokenRepository.saveAndFlush(verificationToken);

        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationLink);
    }


    public void verifyEmail(String token) {

        if (token == null || token.isBlank()) {
            throw new BadRequestException("Verification token is required.");
        }

        EmailVerificationToken verificationToken = tokenRepository.findByToken(token)
                        .orElseThrow(() -> new BadRequestException("Invalid verification token."));

        if (verificationToken.isUsed()) {
            throw new BadRequestException("This verification link has already been used.");
        }

        if (verificationToken.getExpiryDate().isBefore(Instant.now())) {
            throw new BadRequestException("Verification link has expired. Please request a new one.");
        }

        User user = verificationToken.getUser();

        if (user.isEmailVerified()) {
            tokenRepository.delete(verificationToken);
            return;
        }

        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        tokenRepository.save(verificationToken);
    }


    public void resendVerificationEmail(String email) {

        User user = userRepository.findByEmail(email).orElseThrow(() ->
                        new BadRequestException("Unable to process verification request."));

        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new BadRequestException("This account uses " + user.getProvider() + " authentication.");
        }

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified.");
        }

        sendVerificationEmail(user);
    }
}