'use client';

import Link from 'next/link';
import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { canOverridePlan, setDevPlanOverride, type UserPlan } from '@/lib/plans';
import { usePlan } from '@/hooks/usePlan';

export default function PlanosPage() {
  const { user } = useAuth(false);
  const { userPlan: plan } = usePlan();
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
              Planos pensados para a rotina da clínica
            </h1>
            <p className="text-sm sm:text-base text-revela-cream/80 max-w-2xl mx-auto">
              Free no aparelho · Pro: ilimitado, sua marca e export para redes · Premium: tudo do Pro + evolução,
              PDF, templates, apresentação, captura guiada e backup opcional na nuvem (criptografado).
            </p>
          </header>

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
                    Modo desenvolvedor
                  </p>
                  <p className="text-[11px] sm:text-xs" style={{ color: '#E8DCC0', opacity: 0.75 }}>
                    Troque de plano para testar recursos sem Hotmart. Basta estar logado (senha já cadastrada).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] sm:text-xs" style={{ color: '#94a3b8' }}>
                    Plano atual: <strong style={{ color: '#E8DCC0' }}>{plan}</strong>
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
                Plano Free
              </h2>
              <p className="text-[10px] uppercase tracking-wide text-revela-cream/70 mb-2">
                Free — ideal para começar
              </p>
              <p className="text-xl font-semibold text-revela-cream mb-3">R$ 0 / mês</p>
              <ul className="text-xs sm:text-sm text-revela-cream/90 space-y-1.5 mb-3 flex-1">
                <li>• Até 3 projetos.</li>
                <li>• Comparativo antes/depois com slider.</li>
                <li>• Dados só no aparelho.</li>
                <li>• Exporta imagem com marca d’água Revela.</li>
                <li>• Sem exportação para redes (no Pro).</li>
              </ul>
              <Button
                asChild
                className="mt-auto w-full bg-revela-cream text-revela-dark hover:opacity-90"
              >
                <Link href="/signup">Começar com o plano Free</Link>
              </Button>
            </div>

            {/* Revela Pro */}
            <div className="rounded-xl border border-revela-teal/70 bg-revela-teal/10 p-4 sm:p-5 flex flex-col relative">
              <span className="absolute -top-2.5 left-3 px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide bg-revela-teal text-white">
                Mais escolhido
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-revela-cream mb-1">
                Revela Pro
              </h2>
              <p className="text-[10px] uppercase tracking-wide text-revela-cream/80 mb-2">
                Ilimitado, sua marca, export completo
              </p>
              <p className="text-xl font-semibold text-revela-cream mb-3">R$ 19,90 / mês</p>
              <ul className="text-xs sm:text-sm text-revela-cream/95 space-y-1.5 mb-3 flex-1">
                <li>✔ Projetos ilimitados.</li>
                <li>✔ Exportações completas do app, inclusive para redes.</li>
                <li>✔ Logo e marca d’água da clínica (ou sem marca Revela).</li>
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
                  Quero o Revela Pro
                </Link>
              </Button>
            </div>

            {/* Revela Premium */}
            <div className="rounded-xl border border-revela-cream/35 bg-gradient-to-b from-revela-cream/[0.10] via-revela-cream/[0.06] to-revela-dark/60 p-4 sm:p-5 flex flex-col relative">
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide bg-revela-cream/90 text-revela-dark">
                Avançado
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-revela-cream mb-1">
                Revela Premium
              </h2>
              <p className="text-[11px] sm:text-xs uppercase tracking-wide text-revela-cream/80 mb-2">
                Tudo do Pro + recursos avançados
              </p>
              <p className="text-xl font-semibold text-revela-cream mb-3">R$ 49,00 / mês</p>
              <ul className="text-xs sm:text-sm text-revela-cream/95 space-y-1.5 mb-3 flex-1">
                <li>✔ Tudo do Revela Pro.</li>
                <li>• Timeline de evolução do tratamento.</li>
                <li>• Relatório visual em PDF.</li>
                <li>• Marcações clínicas no editor.</li>
                <li>• Modo apresentação ao paciente.</li>
                <li>• Backup opcional na nuvem.</li>
              </ul>
              <div className="mt-auto space-y-1.5">
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-revela-cream text-revela-cream hover:bg-revela-cream/10"
                >
                  <Link
                    href="https://pay.hotmart.com/X104930601U"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Quero o Revela Premium
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

