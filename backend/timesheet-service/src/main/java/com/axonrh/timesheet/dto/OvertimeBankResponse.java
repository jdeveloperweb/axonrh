package com.axonrh.timesheet.dto;

import com.axonrh.timesheet.entity.enums.OvertimeBankType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response de movimentacao do banco de horas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeBankResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;

    private OvertimeBankType type;
    private String typeLabel;

    private LocalDate referenceDate;

    private Integer minutes;
    private String minutesFormatted;
    private Boolean isCredit;

    private Integer balanceAfter;
    private String balanceAfterFormatted;

    private LocalDate expirationDate;
    private Boolean expired;
    private Integer daysUntilExpiration;

    private Double multiplier;
    private Integer originalMinutes;
    private String originalMinutesFormatted;

    private String description;

    private UUID approvedBy;
    private String approvedByName;
    private LocalDateTime approvedAt;

    private LocalDateTime createdAt;
}
