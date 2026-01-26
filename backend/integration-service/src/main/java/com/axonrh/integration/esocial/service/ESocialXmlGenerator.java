package com.axonrh.integration.esocial.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Gerador de XMLs para eventos eSocial.
 * Implementacao baseada no layout S-1.2.
 */
@Service
public class ESocialXmlGenerator {

    private static final String NAMESPACE = "http://www.esocial.gov.br/schema/evt/evtAdmissao/v_S_01_02_00";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    /**
     * Gera XML do evento S-2200 (Admissao).
     */
    public String generateS2200(Object employeeData) {
        // Em producao, receberia um DTO tipado
        // Aqui usamos uma estrutura simplificada para demonstracao

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<eSocial xmlns=\"").append(NAMESPACE).append("\">\n");
        xml.append("  <evtAdmissao Id=\"").append(generateEventId()).append("\">\n");
        xml.append("    <ideEvento>\n");
        xml.append("      <indRetif>1</indRetif>\n"); // 1 = Original
        xml.append("      <tpAmb>1</tpAmb>\n"); // 1 = Producao
        xml.append("      <procEmi>1</procEmi>\n"); // 1 = Aplicativo do empregador
        xml.append("      <verProc>1.0</verProc>\n");
        xml.append("    </ideEvento>\n");
        xml.append("    <ideEmpregador>\n");
        xml.append("      <tpInsc>1</tpInsc>\n"); // 1 = CNPJ
        xml.append("      <nrInsc>{{CNPJ}}</nrInsc>\n");
        xml.append("    </ideEmpregador>\n");
        xml.append("    <trabalhador>\n");
        xml.append("      <cpfTrab>{{CPF}}</cpfTrab>\n");
        xml.append("      <nmTrab>{{NOME}}</nmTrab>\n");
        xml.append("      <sexo>{{SEXO}}</sexo>\n");
        xml.append("      <racaCor>{{RACA_COR}}</racaCor>\n");
        xml.append("      <estCiv>{{ESTADO_CIVIL}}</estCiv>\n");
        xml.append("      <grauInstr>{{GRAU_INSTRUCAO}}</grauInstr>\n");
        xml.append("      <nmSoc>{{NOME_SOCIAL}}</nmSoc>\n");
        xml.append("      <nascimento>\n");
        xml.append("        <dtNascto>{{DATA_NASCIMENTO}}</dtNascto>\n");
        xml.append("        <codMunic>{{COD_MUNICIPIO_NASC}}</codMunic>\n");
        xml.append("        <uf>{{UF_NASCIMENTO}}</uf>\n");
        xml.append("        <paisNascto>{{PAIS_NASCIMENTO}}</paisNascto>\n");
        xml.append("        <paisNac>{{NACIONALIDADE}}</paisNac>\n");
        xml.append("      </nascimento>\n");
        xml.append("      <endereco>\n");
        xml.append("        <brasil>\n");
        xml.append("          <tpLograd>{{TIPO_LOGRADOURO}}</tpLograd>\n");
        xml.append("          <dscLograd>{{LOGRADOURO}}</dscLograd>\n");
        xml.append("          <nrLograd>{{NUMERO}}</nrLograd>\n");
        xml.append("          <complemento>{{COMPLEMENTO}}</complemento>\n");
        xml.append("          <bairro>{{BAIRRO}}</bairro>\n");
        xml.append("          <cep>{{CEP}}</cep>\n");
        xml.append("          <codMunic>{{COD_MUNICIPIO}}</codMunic>\n");
        xml.append("          <uf>{{UF}}</uf>\n");
        xml.append("        </brasil>\n");
        xml.append("      </endereco>\n");
        xml.append("    </trabalhador>\n");
        xml.append("    <vinculo>\n");
        xml.append("      <matricula>{{MATRICULA}}</matricula>\n");
        xml.append("      <tpRegTrab>1</tpRegTrab>\n"); // 1 = CLT
        xml.append("      <tpRegPrev>1</tpRegPrev>\n"); // 1 = RGPS
        xml.append("      <cadIni>N</cadIni>\n");
        xml.append("      <infoRegimeTrab>\n");
        xml.append("        <infoCeletista>\n");
        xml.append("          <dtAdm>{{DATA_ADMISSAO}}</dtAdm>\n");
        xml.append("          <tpAdmissao>{{TIPO_ADMISSAO}}</tpAdmissao>\n");
        xml.append("          <indAdmissao>{{IND_ADMISSAO}}</indAdmissao>\n");
        xml.append("          <tpRegJor>{{TIPO_JORNADA}}</tpRegJor>\n");
        xml.append("          <natAtividade>{{NAT_ATIVIDADE}}</natAtividade>\n");
        xml.append("          <dtBase>{{DIA_BASE}}</dtBase>\n");
        xml.append("          <cnpjSindCategProf>{{CNPJ_SINDICATO}}</cnpjSindCategProf>\n");
        xml.append("        </infoCeletista>\n");
        xml.append("      </infoRegimeTrab>\n");
        xml.append("      <infoContrato>\n");
        xml.append("        <nmCargo>{{CARGO}}</nmCargo>\n");
        xml.append("        <CBOCargo>{{CBO}}</CBOCargo>\n");
        xml.append("        <codCateg>{{CATEGORIA}}</codCateg>\n");
        xml.append("        <remuneracao>\n");
        xml.append("          <vrSalFx>{{SALARIO}}</vrSalFx>\n");
        xml.append("          <undSalFixo>{{UNIDADE_SALARIO}}</undSalFixo>\n");
        xml.append("        </remuneracao>\n");
        xml.append("        <duracao>\n");
        xml.append("          <tpContr>{{TIPO_CONTRATO}}</tpContr>\n");
        xml.append("        </duracao>\n");
        xml.append("        <localTrabalho>\n");
        xml.append("          <localTrabGeral>\n");
        xml.append("            <tpInsc>1</tpInsc>\n");
        xml.append("            <nrInsc>{{CNPJ_ESTABELECIMENTO}}</nrInsc>\n");
        xml.append("          </localTrabGeral>\n");
        xml.append("        </localTrabalho>\n");
        xml.append("      </infoContrato>\n");
        xml.append("    </vinculo>\n");
        xml.append("  </evtAdmissao>\n");
        xml.append("</eSocial>");

