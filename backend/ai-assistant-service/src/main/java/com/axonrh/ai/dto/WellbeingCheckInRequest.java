package com.axonrh.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellbeingCheckInRequest {
    private UUID employeeId;
    private Integer score;
    private String notes;
    private boolean wantsEapContact;
    private String source;
}
