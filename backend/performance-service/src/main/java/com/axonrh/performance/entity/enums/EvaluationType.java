package com.axonrh.performance.entity.enums;

public enum EvaluationType {
    SELF,      // Apenas autoavaliacao
    MANAGER,   // Avaliacao pelo gestor
    PEERS_180, // 180 graus (self + gestor + pares)
    FULL_360   // 360 graus completo
}