        return xml.toString();
    }

    /**
     * Gera XML do evento S-2206 (Alteracao Contratual).
     */
    public String generateS2206(Object contractChange) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<eSocial xmlns=\"http://www.esocial.gov.br/schema/evt/evtAltContratual/v_S_01_02_00\">\n");
        xml.append("  <evtAltContratual Id=\"").append(generateEventId()).append("\">\n");
        xml.append("    <ideEvento>\n");
        xml.append("      <indRetif>1</indRetif>\n");
        xml.append("      <tpAmb>1</tpAmb>\n");
        xml.append("      <procEmi>1</procEmi>\n");
        xml.append("      <verProc>1.0</verProc>\n");
        xml.append("    </ideEvento>\n");
        xml.append("    <ideEmpregador>\n");
        xml.append("      <tpInsc>1</tpInsc>\n");
        xml.append("      <nrInsc>{{CNPJ}}</nrInsc>\n");
        xml.append("    </ideEmpregador>\n");
        xml.append("    <ideVinculo>\n");
        xml.append("      <cpfTrab>{{CPF}}</cpfTrab>\n");
        xml.append("      <matricula>{{MATRICULA}}</matricula>\n");
        xml.append("    </ideVinculo>\n");
        xml.append("    <altContratual>\n");
        xml.append("      <dtAlteracao>{{DATA_ALTERACAO}}</dtAlteracao>\n");
        xml.append("      <vinculo>\n");
        xml.append("        <tpRegTrab>1</tpRegTrab>\n");
        xml.append("        <infoContrato>\n");
        xml.append("          <nmCargo>{{CARGO}}</nmCargo>\n");
        xml.append("          <CBOCargo>{{CBO}}</CBOCargo>\n");
        xml.append("          <remuneracao>\n");
        xml.append("            <vrSalFx>{{SALARIO}}</vrSalFx>\n");
        xml.append("            <undSalFixo>{{UNIDADE_SALARIO}}</undSalFixo>\n");
        xml.append("          </remuneracao>\n");
        xml.append("        </infoContrato>\n");
        xml.append("      </vinculo>\n");
        xml.append("    </altContratual>\n");
        xml.append("  </evtAltContratual>\n");
        xml.append("</eSocial>");

        return xml.toString();
    }

    /**
     * Gera XML do evento S-2299 (Desligamento).
     */
    public String generateS2299(Object termination) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<eSocial xmlns=\"http://www.esocial.gov.br/schema/evt/evtDeslig/v_S_01_02_00\">\n");
        xml.append("  <evtDeslig Id=\"").append(generateEventId()).append("\">\n");
        xml.append("    <ideEvento>\n");
        xml.append("      <indRetif>1</indRetif>\n");
        xml.append("      <tpAmb>1</tpAmb>\n");
        xml.append("      <procEmi>1</procEmi>\n");
        xml.append("      <verProc>1.0</verProc>\n");
        xml.append("    </ideEvento>\n");
        xml.append("    <ideEmpregador>\n");
        xml.append("      <tpInsc>1</tpInsc>\n");
        xml.append("      <nrInsc>{{CNPJ}}</nrInsc>\n");
        xml.append("    </ideEmpregador>\n");
        xml.append("    <ideVinculo>\n");
        xml.append("      <cpfTrab>{{CPF}}</cpfTrab>\n");
        xml.append("      <matricula>{{MATRICULA}}</matricula>\n");
        xml.append("    </ideVinculo>\n");
        xml.append("    <infoDeslig>\n");
        xml.append("      <mtvDeslig>{{MOTIVO_DESLIGAMENTO}}</mtvDeslig>\n");
        xml.append("      <dtDeslig>{{DATA_DESLIGAMENTO}}</dtDeslig>\n");
        xml.append("      <indPagtoAPI>{{IND_PAGAMENTO}}</indPagtoAPI>\n");
        xml.append("      <dtProjFimAPI>{{DATA_PROJECAO}}</dtProjFimAPI>\n");
        xml.append("      <pensAlim>{{PENSAO_ALIMENTICIA}}</pensAlim>\n");
        xml.append("      <percAliment>{{PERC_PENSAO}}</percAliment>\n");
        xml.append("      <vrAlim>{{VALOR_PENSAO}}</vrAlim>\n");
        xml.append("      <consigFGTS>\n");
        xml.append("        <insConsig>{{INS_CONSIG}}</insConsig>\n");
        xml.append("        <nrContr>{{NR_CONTRATO}}</nrContr>\n");
        xml.append("      </consigFGTS>\n");
        xml.append("      <infoInterm>\n");
        xml.append("        <dia>{{DIA}}</dia>\n");
        xml.append("      </infoInterm>\n");
        xml.append("      <verbasResc>\n");
        xml.append("        <dmDev>\n");
        xml.append("          <ideDmDev>{{ID_DM_DEV}}</ideDmDev>\n");
        xml.append("          <infoPerApur>\n");
        xml.append("            <ideEstabLot>\n");
        xml.append("              <tpInsc>1</tpInsc>\n");
        xml.append("              <nrInsc>{{CNPJ_ESTABELECIMENTO}}</nrInsc>\n");
        xml.append("              <codLotacao>{{COD_LOTACAO}}</codLotacao>\n");
        xml.append("              <detVerbas>\n");
        xml.append("                <codRubr>{{COD_RUBRICA}}</codRubr>\n");
        xml.append("                <ideTabRubr>{{ID_TAB_RUBRICA}}</ideTabRubr>\n");
        xml.append("                <vrRubr>{{VALOR_RUBRICA}}</vrRubr>\n");
        xml.append("              </detVerbas>\n");
        xml.append("            </ideEstabLot>\n");
        xml.append("          </infoPerApur>\n");
        xml.append("        </dmDev>\n");
        xml.append("      </verbasResc>\n");
        xml.append("    </infoDeslig>\n");
        xml.append("  </evtDeslig>\n");
        xml.append("</eSocial>");

        return xml.toString();
    }

    private String generateEventId() {
        // Formato: ID + tipo inscricao (1) + CNPJ (14) + ano/mes (6) + sequencial (5)
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%05d", (int) (Math.random() * 99999));
        return "ID1" + timestamp + random;
    }
}
