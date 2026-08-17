package com.rupesh.Postman.Clone.Authentication.OAuth2;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        OAuth2User oauthUser = delegate.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        if (!registrationId.equals("github")) {
            return oauthUser;
        }

        String email = getGithubEmail(userRequest);
        Map<String, Object> attributes = new java.util.HashMap<>(oauthUser.getAttributes());

        attributes.put("email", email);

        return new DefaultOAuth2User(List.of(new SimpleGrantedAuthority("ROLE_USER"))
                , attributes, "id");
    }

    private String getGithubEmail(OAuth2UserRequest userRequest) {

        String accessToken = userRequest.getAccessToken().getTokenValue();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("Accept", "application/vnd.github+json");

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<List> response =
                restTemplate.exchange("https://api.github.com/user/emails", HttpMethod.GET, entity, List.class);

        List<Map<String, Object>> emails = response.getBody();
        if (emails == null || emails.isEmpty()) {
            throw new RuntimeException("No email address found for GitHub account");
        }

        for (Map<String, Object> email : emails) {

            Boolean primary = (Boolean) email.get("primary");
            Boolean verified = (Boolean) email.get("verified");

            if (Boolean.TRUE.equals(primary) && Boolean.TRUE.equals(verified)) {
                return (String) email.get("email");
            }
        }

        for (Map<String, Object> email : emails) {
            Boolean verified = (Boolean) email.get("verified");

            if (Boolean.TRUE.equals(verified)) {return (String) email.get("email");
            }
        }
        throw new RuntimeException("No verified email found for GitHub account");
    }
}