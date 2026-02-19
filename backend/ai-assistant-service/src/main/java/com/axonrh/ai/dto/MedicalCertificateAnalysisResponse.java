package com.axonrh.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalCertificateAnalysisResponse {
    private String cid;
    private String cidDescription;
    private String doctorName;
    private String crm;
    private Integer days;
    private String date;
}
