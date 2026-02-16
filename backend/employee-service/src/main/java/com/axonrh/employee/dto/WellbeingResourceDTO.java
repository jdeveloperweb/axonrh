package com.axonrh.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellbeingResourceDTO {
    private String id;
    private String title;
    private String description;
    private String url;
    private String type; // e.g. "GUIDE", "VIDEO", "ARTICLE"
}
