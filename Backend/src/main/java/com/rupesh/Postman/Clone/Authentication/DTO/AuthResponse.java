package com.rupesh.Postman.Clone.Authentication.DTO;

import com.rupesh.Postman.Clone.Authentication.Enum.Role;

import java.util.UUID;

public class AuthResponse {

    private String accessToken;

    private String refreshToken;

    private UserResponse user;

    private String tokenType;

}
