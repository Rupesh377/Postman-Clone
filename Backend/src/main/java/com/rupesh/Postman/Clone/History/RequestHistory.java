package com.rupesh.Postman.Clone.History;

import com.rupesh.Postman.Clone.APIRequest.HttpMethod;
import com.rupesh.Postman.Clone.Authentication.Entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "request_history")
@Getter
@Setter
public class RequestHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String requestName;

    @Enumerated(EnumType.STRING)
    private HttpMethod method;

    @Column(length = 2000)
    private String url;

    private Integer statusCode;

    private Long responseTime;

    private LocalDateTime executedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}