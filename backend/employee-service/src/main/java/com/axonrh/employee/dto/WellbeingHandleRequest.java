package com.axonrh.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellbeingHandleRequest {
    private String actionTaken;
    private String evaluation; // EXCELLENT, NORMAL, ATTENTION, CRITICAL
}
