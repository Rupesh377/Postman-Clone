package com.rupesh.Postman.Clone.Authentication.OAuth2;

import com.rupesh.Postman.Clone.Authentication.Entity.RefreshToken;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Enum.AuthProvider;
import com.rupesh.Postman.Clone.Authentication.Enum.Role;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Authentication.Service.JwtService;
import com.rupesh.Postman.Clone.Authentication.Service.RefreshTokenService;
import com.rupesh.Postman.Clone.Exception.BadRequestException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        User user;
        Optional<User> existing = userRepository.findByEmail(email);

        if (existing.isPresent()) {
            user = existing.get();
            if (user.getProvider() != AuthProvider.GOOGLE) {
                throw new BadRequestException("This email is registered with " + user.getProvider());
            }
        } else {
             user = User.builder()
                    .name(name)
                    .email(email)
                    .provider(AuthProvider.GOOGLE)
                    .role(Role.USER)
                    .emailVerified(true)
                    .build();
            userRepository.save(user);
        }
        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        String redirectUrl =
                "http://localhost:5173/oauth/success"
                        + "?accessToken=" + accessToken
                        + "&refreshToken=" + refreshToken.getToken();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
