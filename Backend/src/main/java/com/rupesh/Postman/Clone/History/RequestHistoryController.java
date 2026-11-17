
package com.rupesh.Postman.Clone.History;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class RequestHistoryController {

    private final RequestHistoryService requestHistoryService;

    @GetMapping
    public ResponseEntity<Page<RequestHistoryResponseDTO>> getHistory(Authentication authentication, Pageable pageable) {

        return ResponseEntity.ok(requestHistoryService.getHistory(authentication, pageable));
    }

    @GetMapping("/{historyId}")
    public ResponseEntity<RequestHistoryResponseDTO> getHistoryById(@PathVariable Long historyId, Authentication authentication) {

        return ResponseEntity.ok(requestHistoryService.getHistoryById(historyId, authentication));
    }

    @DeleteMapping("/{historyId}")
    public ResponseEntity<String> deleteHistory(@PathVariable Long historyId, Authentication authentication) {

        requestHistoryService.deleteHistory(historyId, authentication);
        return ResponseEntity.ok("History deleted successfully");
    }

    @DeleteMapping
    public ResponseEntity<String> deleteAllHistory(Authentication authentication) {

        requestHistoryService.deleteAllHistory(authentication);
        return ResponseEntity.ok("All history deleted successfully");
    }
}
