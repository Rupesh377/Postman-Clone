package com.rupesh.Postman.Clone.Authentication.DTO;

import com.rupesh.Postman.Clone.Authentication.Enum.Role;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {

    private String accessToken;

    private String refreshToken;

    private UserResponse user;

    private String tokenType;

}
