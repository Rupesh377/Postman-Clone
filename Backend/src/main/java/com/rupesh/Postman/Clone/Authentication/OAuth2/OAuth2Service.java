package com.rupesh.Postman.Clone.Authentication.OAuth2;

import com.rupesh.Postman.Clone.Authentication.DTO.AuthResponse;
import com.rupesh.Postman.Clone.Authentication.DTO.UserResponse;
import com.rupesh.Postman.Clone.Authentication.Entity.RefreshToken;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Enum.AuthProvider;
import com.rupesh.Postman.Clone.Authentication.Enum.Role;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Authentication.Service.JwtService;
import com.rupesh.Postman.Clone.Authentication.Service.RefreshTokenService;
import com.rupesh.Postman.Clone.Exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class OAuth2Service {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthResponse login(String email, String name, AuthProvider provider) {


        User user;
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            user = existingUser.get();

            if (user.getProvider() != provider) {
                throw new BadRequestException("This email is already registered with " + user.getProvider());
            }
        } else {
            user = User.builder()
                    .name(name)
                    .email(email)
                    .provider(provider)
                    .role(Role.USER)
                    .emailVerified(true)
                    .build();
            userRepository.save(user);

        }
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
}