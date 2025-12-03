package citu.stde.dto;

public record EvaluationResponse(
    Integer completenessScore,
    String completenessFeedback,
    Integer clarityScore,
    String clarityFeedback,
    Integer consistencyScore,
    String consistencyFeedback,
    Integer verificationScore,
    String verificationFeedback,
    Integer overallScore,
    String overallFeedback
) {}