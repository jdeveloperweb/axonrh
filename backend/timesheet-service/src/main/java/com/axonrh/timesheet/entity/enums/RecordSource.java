package com.axonrh.timesheet.entity.enums;

/**
 * Fonte do registro de ponto.
 */
public enum RecordSource {
    WEB,            // Portal web
    MOBILE,         // Aplicativo mobile
    REP,            // Registrador Eletronico de Ponto (Portaria 671)
    BIOMETRIC,      // Biometrico
    FACIAL,         // Reconhecimento facial
    MANUAL,         // Registro manual (ajuste)
    IMPORT          // Importacao AFD
}
