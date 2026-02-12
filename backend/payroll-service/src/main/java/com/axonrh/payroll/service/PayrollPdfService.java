package com.axonrh.payroll.service;

import com.axonrh.payroll.dto.PayrollItemResponse;
import com.axonrh.payroll.dto.PayslipResponse;
import com.itextpdf.html2pdf.HtmlConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PayrollPdfService {

    private final NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));

    public byte[] generatePayslipPdf(PayslipResponse payslip) {
        String html = generatePayslipHtml(payslip);
        ByteArrayOutputStream target = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(html, target);
        return target.toByteArray();
    }

    private String generatePayslipHtml(PayslipResponse p) {
        StringBuilder itemsHtml = new StringBuilder();
        
        // Vencimentos
        for (PayrollItemResponse item : p.getEarnings()) {
            itemsHtml.append(String.format(
                "<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td></td></tr>",
                item.getCode(), item.getDescription(), 
                item.getQuantity() != null ? item.getQuantity() : "",
                formatCurrency(item.getAmount())
            ));
        }
        
        // Descontos
        for (PayrollItemResponse item : p.getDeductions()) {
            itemsHtml.append(String.format(
                "<tr><td>%s</td><td>%s</td><td>%s</td><td></td><td>%s</td></tr>",
                item.getCode(), item.getDescription(),
                item.getQuantity() != null ? item.getQuantity() : "",
                formatCurrency(item.getAmount())
            ));
        }

        return "<!DOCTYPE html><html><head><style>" +
                "body { font-family: sans-serif; font-size: 10pt; color: #333; margin: 20px; }" +
                ".header { border: 1px solid #000; padding: 10px; margin-bottom: 5px; }" +
                ".company-name { font-weight: bold; font-size: 14pt; }" +
                ".title { text-align: center; font-weight: bold; font-size: 12pt; margin: 10px 0; border: 1px solid #000; padding: 5px; background: #eee; }" +
                "table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }" +
                "th, td { border: 1px solid #000; padding: 5px; text-align: left; }" +
                "th { background: #eee; }" +
                ".footer-box { border: 1px solid #000; padding: 10px; height: 60px; }" +
                ".label { font-size: 8pt; color: #666; }" +
                ".value { font-weight: bold; }" +
                ".right { text-align: right; }" +
                "</style></head><body>" +
                "<div class='header'>" +
                "  <div class='company-name'>" + p.getCompanyName() + "</div>" +
                "  <div>CNPJ: " + p.getCompanyCnpj() + "</div>" +
                "</div>" +
                "<div class='title'>RECIBO DE PAGAMENTO DE SALÁRIO</div>" +
                "<table>" +
                "  <tr><td colspan='3'><span class='label'>Nome do Funcionário:</span><br/><span class='value'>" + p.getEmployeeName() + "</span></td>" +
                "      <td><span class='label'>Mês/Ano:</span><br/><span class='value'>" + String.format("%02d/%d", p.getMonth(), p.getYear()) + "</span></td></tr>" +
                "  <tr><td><span class='label'>Registro:</span><br/><span class='value'>" + p.getRegistrationNumber() + "</span></td>" +
                "      <td><span class='label'>CBO:</span><br/><span class='value'>-</span></td>" +
                "      <td><span class='label'>Função:</span><br/><span class='value'>" + p.getEmployeeRole() + "</span></td>" +
                "      <td><span class='label'>Depto:</span><br/><span class='value'>" + p.getEmployeeDepartment() + "</span></td></tr>" +
                "</table>" +
                "<table>" +
                "  <thead><tr><th>Cód.</th><th>Descrição</th><th>Ref.</th><th>Proventos</th><th>Descontos</th></tr></thead>" +
                "  <tbody>" + itemsHtml.toString() + "</tbody>" +
                "</table>" +
                "<table style='margin-left: auto; width: 300px;'>" +
                "  <tr><td>Total Proventos</td><td class='right'>" + formatCurrency(p.getTotalEarnings()) + "</td></tr>" +
                "  <tr><td>Total Descontos</td><td class='right'>" + formatCurrency(p.getTotalDeductions()) + "</td></tr>" +
                "  <tr style='font-weight:bold; background:#eee;'><td>LÍQUIDO A RECEBER</td><td class='right'>" + formatCurrency(p.getNetValue()) + "</td></tr>" +
                "</table>" +
                "<table>" +
                "  <tr><td>Salário Base: " + formatCurrency(p.getBaseSalary()) + "</td>" +
                "      <td>Base INSS: " + formatCurrency(p.getInssBase()) + "</td>" +
                "      <td>Base IRRF: " + formatCurrency(p.getIrrfBase()) + "</td>" +
                "      <td>Base FGTS: " + formatCurrency(p.getFgtsBase()) + "</td>" +
                "      <td>FGTS Mês: " + formatCurrency(p.getFgtsMonth()) + "</td></tr>" +
                "</table>" +
                "<div style='margin-top: 50px;'>" +
                "  <div style='display:inline-block; width: 45%; border-top: 1px solid #000; text-align:center;'>Data ___/___/___</div>" +
                "  <div style='display:inline-block; width: 45%; float:right; border-top: 1px solid #000; text-align:center;'>Assinatura do Funcionário</div>" +
                "</div>" +
                "</body></html>";
    }

    private String formatCurrency(BigDecimal value) {
        if (value == null) return "R$ 0,00";
        return currencyFormatter.format(value);
    }
}
