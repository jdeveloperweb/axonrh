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
        String logoHtml = (p.getLogoUrl() != null && !p.getLogoUrl().isEmpty()) 
            ? "<img src='" + p.getLogoUrl() + "' style='max-height: 50px; margin-bottom: 10px;' />" 
            : "<div style='font-size: 20pt; font-weight: 800; color: " + brandColor + "; margin-bottom: 10px;'>" + p.getCompanyName() + "</div>";
        
        // Vencimentos e Descontos consolidados
        for (PayrollItemResponse item : p.getEarnings()) {
            itemsHtml.append(String.format(
                "<tr><td class='code'>%s</td><td class='desc'>%s</td><td class='ref text-center'>%s</td><td class='val text-right'>%s</td><td class='val'></td></tr>",
                item.getCode(), item.getDescription(), 
                item.getQuantity() != null ? item.getQuantity() : "-",
                formatCurrency(item.getAmount())
            ));
        }
        
        for (PayrollItemResponse item : p.getDeductions()) {
            itemsHtml.append(String.format(
                "<tr><td class='code'>%s</td><td class='desc'>%s</td><td class='ref text-center'>%s</td><td class='val'></td><td class='val text-right text-red'>%s</td></tr>",
                item.getCode(), item.getDescription(),
                item.getQuantity() != null ? item.getQuantity() : "-",
                formatCurrency(item.getAmount())
            ));
        }

        return "<!DOCTYPE html><html><head><meta charset='utf-8'/><style>" +
                "body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9pt; color: #333; margin: 0; padding: 30px; background: #fff; }" +
                ".page-wrapper { border: 1px solid #eee; padding: 20px; position: relative; }" +
                ".brand-header { margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }" +
                ".employer-card { background: #fdfdfd; padding: 15px; border-radius: 12px; border: 1px solid #efefef; width: 45%; }" +
                ".employer-label { font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 4px; font-weight: bold;}" +
                ".employer-name { font-weight: 800; font-size: 11pt; color: #1a1a1a; }" +
                ".title-card { text-align: right; width: 50%; }" +
                ".main-title { font-size: 18pt; font-weight: 900; color: #1a1a1a; margin-bottom: 2px; }" +
                ".subtitle { font-size: 10pt; color: #666; font-weight: 500; }" +
                ".emp-info-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 20px; }" +
                ".emp-info-col { display: table-cell; background: #fdfdfd; border: 1px solid #efefef; border-radius: 10px; padding: 10px 15px; }" +
                ".label { font-size: 7pt; color: #999; text-transform: uppercase; font-weight: bold; margin-bottom: 3px; display: block; }" +
                ".value { font-size: 10pt; color: #222; font-weight: 600; }" +
                ".items-container { border: 1px solid " + brandColor + "66; border-radius: 14px; overflow: hidden; margin-bottom: 20px; }" +
                ".items-table { width: 100%; border-collapse: collapse; }" +
                "thead th { background: " + brandColor + "11; color: " + brandColor + "; border-bottom: 2px solid " + brandColor + "; padding: 12px 15px; font-size: 8pt; text-transform: uppercase; font-weight: 800; }" +
                "tbody td { padding: 10px 15px; border-bottom: 1px solid #f0f0f0; }" +
                ".code { color: #999; font-family: monospace; font-size: 8pt; }" +
                ".desc { font-weight: 500; color: #1a1a1a; }" +
                ".text-red { color: #dc2626; }" +
                ".totals-row { background: #fafafa; font-weight: bold; }" +
                ".totals-row td { border-top: 1px solid #eee; padding: 15px; }" +
                ".net-pay-card { background: " + brandColor + "; color: #fff; padding: 20px; border-radius: 12px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px " + brandColor + "44; }" +
                ".net-pay-label { font-size: 10pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }" +
                ".net-pay-value { font-size: 22pt; font-weight: 900; }" +
                ".bases-grid { display: table; width: 100%; margin-top: 25px; border-collapse: collapse; background: #f8f9fa; border-radius: 8px; overflow: hidden; }" +
                ".base-item { display: table-cell; padding: 12px; text-align: center; border: 1px solid #eee; }" +
                ".base-label { font-size: 6.5pt; color: #777; text-transform: uppercase; display: block; margin-bottom: 4px; }" +
                ".base-value { font-size: 9pt; color: #333; font-weight: bold; }" +
                ".sidebar-note { position: absolute; right: -80px; top: 100px; transform: rotate(90deg); color: #bbb; font-size: 6.5pt; width: 400px; text-transform: uppercase; letter-spacing: 1px; }" +
                ".signatures { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }" +
                ".sign-box { width: 40%; border-top: 1px solid #ccc; text-align: center; padding-top: 8px; font-size: 8pt; color: #666; }" +
                ".date-box { width: 15%; text-align: center; font-size: 12pt; color: #ddd; }" +
                "</style></head><body>" +
                "<div class='page-wrapper'>" +
                "  <div class='sidebar-note'>Declaro ter recebido a importância líquida discriminada neste recibo</div>" +
                "  <div class='brand-header'>" +
                "    <div class='employer-card'>" +
                "      <div class='employer-label'>Empregador</div>" +
                "      " + logoHtml +
                "      <div class='employer-name'>" + p.getCompanyName() + "</div>" +
                "      <div style='font-size: 8pt; color: #666; margin-top: 3px;'>" + p.getCompanyCnpj() + "</div>" +
                "    </div>" +
                "    <div class='title-card'>" +
                "      <div class='main-title'>Recibo de Pagamento</div>" +
                "      <div class='subtitle'>Competência: <strong>" + String.format("%02d/%d", p.getMonth(), p.getYear()) + "</strong></div>" +
                "    </div>" +
                "  </div>" +
                "  <div class='emp-info-grid'>" +
                "    <div class='emp-info-col' style='width: 40%;'><span class='label'>Colaborador</span><span class='value'>" + p.getEmployeeName() + "</span></div>" +
                "    <div class='emp-info-col'><span class='label'>Matrícula</span><span class='value'>" + p.getRegistrationNumber() + "</span></div>" +
                "    <div class='emp-info-col'><span class='label'>CPF</span><span class='value'>" + p.getEmployeeCpf() + "</span></div>" +
                "  </div>" +
                "  <div class='emp-info-grid'>" +
                "    <div class='emp-info-col' style='width: 45%;'><span class='label'>Cargo</span><span class='value'>" + p.getPosition() + "</span></div>" +
                "    <div class='emp-info-col'><span class='label'>Departamento</span><span class='value'>" + p.getDepartment() + "</span></div>" +
                "  </div>" +
                "  <div class='items-container'>" +
                "    <table class='items-table'>" +
                "      <thead>" +
                "        <tr><th width='80'>Cod.</th><th>Descrição</th><th class='text-center'>Ref.</th><th class='text-right'>Vencimentos</th><th class='text-right'>Descontos</th></tr>" +
                "      </thead>" +
                "      <tbody>" + itemsHtml.toString() + "</tbody>" +
                "      <tr class='totals-row'>" +
                "        <td colspan='3' class='text-right' style='color:" + brandColor + ";'>TOTAIS</td>" +
                "        <td class='text-right' style='color:" + brandColor + ";'>" + formatCurrency(p.getTotalEarnings()) + "</td>" +
                "        <td class='text-right text-red'>" + formatCurrency(p.getTotalDeductions()) + "</td>" +
                "      </tr>" +
                "    </table>" +
                "  </div>" +
                "  <div class='net-pay-card'>" +
                "    <div class='net-pay-label'>Líquido a Receber</div>" +
                "    <div class='net-pay-value'>" + formatCurrency(p.getNetSalary()) + "</div>" +
                "  </div>" +
                "  <div class='bases-grid'>" +
                "    <div class='base-item'><span class='base-label'>Salário Base</span><span class='base-value'>" + formatCurrency(p.getBaseSalary()) + "</span></div>" +
                "    <div class='base-item'><span class='base-label'>Base INSS</span><span class='base-value'>" + formatCurrency(p.getInssBase()) + "</span></div>" +
                "    <div class='base-item'><span class='base-label'>Base IRRF</span><span class='base-value'>" + formatCurrency(p.getIrrfBase()) + "</span></div>" +
                "    <div class='base-item'><span class='base-label'>Base FGTS</span><span class='base-value'>" + formatCurrency(p.getFgtsBase()) + "</span></div>" +
                "    <div class='base-item'><span class='base-label'>FGTS Mês</span><span class='base-value'>" + formatCurrency(p.getFgtsAmount()) + "</span></div>" +
                "  </div>" +
                "  <div class='signatures'>" +
                "    <div class='date-box'>___/___/___</div>" +
                "    <div class='sign-box'>Assinatura do Funcionário</div>" +
                "  </div>" +
                "</div>" +
                "</body></html>";
    }

    private String formatCurrency(BigDecimal value) {
        if (value == null) return "R$ 0,00";
        return currencyFormatter.format(value);
    }
}
