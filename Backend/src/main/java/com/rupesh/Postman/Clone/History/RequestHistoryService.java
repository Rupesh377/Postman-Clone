package com.rupesh.Postman.Clone.History;

import com.rupesh.Postman.Clone.APIRequest.HttpMethod;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import com.rupesh.Postman.Clone.Authentication.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RequestHistoryService {

    private final RequestHistoryRepository requestHistoryRepository;
    private final UserRepository userRepository;

    public void saveHistory(String requestName, HttpMethod method, String url, Integer statusCode,
                            Long responseTime, Authentication authentication) {

        User user = getLoggedInUser(authentication);
        RequestHistory history = new RequestHistory();

        history.setRequestName(requestName);
        history.setMethod(method);
        history.setUrl(url);
        history.setStatusCode(statusCode);
        history.setResponseTime(responseTime);
        history.setExecutedAt(LocalDateTime.now());
        history.setUser(user);

        requestHistoryRepository.save(history);
    }


    public Page<RequestHistoryResponseDTO> getHistory(Authentication authentication, Pageable pageable) {

        User user = getLoggedInUser(authentication);
        Page<RequestHistory> historyPage = requestHistoryRepository.findByUser(user, pageable);
        return historyPage.map(this::convertToDTO);
    }


    public RequestHistoryResponseDTO getHistoryById(Long historyId, Authentication authentication) {

        User user = getLoggedInUser(authentication);
        RequestHistory history = requestHistoryRepository.findById(historyId)
                        .orElseThrow(() -> new RuntimeException("History not found"));

        if (!history.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not allowed to access this history");
        }
        return convertToDTO(history);
    }


    public void deleteHistory(Long historyId, Authentication authentication) {

        User user = getLoggedInUser(authentication);
        RequestHistory history = requestHistoryRepository.findById(historyId)
                        .orElseThrow(() -> new RuntimeException("History not found"));

        if (!history.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not allowed to delete this history");
        }

        requestHistoryRepository.delete(history);
    }


    public void deleteAllHistory(Authentication authentication) {
        User user = getLoggedInUser(authentication);
        Page<RequestHistory> historyPage = requestHistoryRepository.findByUser(user, Pageable.unpaged());

        requestHistoryRepository.deleteAll(historyPage.getContent());
    }


    private RequestHistoryResponseDTO convertToDTO(RequestHistory history) {

        RequestHistoryResponseDTO dto = new RequestHistoryResponseDTO();
        dto.setId(history.getId());
        dto.setRequestName(history.getRequestName());
        dto.setMethod(history.getMethod());
        dto.setUrl(history.getUrl());
        dto.setStatusCode(history.getStatusCode());
        dto.setResponseTime(history.getResponseTime());
        dto.setExecutedAt(history.getExecutedAt());

        return dto;
    }

    private User getLoggedInUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
