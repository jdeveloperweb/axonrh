package com.axonrh.timesheet.dto;

import com.axonrh.timesheet.entity.enums.AdjustmentStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Response de ajuste de ponto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeAdjustmentResponse {

    private UUID id;

    private UUID employeeId;
    private String employeeName;

    private String adjustmentType;
    private String adjustmentTypeLabel;

    private UUID originalRecordId;

    private LocalDate recordDate;
    private RecordType recordType;
    private String recordTypeLabel;

    private LocalTime originalTime;
    private LocalTime requestedTime;

    private String justification;
    private List<String> attachmentUrls;

    private AdjustmentStatus status;
    private String statusLabel;

    private UUID approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String approvalNotes;

    private UUID createdRecordId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
