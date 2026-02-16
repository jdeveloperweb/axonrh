package com.axonrh.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellbeingCampaignDTO {
    private String id;
    private String title;
    private String description;
    private LocalDateTime date;
    private String location; // e.g. "Workshop Online", "Sala 3"
    private String status; // "UPCOMING", "ONGOING", "FINISHED"
}
