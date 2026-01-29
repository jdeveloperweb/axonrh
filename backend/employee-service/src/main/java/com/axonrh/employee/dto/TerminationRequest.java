package com.axonrh.employee.dto;

import com.axonrh.employee.entity.enums.TerminationNoticePeriod;
import com.axonrh.employee.entity.enums.TerminationType;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class TerminationRequest {
    private UUID employeeId;
    private TerminationType terminationType;
    private TerminationNoticePeriod noticePeriod;
    private LocalDate lastWorkDay;
    private LocalDate terminationDate;
    private String reason;
    
    // Checklist
    private Boolean returnedLaptop;
    private Boolean returnedMouse;
    private Boolean returnedKeyboard;
    private Boolean returnedHeadset;
    private Boolean returnedBadge;
    private Boolean returnedToken;
    private String otherEquipment;
    private String equipmentNotes;
    
    // Status
    private Boolean accountDeactivated;
    private Boolean emailDeactivated;
    private Boolean exitInterviewDone;
}
