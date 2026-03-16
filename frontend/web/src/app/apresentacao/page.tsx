import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Users, Shield, Calendar, Banknote, 
  BrainCircuit, Award, Smartphone, CheckCircle2, 
  BarChart3, UserPlus, FileSignature, Fingerprint,
  Zap, HeartHandshake, BookOpen, Clock, Sparkles
} from 'lucide-react';

export default function ApresentacaoPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 overflow-x-hidden">
      {/* Background Decorators */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">A</div>
          <span className="font-bold text-2xl tracking-tight text-slate-800">AxonRH</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#modulos" className="hover:text-blue-600 transition-colors">Módulos</a>
          <a href="#fluxos" className="hover:text-blue-600 transition-colors">Fluxo Operacional</a>
          <a href="#seguranca" className="hover:text-blue-600 transition-colors">Segurança</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors hidden sm:block">Acesso Colaborador</Link>
          <a href="#cta" className="hidden sm:flex bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 items-center gap-2">
            Agendar Demo <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-24 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-medium text-sm mb-8 border border-blue-100 shadow-sm animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>A Plataforma Definitiva de Gestão de Pessoas</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6 leading-tight animate-slide-in-left">
          Evolua seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">RH e DP</span> com o poder da Inteligência Artificial
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
          Do recrutamento ao offboarding. Controle de ponto, folha de pagamento flexível, gestão de eventos, desempenho e benefícios em um único ecossistema seguro e inteligente.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-in-right" style={{ animationDelay: '300ms' }}>
          <a href="#modulos" className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 flex items-center gap-2">
            Explorar Módulos
          </a>
          <a href="#fluxos" className="bg-white text-slate-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-slate-50 transition-all shadow-md border border-slate-200 flex items-center gap-2">
            Ver Fluxos de Trabalho
          </a>
        </div>
      </section>

      {/* Stats/Logo Bar */}
      <section className="border-y border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
          <div>
            <div className="text-3xl font-bold text-slate-900 mb-1">100%</div>
            <div className="text-sm text-slate-500 font-medium">Digital & Cloud</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 mb-1">LGPD</div>
            <div className="text-sm text-slate-500 font-medium">Conformidade Total</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 mb-1">PWA</div>
            <div className="text-sm text-slate-500 font-medium">Aplicativo Mobile Nativo</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 mb-1">24/7</div>
            <div className="text-sm text-slate-500 font-medium">Assistente de IA</div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modulos" className="py-24 px-6 max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Módulos Completos para o seu Negócio</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">Um ecossistema modular desenhado para atender todas as necessidades do Departamento Pessoal e Gestão Operacional.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ModuleCard 
            icon={<UserPlus className="w-8 h-8 text-blue-500" />}
            title="Admissão e Contratação"
            desc="Processo de admissão 100% digital. Envio de documentos com OCR automático, assinatura eletrônica de contratos e onboarding fluido."
            color="hover:border-blue-500/50 hover:shadow-blue-500/10"
          />
          <ModuleCard 
            icon={<Clock className="w-8 h-8 text-indigo-500" />}
            title="Gestão de Ponto (Timesheet)"
            desc="Registro de ponto geolocalizado, gestão de horas extras, banco de horas e aprovação de espelhos pelo gestor ou administrador."
            color="hover:border-indigo-500/50 hover:shadow-indigo-500/10"
          />
          <ModuleCard 
            icon={<Banknote className="w-8 h-8 text-emerald-500" />}
            title="Folha de Pagamento"
            desc="Cálculo dinâmico de holerites, adiantamentos, integrações eSocial, férias e rescisões suportados por regras configuráveis."
            color="hover:border-emerald-500/50 hover:shadow-emerald-500/10"
          />
          <ModuleCard 
            icon={<HeartHandshake className="w-8 h-8 text-rose-500" />}
            title="Benefícios Inteligentes"
            desc="Gestão completa de VA, VR, VT e Plano de Saúde. Regras automáticas por faixa estagiária, inclusão de dependentes e isenções."
            color="hover:border-rose-500/50 hover:shadow-rose-500/10"
          />
          <ModuleCard 
            icon={<Award className="w-8 h-8 text-amber-500" />}
            title="Desempenho e Carreira"
            desc="Avaliações de desempenho, feedbacks contínuos e trilhas de aprendizagem. Matriz 9-box e planos de desenvolvimento individual (PDI)."
            color="hover:border-amber-500/50 hover:shadow-amber-500/10"
          />
          <ModuleCard 
            icon={<Calendar className="w-8 h-8 text-purple-500" />}
            title="Eventos Corporativos"
            desc="Planeje e publique eventos. Check-in de colaboradores por QR Code, listas de presença, controle visual e arquivamento de histórico."
            color="hover:border-purple-500/50 hover:shadow-purple-500/10"
          />
          <ModuleCard 
            icon={<BrainCircuit className="w-8 h-8 text-cyan-500" />}
            title="Assistente de IA"
            desc="Tire dúvidas sobre políticas, holerites e benefícios diretamente com a Inteligência Artificial Integrada, reduzindo a carga do RH em 80%."
            color="hover:border-cyan-500/50 hover:shadow-cyan-500/10"
          />
          <ModuleCard 
            icon={<BarChart3 className="w-8 h-8 text-teal-500" />}
            title="Dashboards Gerenciais"
            desc="Painéis analíticos em tempo real. Visões granulares permitindo que gestores vejam apenas a sua equipe, e admins vejam todo o escopo."
            color="hover:border-teal-500/50 hover:shadow-teal-500/10"
          />
          <ModuleCard 
            icon={<Smartphone className="w-8 h-8 text-pink-500" />}
            title="Experiência Mobile First"
            desc="Progressive Web App (PWA) permite que colaboradores instalem a plataforma em seus celulares, batendo ponto de qualquer lugar."
            color="hover:border-pink-500/50 hover:shadow-pink-500/10"
          />
        </div>
      </section>

      {/* Workflow Section */}
      <section id="fluxos" className="py-24 bg-slate-900 border-t border-slate-800 text-white relative overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fluxo Operacional de Ponta a Ponta</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Entenda como as operações da empresa fluem naturalmente dentro do sistema.</p>
          </div>

          <div className="space-y-12">
            <WorkflowStep 
              number="01"
              title="Abertura de Vaga & Contratação"
              desc="O gestor solicita uma contratação. Após aprovação, o candidato recebe acesso ao portal onde envia seus documentos e assina o contrato digitalmente."
            />
            <WorkflowStep 
              number="02"
              title="Onboarding e Benefícios Automatizados"
              desc="Com base na senioridade e vaga, o sistema já sugere e gerencia a habilitação de Plano de Saúde, cálculo de VT subsidiado e configuração do Vale Refeição."
            />
            <WorkflowStep 
              number="03"
              title="Rotina Mensal: Ponto Aberto"
              desc="Diariamente o colaborador bate seu ponto com geolocalização. O sistema calcula atrasos, adicionais noturnos e envia as parciais para o dashboard do gestor."
            />
            <WorkflowStep 
              number="04"
              title="Fechamento de Folha Simplificado"
              desc="No final do mês, todas as conciliações de ponto, descontos de convênio, adiantamentos e premiações consolidadas são processadas na folha em 1 clique."
            />
            <WorkflowStep 
              number="05"
              title="Engajamento Constante"
              desc="O colaborador verifica seu holerite PDF no celular, conversa com a IA sobre o descritivo de co-participação médica e marca presença em eventos através de QR Code."
            />
          </div>
        </div>
      </section>

      {/* Security & Access */}
      <section id="seguranca" className="py-24 px-6 max-w-7xl mx-auto bg-slate-50">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-2 text-indigo-600 shadow-sm border border-indigo-200">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              Segurança, Compliance e Permissões Granulares
            </h2>
            <p className="text-lg text-slate-600">
              Nosso motor de permissões (RBAC) garante que cada usuário veja somente o estritamente necessário para seu cargo, garantindo eficiência e total privacidade de dados (LGPD).
            </p>
            <ul className="space-y-4">
               <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Autenticação MFA e Recupeção Inteligente</strong>
                    <span className="text-slate-600 text-sm">Proteja acessos com tokens numéricos 2FA e opções claras para recuperação de contas via Email.</span>
                  </div>
               </li>
               <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Gestão de Política de Privacidade (LGPD)</strong>
                    <span className="text-slate-600 text-sm">Editores de Markdown internos permitindo atualização contínua de políticas, aceites e versionamento de assentimentos.</span>
                  </div>
               </li>
               <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Controle Funcional Granular</strong>
                    <span className="text-slate-600 text-sm">Atribua permissões exclusivas (Ex: DASHBOARD:MANAGEMENT_READ ou SETTINGS:PRIVACY_WRITE) modulando perfeitamente a visão do Diretor vs. Analista.</span>
                  </div>
               </li>
            </ul>
          </div>
          <div className="flex-1 relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
             <div className="relative bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 backdrop-blur-sm z-10 transition-transform hover:-translate-y-2 duration-500">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                   <div className="font-semibold text-slate-800">Cargos e Permissões</div>
                   <Fingerprint className="text-indigo-500" />
                </div>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Recursos Humanos</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-semibold">Acesso Total</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Gestor Financeiro</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-semibold">Folha / Dashboards</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Colaborador Comum</span>
                      <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-md font-semibold">Próprio Ponto / Holerite</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg opacity-50">
                      <span className="text-sm font-medium text-slate-700">Contabilidade Externa</span>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md font-semibold">Somente Exportações</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 relative overflow-hidden bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Pronto para transformar seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">RH</span>?
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            Agende uma demonstração gratuita e veja como o AxonRH resolve os gargalos de processos, alinha pagamentos e potencializa sua gestão humana.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button className="bg-slate-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-slate-800 transition-all shadow-xl hover:scale-105">
              Solicitar Demonstração
            </button>
            <button className="bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-full text-lg font-semibold hover:border-slate-300 transition-all">
              Falar com Vendas
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-6 py-12 text-slate-400 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">A</div>
              <span className="font-bold text-xl text-white">AxonRH</span>
            </div>
            <p className="text-sm leading-relaxed">
              O ecossistema definitivo para o Departamento Pessoal e Gestão de Talentos da sua empresa. Tecnologia a favor das pessoas.
            </p>
          </div>
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">Módulos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">Admissão e Controle</a></li>
              <li><a href="#" className="hover:text-blue-400">Ponto e Folha</a></li>
              <li><a href="#" className="hover:text-blue-400">Benefícios Corporativos</a></li>
              <li><a href="#" className="hover:text-blue-400">Inteligência Artificial</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">Sobre nós</a></li>
              <li><a href="#" className="hover:text-blue-400">Conformidade e LGPD</a></li>
              <li><a href="#" className="hover:text-blue-400">Carreiras</a></li>
              <li><a href="#" className="hover:text-blue-400">Contato</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-blue-400">Status do Sistema</a></li>
              <li><a href="#" className="hover:text-blue-400">Comunidade</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-sm flex flex-col sm:flex-row items-center justify-between">
          <p>© {new Date().getFullYear()} AxonRH Cloud Systems. Todos os direitos reservados.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="hover:text-white">Política de Privacidade</a>
            <a href="#" className="hover:text-white">Termos de Serviço</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Subcomponents

function ModuleCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  return (
    <div className={`p-8 bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${color} group`}>
      <div className="mb-6 p-4 bg-slate-50 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function WorkflowStep({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center relative group">
      {/* Connector Line hidden on mobile */}
      <div className="hidden md:block absolute left-[3.5rem] top-16 bottom-[-3rem] w-0.5 bg-slate-800 group-last:hidden" />
      
      <div className="w-16 h-16 rounded-full bg-slate-800 border-[6px] border-slate-900 flex items-center justify-center font-black text-xl text-blue-500 shrink-0 z-10 shadow-xl relative">
         {number}
         <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-20" />
      </div>
      <div className="bg-slate-800/50 border border-slate-700/50 p-6 md:p-8 rounded-3xl flex-1 backdrop-blur-sm transition-transform hover:translate-x-2 duration-300">
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 text-lg">{desc}</p>
      </div>
    </div>
  );
}

