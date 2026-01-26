package com.axonrh.vacation.dto;

import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import com.axonrh.vacation.entity.enums.VacationRequestType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacationRequestResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID vacationPeriodId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer daysCount;
    private VacationRequestType requestType;
    private String requestTypeLabel;
    private Integer fractionNumber;
    private boolean sellDays;
    private Integer soldDaysCount;
    private boolean advance13thSalary;
    private VacationRequestStatus status;
    private String statusLabel;
    private UUID approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String approvalNotes;
    private String rejectionReason;
    private LocalDate paymentDate;
    private BigDecimal paymentValue;
    private String noticeDocumentUrl;
    private String receiptDocumentUrl;
    private String notes;
    private LocalDateTime createdAt;
    private boolean canCancel;
}
