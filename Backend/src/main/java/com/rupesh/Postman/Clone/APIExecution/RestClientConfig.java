package com.rupesh.Postman.Clone.APIExecution;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        JdkClientHttpRequestFactory factory =
                new JdkClientHttpRequestFactory(httpClient);

        factory.setReadTimeout(Duration.ofSeconds(30));

        return RestClient.builder()
                .requestFactory(factory)
                .build();
    }
}