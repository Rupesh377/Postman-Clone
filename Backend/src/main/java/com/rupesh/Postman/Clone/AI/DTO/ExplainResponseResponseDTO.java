package com.rupesh.Postman.Clone.AI.DTO;

public class ExplainResponseResponseDTO {

    private String explanation;
    private String possibleCause;
    private String suggestedFixes;
    private String severity;
    private String responseType;

    public ExplainResponseResponseDTO() {
    }

    public ExplainResponseResponseDTO(
            String explanation,
            String possibleCause,
            String suggestedFixes,
            String severity,
            String responseType
    ) {
        this.explanation = explanation;
        this.possibleCause = possibleCause;
        this.suggestedFixes = suggestedFixes;
        this.severity = severity;
        this.responseType = responseType;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getPossibleCause() {
        return possibleCause;
    }

    public void setPossibleCause(String possibleCause) {
        this.possibleCause = possibleCause;
    }

    public String getSuggestedFixes() {
        return suggestedFixes;
    }

    public void setSuggestedFixes(String suggestedFixes) {
        this.suggestedFixes = suggestedFixes;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getResponseType() {
        return responseType;
    }

    public void setResponseType(String responseType) {
        this.responseType = responseType;
    }
}