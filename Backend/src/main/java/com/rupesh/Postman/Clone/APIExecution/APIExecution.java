package com.rupesh.Postman.Clone.APIExecution;

import com.rupesh.Postman.Clone.APIRequest.ApiRequest;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "api_executions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class APIExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_request_id", nullable = false)
    private ApiRequest apiRequest;

    private int statusCode;

    @Column(columnDefinition = "TEXT")
    private String responseHeaders;

    @Column(columnDefinition = "LONGTEXT")
    private String responseBody;

    private long responseTime;

    private LocalDateTime executedAt;
}