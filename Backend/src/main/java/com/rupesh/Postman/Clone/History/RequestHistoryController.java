package com.rupesh.Postman.Clone.History;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class RequestHistoryController {

    private final RequestHistoryService requestHistoryService;

    @GetMapping
    public Page<RequestHistoryResponseDTO> getHistory(Authentication authentication, Pageable pageable)
    {
        return requestHistoryService.getHistory(authentication, pageable);
    }


    @GetMapping("/{historyId}")
    public RequestHistoryResponseDTO getHistoryById(@PathVariable Long historyId, Authentication authentication)
    {
        return requestHistoryService.getHistoryById(historyId, authentication);
    }


    @DeleteMapping("/{historyId}")
    public String deleteHistory(@PathVariable Long historyId, Authentication authentication)
    {
        requestHistoryService.deleteHistory(historyId, authentication);
        return "History deleted successfully";
    }


    @DeleteMapping
    public String deleteAllHistory(Authentication authentication)
    {
        requestHistoryService.deleteAllHistory(authentication);
        return "All history deleted successfully";
    }
}
