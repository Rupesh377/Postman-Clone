package com.rupesh.Postman.Clone.Environment;
import com.rupesh.Postman.Clone.Environment.EnvironmentVariable.EnvironmentVariableRequestDTO;
import com.rupesh.Postman.Clone.Environment.EnvironmentVariable.EnvironmentVariableResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/environments")
@RequiredArgsConstructor
public class EnvironmentController {

    private final EnvironmentService environmentService;

    @PostMapping
    public ResponseEntity<EnvironmentResponseDTO> createEnvironment(@Valid @RequestBody EnvironmentRequestDTO request,
            Authentication authentication) {

        return ResponseEntity.status(HttpStatus.CREATED).body(environmentService.createEnvironment(request, authentication));
    }

    @GetMapping
    public ResponseEntity<List<EnvironmentResponseDTO>> getMyEnvironments(Authentication authentication){

        return ResponseEntity.ok(environmentService.getMyEnvironments(authentication));
    }

    @GetMapping("/{environmentId}")
    public ResponseEntity<EnvironmentResponseDTO> getEnvironment(@PathVariable Long environmentId, Authentication authentication) {

        return ResponseEntity.ok(environmentService.getEnvironment(environmentId, authentication));
    }

    @PostMapping("/{environmentId}/variables")
    public ResponseEntity<EnvironmentVariableResponseDTO> addVariable(@PathVariable Long environmentId,
                                                                      @Valid @RequestBody EnvironmentVariableRequestDTO request, Authentication authentication) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(environmentService.addVariable(environmentId, request, authentication));
    }

    @PutMapping("/{environmentId}/variables/{variableId}")
    public ResponseEntity<EnvironmentVariableResponseDTO> updateVariable(@PathVariable Long environmentId, @PathVariable Long variableId,
            @Valid @RequestBody EnvironmentVariableRequestDTO request, Authentication authentication) {

        return ResponseEntity.ok(environmentService.updateVariable(environmentId, variableId, request, authentication));
    }

    @DeleteMapping("/{environmentId}/variables/{variableId}")
    public ResponseEntity<Void> deleteVariable(@PathVariable Long environmentId, @PathVariable Long variableId,
                                               Authentication authentication) {

        environmentService.deleteVariable(environmentId, variableId, authentication);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{environmentId}")
    public ResponseEntity<Void> deleteEnvironment(@PathVariable Long environmentId, Authentication authentication) {

        environmentService.deleteEnvironment(environmentId, authentication);
        return ResponseEntity.noContent().build();
    }
}
