package com.axonrh.vacation.service;

import com.axonrh.vacation.entity.VacationRequest;
import org.springframework.stereotype.Service;

@Service
public class VacationDocumentService {

    public String generateNotice(VacationRequest request) {
        return buildDocumentUrl("notice", request.getId());
    }

    public String generateReceipt(VacationRequest request) {
        return buildDocumentUrl("receipt", request.getId());
    }

    private String buildDocumentUrl(String documentType, Object requestId) {
        return String.format("vacation/%s/%s.pdf", documentType, requestId);
    }
}
