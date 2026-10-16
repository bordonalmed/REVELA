'use client';

import { useTr } from '@/contexts/language-context';

import Link from 'next/link';
import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { canOverridePlan, setDevPlanOverride, type UserPlan } from '@/lib/plans';
import { usePlan } from '@/hooks/usePlan';
import { PlanEntitlementAlerts } from '@/components/plan-entitlement-alerts';

export default function PlanosPage() {
  const { user } = useAuth(false);
  const tr = useTr();
  const {
    userPlan: plan,
    entitlementLoading,
    entitlementFetchError,
    showPurchaseEmailHint,
  } = usePlan();
  const isDev = canOverridePlan(user);

  const handleDevPlanChange = (next: UserPlan) => {
    setDevPlanOverride(next);
    // Forçar re-render simples (o getUserPlan lê localStorage)
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-revela-dark flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-20 sm:pt-22 pb-10 px-4 sm:px-6 md:px-8">
        <section className="max-w-4xl mx-auto">
          <header className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream mb-2">
              {tr('Planos pensados para a rotina da clínica', 'Plans built around your clinic routine')}
            </h1>
            <p className="text-sm sm:text-base text-revela-cream/80 max-w-2xl mx-auto">
              {tr('Free no aparelho · Pro: ilimitado, sua marca e export para redes · Premium: tudo do Pro + evolução, PDF, templates, apresentação, captura guiada e backup opcional na nuvem (criptografado).', 'Free on your device · Pro: unlimited, your brand and social exports · Premium: everything in Pro + evolution, PDF, templates, presentation, guided capture and optional encrypted cloud backup.')}
            </p>
          </header>

          {user && (
            <div className="mb-4">
              <PlanEntitlementAlerts
                email={user.email}
                entitlementLoading={entitlementLoading}
                entitlementFetchError={entitlementFetchError}
                showPurchaseEmailHint={showPurchaseEmailHint}
              />
            </div>
          )}

          {/* Dev: alternar plano sem Hotmart (somente para emails autorizados) */}
          {isDev && (
            <div
              className="rounded-xl border p-3 sm:p-4 mb-4"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                borderColor: 'rgba(56, 189, 248, 0.5)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-medium" style={{ color: '#E8DCC0' }}>
                    {tr('Modo desenvolvedor', 'Developer mode')}
                  </p>
                  <p className="text-[11px] sm:text-xs" style={{ color: '#E8DCC0', opacity: 0.75 }}>
                    {tr('Troque de plano para testar recursos sem Hotmart. Basta estar logado (senha já cadastrada).', 'Switch plans to test features without Hotmart. You just need to be signed in.')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] sm:text-xs" style={{ color: '#94a3b8' }}>
                    {tr('Plano atual', 'Current plan')}: <strong style={{ color: '#E8DCC0' }}>{plan}</strong>
                  </span>
                  <select
                    value={plan}
                    onChange={(e) => handleDevPlanChange(e.target.value as UserPlan)}
                    className="px-3 py-2 rounded-lg text-xs sm:text-sm border"
                    style={{
                      backgroundColor: 'rgba(2, 6, 23, 0.8)',
                      borderColor: 'rgba(148, 163, 184, 0.5)',
                      color: '#E8DCC0',
                    }}
                  >
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                    <option value="premium">premium</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setDevPlanOverride(null); if (typeof window !== 'undefined') window.location.reload(); }}
                    className="px-3 py-2 rounded-lg text-xs sm:text-sm border"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(148, 163, 184, 0.5)',
                      color: '#E8DCC0',
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8">
            {/* Plano Free */}
            <div className="rounded-xl border border-revela-cream/15 bg-revela-cream/[0.03] p-4 sm:p-5 flex flex-col">
              <h2 className="text-base sm:text-lg font-semibold text-revela-cream mb-1">
                {tr('Plano Free', 'Free Plan')}
              </h2>
              <p className="text-[10px] uppercase tracking-wide text-revela-cream/70 mb-2">
                {tr('Free — ideal para começar', 'Free — ideal to get started')}
              </p>
              <p className="text-xl font-semibold text-revela-cream mb-3">{tr('R$ 0 / mês', 'R$ 0 / month')}</p>
              <ul className="text-xs sm:text-sm text-revela-cream/90 space-y-1.5 mb-3 flex-1">
                <li>{tr('• Até 3 projetos.', '• Up to 3 projects.')}</li>
                <li>{tr('• Comparativo antes/depois com slider.', '• Before/after comparison with slider.')}</li>
                <li>{tr('• Dados só no aparelho.', '• Data stays on your device.')}</li>
                <li>{tr('• Exporta imagem com marca d’água Revela.', '• Exports images with the Revela watermark.')}</li>
                <li>{tr('• Sem exportação para redes (no Pro).', '• No social media exports (available in Pro).')}</li>
              </ul>
              <Button
                asChild
                className="mt-auto w-full bg-revela-cream text-revela-dark hover:opacity-90"
              >
                <Link href="/signup">{tr('Começar com o plano Free', 'Start with the Free plan')}</Link>
              </Button>
            </div>

            {/* Revela Pro */}
            <div className="rounded-xl border border-revela-teal/70 bg-revela-teal/10 p-4 sm:p-5 flex flex-col relative">
              <span className="absolute -top-2.5 left-3 px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide bg-revela-teal text-white">
                {tr('Mais escolhido', 'Most popular')}
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-revela-cream mb-1">
                Revela Pro
              </h2>
              <p className="text-[10px] uppercase tracking-wide text-revela-cream/80 mb-2">
                {tr('Ilimitado, sua marca, export completo', 'Unlimited, your brand, full exports')}
              </p>
              <p className="text-xl font-semibold text-revela-cream mb-3">{tr('R$ 19,90 / mês', 'R$ 19.90 / month')}</p>
              <ul className="text-xs sm:text-sm text-revela-cream/95 space-y-1.5 mb-3 flex-1">
                <li>{tr('✔ Projetos ilimitados.', '✔ Unlimited projects.')}</li>
                <li>{tr('✔ Exportações completas do app, inclusive para redes.', '✔ Full app exports, including social media.')}</li>
                <li>{tr('✔ Logo e marca d’água da clínica (ou sem marca Revela).', '✔ Your clinic logo and watermark (or no Revela mark).')}</li>
              </ul>
              <Button
                asChild
                className="mt-auto w-full bg-revela-teal text-white hover:opacity-90"
              >
                <Link
                  href="https://pay.hotmart.com/U104878188P"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tr('Quero o Revela Pro', 'Get Revela Pro')}
                </Link>
              </Button>
            </div>

            {/* Revela Premium */}
            <div className="rounded-xl border border-revela-cream/35 bg-gradient-to-b from-revela-cream/[0.10] via-revela-cream/[0.06] to-revela-dark/60 p-4 sm:p-5 flex flex-col relative">
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide bg-revela-cream/90 text-revela-dark">
                {tr('Avançado', 'Advanced')}
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-revela-cream mb-1">
                Revela Premium
              </h2>
              <p className="text-[11px] sm:text-xs uppercase tracking-wide text-revela-cream/80 mb-2">
                {tr('Tudo do Pro + recursos avançados', 'Everything in Pro + advanced features')}
              </p>
              <p className="text-xl font-semibold text-revela-cream mb-3">{tr('R$ 49,00 / mês', 'R$ 49.00 / month')}</p>
              <ul className="text-xs sm:text-sm text-revela-cream/95 space-y-1.5 mb-3 flex-1">
                <li>{tr('✔ Tudo do Revela Pro.', '✔ Everything in Revela Pro.')}</li>
                <li>{tr('• Timeline de evolução do tratamento.', '• Treatment evolution timeline.')}</li>
                <li>{tr('• Relatório visual em PDF.', '• Visual PDF report.')}</li>
                <li>{tr('• Marcações clínicas no editor.', '• Clinical annotations in the editor.')}</li>
                <li>{tr('• Modo apresentação ao paciente.', '• Patient presentation mode.')}</li>
                <li>{tr('• Backup opcional na nuvem.', '• Optional cloud backup.')}</li>
              </ul>
              <div className="mt-auto space-y-1.5">
                <Button
                  asChild
                  className="w-full bg-revela-cream text-revela-dark hover:opacity-90 font-semibold"
                >
                  <Link
                    href="https://pay.hotmart.com/X104930601U"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {tr('Quero o Revela Premium', 'Get Revela Premium')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

