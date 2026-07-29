package com.rupesh.Postman.Clone.Authentication.DTO;

import com.rupesh.Postman.Clone.Authentication.Enum.Role;

import java.util.UUID;

public class UserResponse {

    private UUID id;
    private String name;
    private String email;
    private Role role;
    private boolean emailVerified;
}
