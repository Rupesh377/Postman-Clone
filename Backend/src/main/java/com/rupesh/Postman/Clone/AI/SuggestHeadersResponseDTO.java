package com.rupesh.Postman.Clone.AI;

import java.util.List;

public class SuggestHeadersResponseDTO {

    private List<HeaderSuggestion> headers;
    private String authenticationSuggestion;
    private String explanation;

    public SuggestHeadersResponseDTO() {
    }

    public SuggestHeadersResponseDTO(List<HeaderSuggestion> headers, String authenticationSuggestion, String explanation) {
        this.headers = headers;
        this.authenticationSuggestion = authenticationSuggestion;
        this.explanation = explanation;
    }

    public List<HeaderSuggestion> getHeaders() {
        return headers;
    }

    public void setHeaders(List<HeaderSuggestion> headers) {
        this.headers = headers;
    }

    public String getAuthenticationSuggestion() {
        return authenticationSuggestion;
    }

    public void setAuthenticationSuggestion(
            String authenticationSuggestion) {
        this.authenticationSuggestion = authenticationSuggestion;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public static class HeaderSuggestion {

        private String name;
        private String value;
        private String reason;

        public HeaderSuggestion() {
        }

        public HeaderSuggestion(String name, String value, String reason) {
            this.name = name;
            this.value = value;
            this.reason = reason;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
