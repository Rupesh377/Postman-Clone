package com.rupesh.Postman.Clone.Authentication.Service;

import com.rupesh.Postman.Clone.Authentication.DTO.ForgetPasswordRequest;
import com.rupesh.Postman.Clone.Authentication.DTO.ResetPasswordRequest;
import com.rupesh.Postman.Clone.Authentication.Entity.ForgetPasswordToken;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.ForgetPasswordTokenRepository;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Exception.BadRequestException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ForgetPasswordService {

    private final UserRepository userRepository;
    private final ForgetPasswordTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public void forgotPassword(ForgetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            return;
        }

        tokenRepository.deleteByUser(user);
        String token = UUID.randomUUID().toString();

        ForgetPasswordToken forgotPasswordToken = ForgetPasswordToken.builder()
                        .token(token)
                        .user(user)
                        .expiryDate(Instant.now().plusSeconds(900))
                        .build();
        tokenRepository.deleteByUser(user);
        tokenRepository.save(forgotPasswordToken);
        String link = "http://localhost:5173/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), link);
    }


    public void resetPassword(ResetPasswordRequest request) {

        ForgetPasswordToken token = tokenRepository.findByToken(request.getToken())
                        .orElseThrow(() -> new BadRequestException("Invalid token."));

        if (token.getExpiryDate().isBefore(Instant.now())) {
            tokenRepository.delete(token);
            throw new BadRequestException("Token has expired.");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        tokenRepository.delete(token);
    }
}
