package com.rupesh.Postman.Clone.Environment;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import com.rupesh.Postman.Clone.Environment.EnvironmentVariable.EnvironmentVariable;
import com.rupesh.Postman.Clone.Environment.EnvironmentVariable.EnvironmentVariableRepository;
import com.rupesh.Postman.Clone.Environment.EnvironmentVariable.EnvironmentVariableRequestDTO;
import com.rupesh.Postman.Clone.Environment.EnvironmentVariable.EnvironmentVariableResponseDTO;
import com.rupesh.Postman.Clone.Exception.DuplicateResourceException;
import com.rupesh.Postman.Clone.Exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnvironmentService {

    private final EnvironmentRepository environmentRepository;
    private final EnvironmentVariableRepository variableRepository;
    private final UserRepository userRepository;

    @Transactional
    public EnvironmentResponseDTO createEnvironment(EnvironmentRequestDTO request, Authentication authentication) {

        User user = getUser(authentication);
        if (environmentRepository.existsByNameAndOwner(request.getName(), user)) {
            throw new DuplicateResourceException("Environment with this name already exists");
        }

        Environment environment = Environment.builder()
                .name(request.getName())
                .owner(user)
                .build();

        environmentRepository.save(environment);
        return mapToResponse(environment);
    }

    public List<EnvironmentResponseDTO> getMyEnvironments(Authentication authentication) {

        User user = getUser(authentication);
        return environmentRepository.findByOwner(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public EnvironmentResponseDTO getEnvironment(Long environmentId, Authentication authentication) {

        User user = getUser(authentication);
        Environment environment = environmentRepository.findByIdAndOwner(environmentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Environment not found"));

        return mapToResponse(environment);
    }

    @Transactional
    public EnvironmentVariableResponseDTO addVariable(Long environmentId,
                                                      EnvironmentVariableRequestDTO request, Authentication authentication) {

        User user = getUser(authentication);

        Environment environment = environmentRepository.findByIdAndOwner(environmentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Environment not found"));

        if (variableRepository.existsByVariableKeyAndEnvironmentId(request.getVariableKey(), environmentId)) {
            throw new DuplicateResourceException("Variable with this key already exists");
        }

        EnvironmentVariable variable = EnvironmentVariable.builder()
                .variableKey(request.getVariableKey())
                .variableValue(request.getVariableValue())
                .environment(environment)
                .build();

        variableRepository.save(variable);
        return mapVariableToResponse(variable);
    }

    @Transactional
    public EnvironmentVariableResponseDTO updateVariable(Long environmentId, Long variableId,
                           EnvironmentVariableRequestDTO request, Authentication authentication) {

        User user = getUser(authentication);

        Environment environment = environmentRepository.findByIdAndOwner(environmentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Environment not found"));

        EnvironmentVariable variable = variableRepository.findByIdAndEnvironmentId(variableId, environmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Variable not found"));

        variable.setVariableKey(request.getVariableKey());
        variable.setVariableValue(request.getVariableValue());

        variableRepository.save(variable);
        return mapVariableToResponse(variable);
    }

    @Transactional
    public void deleteVariable(Long environmentId, Long variableId, Authentication authentication) {

        User user = getUser(authentication);
        environmentRepository.findByIdAndOwner(environmentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Environment not found"));

        EnvironmentVariable variable = variableRepository.findByIdAndEnvironmentId(variableId, environmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Variable not found"));
        variableRepository.delete(variable);
    }

    @Transactional
    public void deleteEnvironment(Long environmentId, Authentication authentication) {

        User user = getUser(authentication);
        Environment environment = environmentRepository.findByIdAndOwner(environmentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Environment not found"));

        environmentRepository.delete(environment);
    }

    private User getUser(Authentication authentication) {

        String email = authentication.getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private EnvironmentResponseDTO mapToResponse(Environment environment) {

        List<EnvironmentVariableResponseDTO> variables =
                environment.getVariables()
                        .stream()
                        .map(this::mapVariableToResponse)
                        .toList();

        return EnvironmentResponseDTO.builder()
                .id(environment.getId())
                .name(environment.getName())
                .variables(variables)
                .build();
    }

    private EnvironmentVariableResponseDTO mapVariableToResponse(EnvironmentVariable variable) {

        return EnvironmentVariableResponseDTO.builder()
                .id(variable.getId())
                .variableKey(variable.getVariableKey())
                .variableValue(variable.getVariableValue())
                .build();
    }
}