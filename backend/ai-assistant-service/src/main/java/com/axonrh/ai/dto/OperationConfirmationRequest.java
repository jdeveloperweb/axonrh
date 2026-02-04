package com.axonrh.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for confirming or rejecting a pending operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationConfirmationRequest {

    /**
     * The operation ID to confirm or reject.
     */
    private UUID operationId;

    /**
     * Whether to confirm (true) or reject (false) the operation.
     */
    private boolean confirmed;

    /**
     * Optional reason for rejection.
     */
    private String rejectionReason;

    /**
     * Optional: Additional verification (e.g., password, 2FA code).
     */
    private String verificationCode;

    /**
     * Optional: Conversation context for tracking.
     */
    private String conversationId;
}
