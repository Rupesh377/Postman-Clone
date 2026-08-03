package com.rupesh.Postman.Clone.Authentication.Controller;

import com.rupesh.Postman.Clone.Authentication.DTO.AuthResponse;
import com.rupesh.Postman.Clone.Authentication.DTO.LoginRequest;
import com.rupesh.Postman.Clone.Authentication.DTO.RefreshTokenRequest;
import com.rupesh.Postman.Clone.Authentication.DTO.RegisterRequest;
import com.rupesh.Postman.Clone.Authentication.Security.CustomUserDetails;
import com.rupesh.Postman.Clone.Authentication.Service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        authService.logout(userDetails.getUser());
        return ResponseEntity.noContent().build();
    }
}
