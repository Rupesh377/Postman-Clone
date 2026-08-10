package com.rupesh.Postman.Clone.Authentication.Service;

import com.rupesh.Postman.Clone.Authentication.DTO.*;
import com.rupesh.Postman.Clone.Authentication.Entity.RefreshToken;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Enum.AuthProvider;
import com.rupesh.Postman.Clone.Authentication.Enum.Role;
import com.rupesh.Postman.Clone.Authentication.Repository.RefreshTokenRepository;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Exception.BadRequestException;
import com.rupesh.Postman.Clone.Exception.DuplicateResourceException;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {

        Boolean check = userRepository.existsByEmail(request.getEmail());
        if (check) {
            throw new DuplicateResourceException("Email is already registered.");
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(AuthProvider.LOCAL)
                .role(Role.USER)
                .emailVerified(false)
                .build();

        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .user(UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .emailVerified(user.isEmailVerified())
                        .build())
                .build();
    }

    public AuthResponse login(LoginRequest request) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Invalid email or password");
        }
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(()->new ResourceNotFoundException("User not found."));

        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new BadRequestException("Please login using " + user.getProvider());
        }
        refreshTokenRepository.deleteByUser(user);

        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .user(UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .emailVerified(user.isEmailVerified())
                        .build())
                .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {

        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());
        User user = refreshToken.getUser();
        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                .user(UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .emailVerified(user.isEmailVerified())
                        .build())
                .build();
    }

    public void logout(User user) {
        refreshTokenService.deleteRefreshToken(user);
    }
}
