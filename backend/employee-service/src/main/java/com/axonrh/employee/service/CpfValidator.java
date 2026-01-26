package com.axonrh.employee.service;

import org.springframework.stereotype.Component;

/**
 * T104 - Validador de CPF com algoritmo.
 */
@Component
public class CpfValidator {

    /**
     * Valida CPF usando algoritmo oficial.
     * @param cpf CPF com 11 digitos (apenas numeros)
     * @return true se valido, false caso contrario
     */
    public boolean isValid(String cpf) {
        if (cpf == null || cpf.length() != 11) {
            return false;
        }

        // Remove caracteres nao numericos
        cpf = cpf.replaceAll("\\D", "");

        if (cpf.length() != 11) {
            return false;
        }

        // Verifica se todos os digitos sao iguais (invalido)
        if (cpf.matches("(\\d)\\1{10}")) {
            return false;
        }

        try {
            // Calcula primeiro digito verificador
            int sum = 0;
            for (int i = 0; i < 9; i++) {
                sum += Character.getNumericValue(cpf.charAt(i)) * (10 - i);
            }
            int firstDigit = 11 - (sum % 11);
            if (firstDigit > 9) {
                firstDigit = 0;
            }

            // Verifica primeiro digito
            if (Character.getNumericValue(cpf.charAt(9)) != firstDigit) {
                return false;
            }

            // Calcula segundo digito verificador
            sum = 0;
            for (int i = 0; i < 10; i++) {
                sum += Character.getNumericValue(cpf.charAt(i)) * (11 - i);
            }
            int secondDigit = 11 - (sum % 11);
            if (secondDigit > 9) {
                secondDigit = 0;
            }

            // Verifica segundo digito
            return Character.getNumericValue(cpf.charAt(10)) == secondDigit;

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Formata CPF para exibicao (XXX.XXX.XXX-XX).
     */
    public String format(String cpf) {
        if (cpf == null || cpf.length() != 11) {
            return cpf;
        }
        return cpf.substring(0, 3) + "." +
               cpf.substring(3, 6) + "." +
               cpf.substring(6, 9) + "-" +
               cpf.substring(9, 11);
    }

    /**
     * Remove formatacao do CPF.
     */
    public String unformat(String cpf) {
        if (cpf == null) {
            return null;
        }
        return cpf.replaceAll("\\D", "");
    }
}
