package com.rupesh.Postman.Clone.Environment;


import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnvironmentRequestDTO {

    @NotBlank
    private String name;
}