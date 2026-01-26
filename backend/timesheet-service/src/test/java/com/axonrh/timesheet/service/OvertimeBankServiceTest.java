package com.axonrh.timesheet.service;

import com.axonrh.timesheet.config.TenantContext;
import com.axonrh.timesheet.dto.OvertimeBankResponse;
import com.axonrh.timesheet.entity.OvertimeBank;
import com.axonrh.timesheet.entity.enums.OvertimeBankType;
import com.axonrh.timesheet.exception.InvalidOperationException;
import com.axonrh.timesheet.repository.OvertimeBankRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Testes do OvertimeBankService
 */
@ExtendWith(MockitoExtension.class)
class OvertimeBankServiceTest {

    @Mock
    private OvertimeBankRepository overtimeBankRepository;

    @InjectMocks
    private OvertimeBankService overtimeBankService;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID EMPLOYEE_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID.toString());
        ReflectionTestUtils.setField(overtimeBankService, "defaultExpirationMonths", 6);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("T151 - Calculo de horas extras deve aplicar multiplicador corretamente")
    void shouldApplyMultiplierCorrectly() {
        // Given
        int originalMinutes = 60; // 1 hora
        double multiplier = 1.5; // 50% adicional
        int expectedMinutes = 90; // 1h30

        when(overtimeBankRepository.calculateCurrentBalance(TENANT_ID, EMPLOYEE_ID))
                .thenReturn(0);

        when(overtimeBankRepository.save(any(OvertimeBank.class)))
                .thenAnswer(inv -> {
                    OvertimeBank ob = inv.getArgument(0);
                    ob.setId(UUID.randomUUID());
                    return ob;
                });

        // When
        OvertimeBankResponse response = overtimeBankService.addCredit(
                EMPLOYEE_ID,
                LocalDate.now(),
                originalMinutes,
                multiplier,
                "Hora extra 50%",
                null,
                USER_ID
        );

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getMinutes()).isEqualTo(expectedMinutes);
        assertThat(response.getOriginalMinutes()).isEqualTo(originalMinutes);
        assertThat(response.getMultiplier()).isEqualTo(multiplier);
        assertThat(response.getBalanceAfter()).isEqualTo(expectedMinutes);

        verify(overtimeBankRepository).save(argThat(ob ->
                ob.getMinutes() == expectedMinutes &&
                ob.getOriginalMinutes() == originalMinutes &&
                ob.getMultiplier() == multiplier
        ));
    }

    @Test
    @DisplayName("Credito deve atualizar saldo corretamente")
    void shouldUpdateBalanceOnCredit() {
        // Given
        int currentBalance = 120; // 2 horas
        int newMinutes = 60; // 1 hora
        int expectedBalance = 180; // 3 horas

        when(overtimeBankRepository.calculateCurrentBalance(TENANT_ID, EMPLOYEE_ID))
                .thenReturn(currentBalance);

        when(overtimeBankRepository.save(any(OvertimeBank.class)))
                .thenAnswer(inv -> {
                    OvertimeBank ob = inv.getArgument(0);
                    ob.setId(UUID.randomUUID());
                    return ob;
                });

        // When
        OvertimeBankResponse response = overtimeBankService.addCredit(
                EMPLOYEE_ID,
                LocalDate.now(),
                newMinutes,
                1.0,
                "Hora extra",
                null,
                USER_ID
        );

        // Then
        assertThat(response.getBalanceAfter()).isEqualTo(expectedBalance);
    }

    @Test
    @DisplayName("Debito deve reduzir saldo corretamente")
    void shouldReduceBalanceOnDebit() {
        // Given
        int currentBalance = 180; // 3 horas
        int debitMinutes = 60; // 1 hora
        int expectedBalance = 120; // 2 horas

        when(overtimeBankRepository.calculateCurrentBalance(TENANT_ID, EMPLOYEE_ID))
                .thenReturn(currentBalance);

        when(overtimeBankRepository.save(any(OvertimeBank.class)))
                .thenAnswer(inv -> {
                    OvertimeBank ob = inv.getArgument(0);
                    ob.setId(UUID.randomUUID());
                    return ob;
                });

        // When
        OvertimeBankResponse response = overtimeBankService.addDebit(
                EMPLOYEE_ID,
                LocalDate.now(),
                debitMinutes,
                "Folga compensacao",
                USER_ID
        );

        // Then
        assertThat(response.getBalanceAfter()).isEqualTo(expectedBalance);
        assertThat(response.getType()).isEqualTo(OvertimeBankType.DEBIT);
    }

    @Test
    @DisplayName("Pagamento deve reduzir saldo")
    void shouldReduceBalanceOnPayout() {
        // Given
        int currentBalance = 240; // 4 horas
        int payoutMinutes = 120; // 2 horas
        int expectedBalance = 120; // 2 horas

        when(overtimeBankRepository.calculateCurrentBalance(TENANT_ID, EMPLOYEE_ID))
                .thenReturn(currentBalance);

        when(overtimeBankRepository.save(any(OvertimeBank.class)))
                .thenAnswer(inv -> {
                    OvertimeBank ob = inv.getArgument(0);
                    ob.setId(UUID.randomUUID());
                    return ob;
                });

        // When
        OvertimeBankResponse response = overtimeBankService.addPayout(
                EMPLOYEE_ID,
                LocalDate.now(),
                payoutMinutes,
                "Pagamento em folha",
                USER_ID
        );

        // Then
        assertThat(response.getBalanceAfter()).isEqualTo(expectedBalance);
        assertThat(response.getType()).isEqualTo(OvertimeBankType.PAYOUT);
    }

    @Test
    @DisplayName("Pagamento maior que saldo deve ser rejeitado")
    void shouldRejectPayoutExceedingBalance() {
        // Given
        int currentBalance = 60; // 1 hora
        int payoutMinutes = 120; // 2 horas - maior que saldo

        when(overtimeBankRepository.calculateCurrentBalance(TENANT_ID, EMPLOYEE_ID))
                .thenReturn(currentBalance);

        // When/Then
        assertThatThrownBy(() -> overtimeBankService.addPayout(
                EMPLOYEE_ID,
                LocalDate.now(),
                payoutMinutes,
                "Pagamento",
                USER_ID
        ))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Saldo insuficiente");
    }

    @Test
    @DisplayName("Credito deve ter data de expiracao")
    void shouldSetExpirationDateOnCredit() {
        // Given
        LocalDate today = LocalDate.now();
        LocalDate expectedExpiration = today.plusMonths(6);

        when(overtimeBankRepository.calculateCurrentBalance(TENANT_ID, EMPLOYEE_ID))
                .thenReturn(0);

        when(overtimeBankRepository.save(any(OvertimeBank.class)))
                .thenAnswer(inv -> {
                    OvertimeBank ob = inv.getArgument(0);
                    ob.setId(UUID.randomUUID());
                    return ob;
                });

        // When
        OvertimeBankResponse response = overtimeBankService.addCredit(
                EMPLOYEE_ID,
                today,
                60,
                1.0,
                "Hora extra",
                null,
                USER_ID
        );

        // Then
        assertThat(response.getExpirationDate()).isEqualTo(expectedExpiration);

        verify(overtimeBankRepository).save(argThat(ob ->
                ob.getExpirationDate().equals(expectedExpiration)
        ));
    }

    @Test
    @DisplayName("Ajuste manual deve ser registrado com aprovador")
    void shouldRecordAdjustmentWithApprover() {
        // Given
        int adjustmentMinutes = -30; // Ajuste negativo

        when(overtimeBankRepository.calculateCurrentBalance(TENANT_ID, EMPLOYEE_ID))
                .thenReturn(100);

        when(overtimeBankRepository.save(any(OvertimeBank.class)))
                .thenAnswer(inv -> {
                    OvertimeBank ob = inv.getArgument(0);
                    ob.setId(UUID.randomUUID());
                    return ob;
                });

        // When
        OvertimeBankResponse response = overtimeBankService.addAdjustment(
                EMPLOYEE_ID,
                LocalDate.now(),
                adjustmentMinutes,
                "Correcao de lancamento",
                USER_ID
        );

        // Then
        assertThat(response.getType()).isEqualTo(OvertimeBankType.ADJUSTMENT);
        assertThat(response.getApprovedBy()).isEqualTo(USER_ID);
        assertThat(response.getApprovedAt()).isNotNull();

        verify(overtimeBankRepository).save(argThat(ob ->
                ob.getType() == OvertimeBankType.ADJUSTMENT &&
                ob.getApprovedBy().equals(USER_ID)
        ));
    }
}
