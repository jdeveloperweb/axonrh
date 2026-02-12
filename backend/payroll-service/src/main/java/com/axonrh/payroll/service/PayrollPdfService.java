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
                "body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9pt; color: #2C3E50; margin: 0; padding: 25px; background: #fff; }" +
                ".container { width: 100%; border: 2px solid #34495E; }" +
                ".header { padding: 15px; border-bottom: 2px solid #34495E; display: flex; justify-content: space-between; }" +
                ".company-info { width: 70%; }" +
                ".company-name { font-weight: bold; font-size: 16pt; color: #1A252F; text-transform: uppercase; }" +
                ".company-cnpj { font-size: 10pt; color: #7F8C8D; margin-top: 5px; }" +
                ".payslip-title { text-align: center; font-weight: bold; font-size: 13pt; padding: 10px; background: #ECF0F1; border-bottom: 2px solid #34495E; color: #2C3E50; }" +
                "table { width: 100%; border-collapse: collapse; }" +
                "th, td { border: 1px solid #BDC3C7; padding: 8px 12px; text-align: left; }" +
                "th { background: #F8F9F9; font-weight: bold; color: #34495E; text-transform: uppercase; font-size: 8pt; }" +
                ".emp-info th { text-align: left; background: #F8F9F9; border-bottom: 1px solid #BDC3C7; }" +
                ".label { font-size: 7pt; color: #7F8C8D; display: block; margin-bottom: 2px; text-transform: uppercase; }" +
                ".value { font-weight: bold; font-size: 10pt; color: #2C3E50; }" +
                ".items-table thead th { border-bottom: 2px solid #34495E; }" +
                ".items-table tbody tr:nth-child(even) { background: #FBFCFC; }" +
                ".text-right { text-align: right; }" +
                ".money { font-family: 'Courier', monospace; font-weight: bold; }" +
                ".summary-row { background: #F4F6F7; font-weight: bold; }" +
                ".net-pay-row { background: #2C3E50; color: #FFFFFF; font-size: 14pt; }" +
                ".net-pay-row td { border-color: #2C3E50; padding: 15px; }" +
                ".bases-table td { font-size: 8pt; }" +
                ".footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }" +
                ".signature-box { width: 45%; border-top: 1px solid #34495E; text-align: center; padding-top: 5px; font-size: 8pt; }" +
                "</style></head><body>" +
                "<div class='container'>" +
                "  <div class='header'>" +
                "    <div class='company-info'>" +
                "      <div class='company-name'>" + p.getCompanyName() + "</div>" +
                "      <div class='company-cnpj'>CNPJ: " + p.getCompanyCnpj() + "</div>" +
                "    </div>" +
                "  </div>" +
                "  <div class='payslip-title'>RECIBO DE PAGAMENTO DE SALÁRIO</div>" +
                "  <table class='emp-info'>" +
                "    <tr>" +
                "      <td colspan='3'><span class='label'>Nome do Funcionário</span><span class='value'>" + p.getEmployeeName() + "</span></td>" +
                "      <td width='25%'><span class='label'>Competência</span><span class='value'>" + String.format("%02d/%d", p.getMonth(), p.getYear()) + "</span></td>" +
                "    </tr>" +
                "    <tr>" +
                "      <td width='25%'><span class='label'>Registro</span><span class='value'>" + p.getRegistrationNumber() + "</span></td>" +
                "      <td width='25%'><span class='label'>CPF</span><span class='value'>" + p.getEmployeeCpf() + "</span></td>" +
                "      <td width='25%'><span class='label'>Função</span><span class='value'>" + p.getPosition() + "</span></td>" +
                "      <td width='25%'><span class='label'>Departamento</span><span class='value'>" + p.getDepartment() + "</span></td>" +
                "    </tr>" +
                "  </table>" +
                "  <table class='items-table'>" +
                "    <thead>" +
                "      <tr><th width='10%'>Cód.</th><th>Descrição</th><th width='15%' class='text-right'>Referência</th><th width='15%' class='text-right'>Vencimentos</th><th width='15%' class='text-right'>Descontos</th></tr>" +
                "    </thead>" +
                "    <tbody>" + itemsHtml.toString() + "</tbody>" +
                "    <tfoot>" +
                "      <tr class='summary-row'>" +
                "        <td colspan='3' class='text-right'>TOTAIS</td>" +
                "        <td class='text-right money'>" + formatCurrency(p.getTotalEarnings()) + "</td>" +
                "        <td class='text-right money'>" + formatCurrency(p.getTotalDeductions()) + "</td>" +
                "      </tr>" +
                "      <tr class='net-pay-row'>" +
                "        <td colspan='3' class='text-right' style='border:none;'>LÍQUIDO A RECEBER</td>" +
                "        <td colspan='2' class='text-right money' style='border:none;'>" + formatCurrency(p.getNetSalary()) + "</td>" +
                "      </tr>" +
                "    </tfoot>" +
                "  </table>" +
                "  <table class='bases-table'>" +
                "    <thead><tr><th>Salário Base</th><th>Base INSS</th><th>Base IRRF</th><th>Base FGTS</th><th>FGTS do Mês</th></tr></thead>" +
                "    <tr>" +
                "      <td class='money'>" + formatCurrency(p.getBaseSalary()) + "</td>" +
                "      <td class='money'>" + formatCurrency(p.getInssBase()) + "</td>" +
                "      <td class='money'>" + formatCurrency(p.getIrrfBase()) + "</td>" +
                "      <td class='money'>" + formatCurrency(p.getFgtsBase()) + "</td>" +
                "      <td class='money'>" + formatCurrency(p.getFgtsAmount()) + "</td>" +
                "    </tr>" +
                "  </table>" +
                "</div>" +
                "<div class='footer'>" +
                "  <div class='signature-box'>____/____/____<br/>DATA</div>" +
                "  <div class='signature-box'>Assinatura do Funcionário</div>" +
                "</div>" +
                "</body></html>";
    }

    private String formatCurrency(BigDecimal value) {
        if (value == null) return "R$ 0,00";
        return currencyFormatter.format(value);
    }
}
