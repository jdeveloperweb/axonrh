package com.axonrh.employee.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes do validador de CPF (T104).
 */
class CpfValidatorTest {

    private CpfValidator cpfValidator;

    @BeforeEach
    void setUp() {
        cpfValidator = new CpfValidator();
    }

    @Test
    @DisplayName("Deve validar CPF valido")
    void shouldValidateValidCpf() {
        assertThat(cpfValidator.isValid("52998224725")).isTrue();
        assertThat(cpfValidator.isValid("11144477735")).isTrue();
    }

    @Test
    @DisplayName("Deve rejeitar CPF invalido")
    void shouldRejectInvalidCpf() {
        assertThat(cpfValidator.isValid("12345678901")).isFalse();
        assertThat(cpfValidator.isValid("11111111111")).isFalse();
        assertThat(cpfValidator.isValid("00000000000")).isFalse();
    }

    @Test
    @DisplayName("Deve rejeitar CPF nulo")
    void shouldRejectNullCpf() {
        assertThat(cpfValidator.isValid(null)).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"123", "1234567890", "123456789012", ""})
    @DisplayName("Deve rejeitar CPF com tamanho incorreto")
    void shouldRejectCpfWithWrongLength(String cpf) {
        assertThat(cpfValidator.isValid(cpf)).isFalse();
    }

    @Test
    @DisplayName("Deve rejeitar CPF com todos digitos iguais")
    void shouldRejectCpfWithAllSameDigits() {
        assertThat(cpfValidator.isValid("11111111111")).isFalse();
        assertThat(cpfValidator.isValid("22222222222")).isFalse();
        assertThat(cpfValidator.isValid("99999999999")).isFalse();
    }

    @Test
    @DisplayName("Deve formatar CPF corretamente")
    void shouldFormatCpf() {
        String formatted = cpfValidator.format("52998224725");
        assertThat(formatted).isEqualTo("529.982.247-25");
    }

    @Test
    @DisplayName("Deve remover formatacao do CPF")
    void shouldUnformatCpf() {
        String unformatted = cpfValidator.unformat("529.982.247-25");
        assertThat(unformatted).isEqualTo("52998224725");
    }
}
