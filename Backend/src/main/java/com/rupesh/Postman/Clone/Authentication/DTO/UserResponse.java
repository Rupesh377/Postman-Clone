package com.rupesh.Postman.Clone.Authentication.DTO;

import com.rupesh.Postman.Clone.Authentication.Enum.Role;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserResponse {

    private UUID id;
    private String name;
    private String email;
    private Role role;
    private boolean emailVerified;
}
