package com.axonrh.timesheet.entity.enums;

/**
 * Tipo de escala de trabalho.
 */
public enum ScheduleType {
    FIXED,          // Horario fixo (ex: 08:00-17:00)
    FLEXIBLE,       // Horario flexivel (banco de horas)
    SHIFT,          // Por turnos (12x36, 5x2, etc.)
    PART_TIME,      // Meio periodo
    INTERMITTENT    // Intermitente
}
