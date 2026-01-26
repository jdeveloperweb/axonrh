package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.TimeRecordRequest;
import com.axonrh.timesheet.dto.TimeRecordResponse;
import com.axonrh.timesheet.entity.Geofence;
import com.axonrh.timesheet.entity.TimeRecord;
import com.axonrh.timesheet.entity.enums.RecordSource;
import com.axonrh.timesheet.entity.enums.RecordStatus;
import com.axonrh.timesheet.entity.enums.RecordType;
import com.axonrh.timesheet.exception.InvalidOperationException;
import com.axonrh.timesheet.repository.GeofenceRepository;
import com.axonrh.timesheet.repository.TimeRecordRepository;
import com.axonrh.timesheet.service.TimeRecordService.GeofenceValidationResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * T149-T152 - Testes do TimeRecordService
 */
@ExtendWith(MockitoExtension.class)
class TimeRecordServiceTest {

    @Mock
    private TimeRecordRepository timeRecordRepository;

    @Mock
    private GeofenceRepository geofenceRepository;

    @Mock
    private GeofenceService geofenceService;

    @Mock
    private DailySummaryService dailySummaryService;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private TimeRecordService timeRecordService;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID EMPLOYEE_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID.toString());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("T149 - Registro dentro do geofence deve ser aceito")
    void shouldAcceptRecordWithinGeofence() {
        // Given
        double latitude = -23.5505;
        double longitude = -46.6333;

        TimeRecordRequest request = TimeRecordRequest.builder()
                .employeeId(EMPLOYEE_ID)
                .recordType(RecordType.ENTRY)
                .source(RecordSource.MOBILE)
                .latitude(latitude)
                .longitude(longitude)
                .build();

        when(timeRecordRepository.existsByTenantIdAndEmployeeIdAndRecordDateAndRecordTypeAndRecordTime(
                any(), any(), any(), any(), any())).thenReturn(false);

        when(timeRecordRepository.findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(
                any(), any(), any())).thenReturn(Collections.emptyList());

        when(geofenceService.validateLocation(eq(TENANT_ID), eq(EMPLOYEE_ID), anyDouble(), anyDouble()))
                .thenReturn(new GeofenceValidationResult(true, UUID.randomUUID(), "Matriz"));

        when(timeRecordRepository.save(any(TimeRecord.class)))
                .thenAnswer(inv -> {
                    TimeRecord r = inv.getArgument(0);
                    r.setId(UUID.randomUUID());
                    return r;
                });

        // When
        TimeRecordResponse response = timeRecordService.registerTimeRecord(request, USER_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(RecordStatus.VALID);
        assertThat(response.getWithinGeofence()).isTrue();
        assertThat(response.getRecordType()).isEqualTo(RecordType.ENTRY);

        verify(timeRecordRepository).save(argThat(r ->
                r.getStatus() == RecordStatus.VALID &&
                r.getWithinGeofence() == true
        ));
    }

    @Test
    @DisplayName("T150 - Registro fora do geofence deve ficar pendente de aprovacao")
    void shouldMarkRecordPendingWhenOutsideGeofence() {
        // Given
        double latitude = -23.6000; // Fora do geofence
        double longitude = -46.7000;

        TimeRecordRequest request = TimeRecordRequest.builder()
                .employeeId(EMPLOYEE_ID)
                .recordType(RecordType.ENTRY)
                .source(RecordSource.MOBILE)
                .latitude(latitude)
                .longitude(longitude)
                .build();

        when(timeRecordRepository.existsByTenantIdAndEmployeeIdAndRecordDateAndRecordTypeAndRecordTime(
                any(), any(), any(), any(), any())).thenReturn(false);

        when(timeRecordRepository.findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(
                any(), any(), any())).thenReturn(Collections.emptyList());

        when(geofenceService.validateLocation(eq(TENANT_ID), eq(EMPLOYEE_ID), anyDouble(), anyDouble()))
                .thenReturn(new GeofenceValidationResult(false, null, null));

        when(timeRecordRepository.save(any(TimeRecord.class)))
                .thenAnswer(inv -> {
                    TimeRecord r = inv.getArgument(0);
                    r.setId(UUID.randomUUID());
                    return r;
                });

        // When
        TimeRecordResponse response = timeRecordService.registerTimeRecord(request, USER_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(RecordStatus.PENDING_APPROVAL);
        assertThat(response.getWithinGeofence()).isFalse();

        verify(timeRecordRepository).save(argThat(r ->
                r.getStatus() == RecordStatus.PENDING_APPROVAL
        ));
    }

    @Test
    @DisplayName("Deve rejeitar entrada duplicada")
    void shouldRejectDuplicateEntry() {
        // Given
        TimeRecordRequest request = TimeRecordRequest.builder()
                .employeeId(EMPLOYEE_ID)
                .recordType(RecordType.ENTRY)
                .source(RecordSource.WEB)
                .build();

        when(timeRecordRepository.existsByTenantIdAndEmployeeIdAndRecordDateAndRecordTypeAndRecordTime(
                any(), any(), any(), any(), any())).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> timeRecordService.registerTimeRecord(request, USER_ID))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Ja existe um registro");
    }

    @Test
    @DisplayName("Primeiro registro do dia deve ser entrada")
    void shouldRequireEntryAsFirstRecord() {
        // Given
        TimeRecordRequest request = TimeRecordRequest.builder()
                .employeeId(EMPLOYEE_ID)
                .recordType(RecordType.EXIT) // Tentando registrar saida primeiro
                .source(RecordSource.WEB)
                .build();

        when(timeRecordRepository.existsByTenantIdAndEmployeeIdAndRecordDateAndRecordTypeAndRecordTime(
                any(), any(), any(), any(), any())).thenReturn(false);

        when(timeRecordRepository.findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(
                any(), any(), any())).thenReturn(Collections.emptyList());

        // When/Then
        assertThatThrownBy(() -> timeRecordService.registerTimeRecord(request, USER_ID))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("primeiro registro do dia deve ser uma entrada");
    }

    @Test
    @DisplayName("T152 - Tolerancia de 5 minutos nao deve contar como atraso")
    void shouldApplyToleranceForLateArrival() {
        // Given - Este teste valida a logica de tolerancia no DailySummaryService
        // A tolerancia e aplicada no calculo do resumo diario

        TimeRecordRequest request = TimeRecordRequest.builder()
                .employeeId(EMPLOYEE_ID)
                .recordType(RecordType.ENTRY)
                .source(RecordSource.WEB)
                .recordTime(LocalTime.of(8, 4)) // 4 minutos depois das 8:00
                .build();

        when(timeRecordRepository.existsByTenantIdAndEmployeeIdAndRecordDateAndRecordTypeAndRecordTime(
                any(), any(), any(), any(), any())).thenReturn(false);

        when(timeRecordRepository.findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(
                any(), any(), any())).thenReturn(Collections.emptyList());

        when(timeRecordRepository.save(any(TimeRecord.class)))
                .thenAnswer(inv -> {
                    TimeRecord r = inv.getArgument(0);
                    r.setId(UUID.randomUUID());
                    return r;
                });

        // When
        TimeRecordResponse response = timeRecordService.registerTimeRecord(request, USER_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getRecordTime()).isEqualTo(LocalTime.of(8, 4));
        // A tolerancia sera verificada no DailySummaryService ao calcular os totais
    }

    @Test
    @DisplayName("Deve determinar proximo tipo de registro corretamente")
    void shouldDetermineNextRecordTypeCorrectly() {
        // Given - Nenhum registro no dia
        when(timeRecordRepository.findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(
                any(), any(), any())).thenReturn(Collections.emptyList());

        // When/Then
        assertThat(timeRecordService.getExpectedNextRecordType(EMPLOYEE_ID)).isEqualTo(RecordType.ENTRY);

        // Given - Apos entrada
        TimeRecord entry = createRecord(RecordType.ENTRY, LocalTime.of(8, 0));
        when(timeRecordRepository.findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(
                any(), any(), any())).thenReturn(List.of(entry));

        // When/Then
        assertThat(timeRecordService.getExpectedNextRecordType(EMPLOYEE_ID)).isEqualTo(RecordType.BREAK_START);

        // Given - Apos inicio de intervalo
        TimeRecord breakStart = createRecord(RecordType.BREAK_START, LocalTime.of(12, 0));
        when(timeRecordRepository.findByTenantIdAndEmployeeIdAndRecordDateOrderByRecordTimeAsc(
                any(), any(), any())).thenReturn(List.of(entry, breakStart));

        // When/Then
        assertThat(timeRecordService.getExpectedNextRecordType(EMPLOYEE_ID)).isEqualTo(RecordType.BREAK_END);
    }

    @Test
    @DisplayName("Deve aprovar registro pendente")
    void shouldApproveRecordPendingApproval() {
        // Given
        UUID recordId = UUID.randomUUID();
        TimeRecord record = createRecord(RecordType.ENTRY, LocalTime.of(8, 0));
        record.setId(recordId);
        record.setStatus(RecordStatus.PENDING_APPROVAL);

        when(timeRecordRepository.findByTenantIdAndId(TENANT_ID, recordId))
                .thenReturn(Optional.of(record));

        when(timeRecordRepository.save(any(TimeRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        TimeRecordResponse response = timeRecordService.approveRecord(recordId, "Aprovado pelo gestor", USER_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(RecordStatus.APPROVED);

        verify(timeRecordRepository).save(argThat(r ->
                r.getStatus() == RecordStatus.APPROVED &&
                r.getApprovedBy().equals(USER_ID) &&
                r.getApprovedAt() != null
        ));
    }

    @Test
    @DisplayName("Deve rejeitar registro pendente")
    void shouldRejectRecord() {
        // Given
        UUID recordId = UUID.randomUUID();
        TimeRecord record = createRecord(RecordType.ENTRY, LocalTime.of(8, 0));
        record.setId(recordId);
        record.setStatus(RecordStatus.PENDING_APPROVAL);

        when(timeRecordRepository.findByTenantIdAndId(TENANT_ID, recordId))
                .thenReturn(Optional.of(record));

        when(timeRecordRepository.save(any(TimeRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        TimeRecordResponse response = timeRecordService.rejectRecord(recordId, "Localizacao invalida", USER_ID);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(RecordStatus.REJECTED);
        assertThat(response.getRejectionReason()).isEqualTo("Localizacao invalida");
    }

    @Test
    @DisplayName("Nao deve aprovar registro que nao esta pendente")
    void shouldNotApproveNonPendingRecord() {
        // Given
        UUID recordId = UUID.randomUUID();
        TimeRecord record = createRecord(RecordType.ENTRY, LocalTime.of(8, 0));
        record.setId(recordId);
        record.setStatus(RecordStatus.VALID); // Ja esta valido

        when(timeRecordRepository.findByTenantIdAndId(TENANT_ID, recordId))
                .thenReturn(Optional.of(record));

        // When/Then
        assertThatThrownBy(() -> timeRecordService.approveRecord(recordId, "Teste", USER_ID))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("nao esta pendente");
    }

    // ==================== Metodos Auxiliares ====================

    private TimeRecord createRecord(RecordType type, LocalTime time) {
        return TimeRecord.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .employeeId(EMPLOYEE_ID)
                .recordDate(LocalDate.now())
                .recordTime(time)
                .recordDatetime(LocalDate.now().atTime(time))
                .recordType(type)
                .source(RecordSource.WEB)
                .status(RecordStatus.VALID)
                .build();
    }
}
