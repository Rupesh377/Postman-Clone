package com.rupesh.Postman.Clone.Authentication.OAuth2;

import com.rupesh.Postman.Clone.Authentication.DTO.AuthResponse;
import com.rupesh.Postman.Clone.Authentication.Enum.AuthProvider;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Authentication.Service.JwtService;
import com.rupesh.Postman.Clone.Authentication.Service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final OAuth2Service oAuth2Service;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {

        OAuth2User oAuthUser = (OAuth2User) authentication.getPrincipal();
        String registrationId = ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId();

        String email = oAuthUser.getAttribute("email");
        String name = oAuthUser.getAttribute("name");

        AuthProvider provider = registrationId.equals("google") ? AuthProvider.GOOGLE : AuthProvider.GITHUB;

        AuthResponse authResponse = oAuth2Service.login(email, name, provider);

        String redirectUrl = "http://localhost:5173/oauth/success"
                        + "?accessToken=" + authResponse.getAccessToken()
                        + "&refreshToken=" + authResponse.getRefreshToken();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}