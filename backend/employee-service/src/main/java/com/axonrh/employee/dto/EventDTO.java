package com.axonrh.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private String id;
    private String title;
    private String description;
    private LocalDateTime date;
    private String location;
    private String url;
    private String category;
    private String status;
    
    // Speaker info
    private String speakerName;
    private String speakerRole;
    private String speakerBio;
    private String speakerLinkedin;
    private String speakerAvatarUrl;
    
    private List<EventResourceDTO> resources;
    private long registrationCount;
    @com.fasterxml.jackson.annotation.JsonProperty("isUserRegistered")
    private boolean isUserRegistered;
}
