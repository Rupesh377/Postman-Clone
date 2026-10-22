package com.rupesh.Postman.Clone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@SpringBootApplication
public class PostmanCloneApplication {

	public static void main(String[] args) throws IOException, InterruptedException {
		SpringApplication.run(PostmanCloneApplication.class, args);
	}
}