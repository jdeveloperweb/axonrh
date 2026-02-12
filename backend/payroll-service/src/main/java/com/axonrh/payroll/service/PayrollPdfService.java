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
        String brandColor = p.getPrimaryColor() != null ? p.getPrimaryColor() : "#FF8000";
        
        // Cabeçalho com Logo ou Nome Estilizado
        String brandElement = (p.getLogoUrl() != null && !p.getLogoUrl().isEmpty()) 
            ? "<img src='" + p.getLogoUrl() + "' style='max-height: 45px;' />" 
            : "<div style='font-size: 14pt; font-weight: 900; color:" + brandColor + "'>" + p.getCompanyName() + "</div>";

        for (PayrollItemResponse item : p.getEarnings()) {
            itemsHtml.append(String.format(
                "<tr style='border-bottom: 1px solid #f2f2f2;'><td style='padding: 6px; color: #777;'>%s</td><td style='padding: 6px; font-weight: 500;'>%s</td><td style='padding: 6px; text-align: center;'>%s</td><td style='padding: 6px; text-align: right;'>%s</td><td style='padding: 6px;'></td></tr>",
                item.getCode(), item.getDescription(), 
                item.getQuantity() != null ? item.getQuantity() : "-",
                formatCurrency(item.getAmount())
            ));
        }
        
        for (PayrollItemResponse item : p.getDeductions()) {
            itemsHtml.append(String.format(
                "<tr style='border-bottom: 1px solid #f2f2f2;'><td style='padding: 6px; color: #777;'>%s</td><td style='padding: 6px; font-weight: 500;'>%s</td><td style='padding: 6px; text-align: center;'>%s</td><td style='padding: 6px;'></td><td style='padding: 6px; text-align: right; color: #dc2626;'>%s</td></tr>",
                item.getCode(), item.getDescription(),
                item.getQuantity() != null ? item.getQuantity() : "-",
                formatCurrency(item.getAmount())
            ));
        }

        return "<!DOCTYPE html><html><head><meta charset='utf-8'/><style>" +
                "body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 8.5pt; color: #333; margin: 0; padding: 15px; }" +
                "table { width: 100%; border-collapse: collapse; }" +
                ".container { border: 1px solid #ddd; padding: 15px; border-top: 4px solid " + brandColor + "; border-bottom: 8px solid " + brandColor + "; border-radius: 4px; }" +
                ".label { font-size: 6.5pt; color: #888; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; }" +
                ".value { font-size: 9.5pt; font-weight: 700; color: #111; }" +
                ".header-bg { background: " + brandColor + "; color: #fff; text-transform: uppercase; font-weight: bold; font-size: 7.5pt; border: 1px solid #ddd; }" +
                ".header-bg td { padding: 8px; }" +
                ".info-box { border: 1px solid #eee; padding: 8px; margin: 2px; background: #fff; }" +
                ".net-box { background: " + brandColor + "; color: #fff; padding: 12px 20px; border-radius: 5px; margin-top: 15px; }" +
                "</style></head><body>" +
                "<div class='container'>" +
                
                // HEADER: Brand and Competency
                "<table>" +
                "  <tr>" +
                "    <td width='50%' style='vertical-align: top;'>" + brandElement + "</td>" +
                "    <td width='50%' style='text-align: right; vertical-align: middle;'>" +
                "      <div style='font-size: 16pt; font-weight: 900; color: #111;'>Recibo de Pagamento</div>" +
                "      <div style='font-size: 10pt; color: #666;'>Competência: <b>" + String.format("%02d/%d", p.getMonth(), p.getYear()) + "</b></div>" +
                "    </td>" +
                "  </tr>" +
                "</table>" +

                // EMPLOYER INFO
                "<table style='margin: 15px 0; border: 1px solid #eee; background: #f9f9f9;'>" +
                "  <tr>" +
                "    <td style='padding: 10px;'>" +
                "      <div class='label'>Empregador</div>" +
                "      <div style='font-size: 11pt; font-weight: 800; color: #222;'>" + p.getCompanyName() + "</div>" +
                "      <div style='color: #666; font-size: 8pt;'>CNPJ: " + p.getCompanyCnpj() + "</div>" +
                "    </td>" +
                "  </tr>" +
                "</table>" +

                // EMPLOYEE INFO
                "<table>" +
                "  <tr>" +
                "    <td width='50%'><div class='info-box'><div class='label'>Colaborador</div><div class='value'>" + p.getEmployeeName() + "</div></div></td>" +
                "    <td width='50%'><div class='info-box'><div class='label'>CPF</div><div class='value'>" + p.getEmployeeCpf() + "</div></div></td>" +
                "  </tr>" +
                "  <tr>" +
                "    <td width='30%'><div class='info-box'><div class='label'>Matrícula</div><div class='value'>" + p.getRegistrationNumber() + "</div></div></td>" +
                "    <td width='35%'><div class='info-box'><div class='label'>Cargo</div><div class='value'>" + p.getPosition() + "</div></div></td>" +
                "    <td width='35%'><div class='info-box'><div class='label'>Departamento</div><div class='value'>" + p.getDepartment() + "</div></div></td>" +
                "  </tr>" +
                "</table>" +

                // ITEMS TABLE
                "<div style='margin-top: 15px;'>" +
                "  <table style='border: 1px solid #ddd;'>" +
                "    <tr class='header-bg'>" +
                "      <td width='12%'>Código</td><td width='50%'>Descrição</td><td width='10%' style='text-align: center;'>Referência</td><td width='14%' style='text-align: right;'>Vencimentos</td><td width='14%' style='text-align: right;'>Descontos</td>" +
                "    </tr>" +
                     itemsHtml.toString() +
                "    <tr style='background: #fcfcfc; font-weight: bold; border-top: 2px solid #ddd;'>" +
                "      <td colspan='3' style='padding: 10px; text-align: right; color: " + brandColor + ";'>TOTAIS</td>" +
                "      <td style='padding: 10px; text-align: right; color: " + brandColor + ";'>" + formatCurrency(p.getTotalEarnings()) + "</td>" +
                "      <td style='padding: 10px; text-align: right; color: #dc2626;'>" + formatCurrency(p.getTotalDeductions()) + "</td>" +
                "    </tr>" +
                "  </table>" +
                "</div>" +

                // NET SALARY
                "<div class='net-box'>" +
                "  <table width='100%'><tr>" +
                "    <td style='font-size: 11pt; font-weight: 800; text-transform: uppercase;'>Líquido a Receber</td>" +
                "    <td style='text-align: right; font-size: 24pt; font-weight: 900;'>" + formatCurrency(p.getNetSalary()) + "</td>" +
                "  </tr></table>" +
                "</div>" +

                // BASES FOOTER
                "<table style='margin-top: 15px; background: #fafafa; border: 1px solid #eee; text-align: center; border-radius: 4px;'>" +
                "  <tr style='font-size: 6pt; color: #888; font-weight: bold;'>" +
                "    <td style='padding: 8px; border-right: 1px solid #eee;'>SALÁRIO BASE</td>" +
                "    <td style='padding: 8px; border-right: 1px solid #eee;'>BASE INSS</td>" +
                "    <td style='padding: 8px; border-right: 1px solid #eee;'>BASE IRRF</td>" +
                "    <td style='padding: 8px; border-right: 1px solid #eee;'>BASE FGTS</td>" +
                "    <td style='padding: 8px;'>FGTS DO MÊS</td>" +
                "  </tr>" +
                "  <tr style='font-weight: 800; font-size: 9.5pt; border-top: 1px solid #eee;'>" +
                "    <td style='padding: 8px; border-right: 1px solid #eee;'>" + formatCurrency(p.getBaseSalary()) + "</td>" +
                "    <td style='padding: 8px; border-right: 1px solid #eee;'>" + formatCurrency(p.getInssBase()) + "</td>" +
                "    <td style='padding: 8px; border-right: 1px solid #eee;'>" + formatCurrency(p.getIrrfBase()) + "</td>" +
                "    <td style='padding: 8px; border-right: 1px solid #eee;'>" + formatCurrency(p.getFgtsBase()) + "</td>" +
                "    <td style='padding: 8px;'>" + formatCurrency(p.getFgtsAmount()) + "</td>" +
                "  </tr>" +
                "</table>" +

                // SIGNATURE
                "<table style='margin-top: 60px;'>" +
                "  <tr>" +
                "    <td width='25%' style='text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 5px; color: #999;'>____/____/____</td>" +
                "    <td width='15%'></td>" +
                "    <td width='60%' style='border-bottom: 1px solid #000; text-align: center; padding-bottom: 5px; font-weight: 700; font-size: 9.5pt;'>Assinatura do Funcionário</td>" +
                "  </tr>" +
                "</table>" +
                "<div style='margin-top: 25px; font-size: 7.5pt; color: #999; text-align: center;'>Declaro ter recebido a importância líquida discriminada neste recibo e dou plena quitação.</div>" +
                "</div></body></html>";
    }

    private String formatCurrency(BigDecimal value) {
        if (value == null) return "R$ 0,00";
        return currencyFormatter.format(value);
    }
}
