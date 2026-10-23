package com.rupesh.Postman.Clone.AI;

public class ExplainResponseResponseDTO {

    private String explanation;
    private String possibleCause;
    private String suggestedFixes;

    public ExplainResponseResponseDTO() {
    }

    public ExplainResponseResponseDTO(String explanation, String possibleCause, String suggestedFixes) {
        this.explanation = explanation;
        this.possibleCause = possibleCause;
        this.suggestedFixes = suggestedFixes;
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
}
