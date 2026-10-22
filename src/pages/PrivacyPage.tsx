import { PageHero } from "../components/layout/PageHero";
import { Ph, Section } from "../components/ui";
import { SITE } from "../config/site";
import { useSeo } from "../hooks";

export function PrivacyPage() {
  useSeo("Política de Privacidade", "Como tratamos os dados pessoais enviados pelo site.", "/politica-de-privacidade");
  const name = SITE.COMPANY_NAME;
  return (
    <>
      <PageHero eyebrow="LGPD" title="Política de Privacidade" crumbs={[{ to: "/", label: "Início" }, { label: "Política de Privacidade" }]} />
      <Section>
        <article className="mx-auto max-w-3xl space-y-6 leading-relaxed text-slate-700 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-graphite">
          <p className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">Modelo para revisão. Ajuste com o responsável jurídico da empresa antes de publicar.</p>
          <p>Esta política explica como a <Ph value={name} /> coleta e usa os dados pessoais enviados por este site, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
          <h2>Quais dados coletamos</h2>
          <p>Nome, telefone/WhatsApp, e-mail, cidade, tipo de cliente, serviço desejado, informações sobre os equipamentos, mensagem e fotos enviadas voluntariamente no formulário de orçamento.</p>
          <h2>Para que usamos</h2>
          <p>Exclusivamente para responder à sua solicitação, elaborar orçamentos, agendar e executar serviços e manter o histórico de atendimento.</p>
          <h2>Compartilhamento</h2>
          <p>Não vendemos seus dados. Podemos usar prestadores de serviço necessários à operação (hospedagem, e-mail), sob obrigação de confidencialidade.</p>
          <h2>Por quanto tempo guardamos</h2>
          <p><span className="ph-mark">[Informe o prazo de retenção definido pela empresa.]</span></p>
          <h2>Seus direitos</h2>
          <p>Você pode solicitar acesso, correção ou exclusão dos seus dados pelo e-mail <Ph value={SITE.COMPANY_EMAIL} fallback="[E-MAIL]" />.</p>
          <h2>Cookies e métricas</h2>
          <p>Podemos usar o Google Analytics para medir visitas de forma agregada.</p>
          <p className="text-sm text-slate-500">Última atualização: <span className="ph-mark">[DATA]</span></p>
        </article>
      </Section>
    </>
  );
}
