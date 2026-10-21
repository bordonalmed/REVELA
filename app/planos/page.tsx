'use client';

import { useTr } from '@/contexts/language-context';

import React from 'react';
import Link from 'next/link';
import { Check, Minus, ShieldCheck, Mail, ChevronDown, HelpCircle } from 'lucide-react';
import { LandingHeader } from '@/components/landing-header';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/useAuth';
import { canOverridePlan, setDevPlanOverride, FREE_MAX_PROJECTS, FREE_MAX_BEFORE_IMAGES, FREE_MAX_AFTER_IMAGES, type UserPlan } from '@/lib/plans';
import { usePlan } from '@/hooks/usePlan';

const HOTMART_PRO = 'https://pay.hotmart.com/U104878188P';
const HOTMART_PREMIUM = 'https://pay.hotmart.com/X104930601U';

const RANK: Record<UserPlan, number> = { free: 0, pro: 1, premium: 2 };

function Feature({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="w-4 h-4 mt-0.5 shrink-0 text-revela-teal" />
      <span className={strong ? 'text-revela-cream font-medium' : ''}>{children}</span>
    </li>
  );
}

type Cell = boolean | string;

export default function PlanosPage() {
  const { user, loading: authLoading } = useAuth(false);
  const tr = useTr();
  const { userPlan, entitlementLoading } = usePlan();
  const isDev = canOverridePlan(user);
  const loggedIn = !!user;
  // Enquanto o plano carrega, não marcar nenhum cartão como "Seu plano"
  const plan: UserPlan | null = loggedIn && !entitlementLoading ? userPlan : null;

  const handleDevPlanChange = (next: UserPlan) => {
    setDevPlanOverride(next);
    // Forçar re-render simples (o getUserPlan lê o armazenamento da aba)
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  /** Botão de cada cartão conforme o plano atual de quem está vendo. */
  const cta = (target: UserPlan, buyHref: string | null, label: string, primary: boolean) => {
    const base = 'mt-auto w-full inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-opacity';
    if (plan === target) {
      return (
        <span className={`${base} border border-revela-teal/60 text-revela-teal cursor-default`} aria-current="true">
          {tr('Seu plano atual', 'Your current plan')}
        </span>
      );
    }
    if (plan && RANK[plan] > RANK[target]) {
      return (
        <span className={`${base} border border-revela-cream/15 text-revela-cream/50 cursor-default font-medium`}>
          {tr('Incluído no seu plano', 'Included in your plan')}
        </span>
      );
    }
    if (!buyHref) {
      return (
        <Link href="/signup" className={`${base} bg-revela-cream text-revela-dark hover:opacity-90`}>
          {tr('Criar conta grátis', 'Create a free account')}
        </Link>
      );
    }
    return (
      <a
        href={buyHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} hover:opacity-90 ${primary ? 'bg-revela-teal text-white' : 'bg-revela-cream text-revela-dark'}`}
      >
        {plan ? tr(`Mudar para o ${label}`, `Switch to ${label}`) : tr(`Quero o ${label}`, `Get ${label}`)}
      </a>
    );
  };

  const yourPlanBadge = (target: UserPlan) =>
    plan === target ? (
      <span className="absolute -top-3 right-4 px-2.5 py-1 rounded-full text-xs font-semibold bg-revela-teal text-white shadow">
        {tr('Seu plano', 'Your plan')}
      </span>
    ) : null;

  const rows: { label: string; cells: [Cell, Cell, Cell] }[] = [
    { label: tr('Projetos', 'Projects'), cells: [tr(`Até ${FREE_MAX_PROJECTS}`, `Up to ${FREE_MAX_PROJECTS}`), tr('Ilimitados', 'Unlimited'), tr('Ilimitados', 'Unlimited')] },
    { label: tr('Fotos por projeto', 'Photos per project'), cells: [tr(`${FREE_MAX_BEFORE_IMAGES} antes + ${FREE_MAX_AFTER_IMAGES} depois`, `${FREE_MAX_BEFORE_IMAGES} before + ${FREE_MAX_AFTER_IMAGES} after`), tr('Ilimitadas', 'Unlimited'), tr('Ilimitadas', 'Unlimited')] },
    { label: tr('Antes e depois lado a lado e Slider', 'Side-by-side before/after and Slider'), cells: [true, true, true] },
    { label: tr('Medir com régua na foto', 'Measure with a ruler on the photo'), cells: [true, true, true] },
    { label: tr('Modo apresentação ao paciente', 'Patient presentation mode'), cells: [true, true, true] },
    { label: tr('Lixeira de 30 dias', '30-day trash'), cells: [true, true, true] },
    { label: tr('Salvar imagem da comparação', 'Save the comparison image'), cells: [tr('Com marca Revela', 'With Revela mark'), tr('Com sua logo ou sem marca', 'Your logo or no mark'), tr('Com sua logo ou sem marca', 'Your logo or no mark')] },
    { label: tr('Publicar nas redes (formatos prontos)', 'Publish to social media (ready formats)'), cells: [false, true, true] },
    { label: tr('Relatório em PDF para o paciente', 'PDF report for the patient'), cells: [false, false, true] },
    { label: tr('Revela Evolução (linha do tempo do tratamento)', 'Revela Evolution (treatment timeline)'), cells: [false, false, true] },
    { label: tr('Marcações clínicas no editor', 'Clinical annotations in the editor'), cells: [false, false, true] },
    { label: tr('Cofre: projetos em todos os aparelhos', 'Vault: projects on all your devices'), cells: [false, false, true] },
    { label: tr('Onde ficam as fotos', 'Where photos are kept'), cells: [tr('Só no aparelho', 'Device only'), tr('Só no aparelho', 'Device only'), tr('No aparelho + Cofre trancado', 'Device + locked Vault')] },
  ];

  const faq: [string, string][] = [
    [
      tr('Posso começar sem pagar?', 'Can I start without paying?'),
      tr(`Sim. O plano Free não tem prazo e não pede cartão. Você usa com até ${FREE_MAX_PROJECTS} projetos e muda de plano quando quiser.`, `Yes. The Free plan has no time limit and needs no card. You can use up to ${FREE_MAX_PROJECTS} projects and upgrade whenever you want.`),
    ],
    [
      tr('Como funciona o pagamento?', 'How does payment work?'),
      tr('A assinatura é mensal e o pagamento é feito pela Hotmart, com as formas de pagamento que aparecem no checkout.', 'It is a monthly subscription paid through Hotmart, with the payment methods shown at checkout.'),
    ],
    [
      tr('Comprei e meu plano não mudou. E agora?', 'I paid and my plan did not change. What now?'),
      tr('Confira se usou na Hotmart o mesmo e-mail da sua conta no Revela — é por ele que o plano é liberado. Depois, recarregue a página. Se continuar, fale com a gente em Contato.', 'Make sure you used the same e-mail on Hotmart as your Revela account — that is how the plan is unlocked. Then reload the page. If it persists, reach us via Contact.'),
    ],
    [
      tr('Posso cancelar quando quiser?', 'Can I cancel anytime?'),
      tr('Sim, sem multa. O cancelamento é feito pela Hotmart. Compras pela internet também têm 7 dias de direito de arrependimento.', 'Yes, with no fee. You cancel through Hotmart. Online purchases in Brazil also have a 7-day right of withdrawal.'),
    ],
    [
      tr('O que acontece com meus projetos se eu cancelar?', 'What happens to my projects if I cancel?'),
      tr(`Nada se perde: os projetos continuam no seu aparelho e você consegue abri-los. Voltam os limites do Free para criar projetos novos (até ${FREE_MAX_PROJECTS}) e a marca Revela nas imagens. No Premium, o Cofre para de sincronizar, mas cada aparelho mantém o que já tem.`, `Nothing is lost: your projects stay on your device and you can still open them. Free limits come back for new projects (up to ${FREE_MAX_PROJECTS}) and the Revela mark returns on images. On Premium, the Vault stops syncing, but each device keeps what it has.`),
    ],
    [
      tr('Minhas fotos vão para a internet?', 'Do my photos go online?'),
      tr('No Free e no Pro, não: ficam só no seu aparelho. No Premium, só se você ligar o Cofre — e aí vão trancadas com uma senha que só você sabe; nem a equipe do Revela consegue ver.', 'On Free and Pro, no: they stay on your device only. On Premium, only if you turn on the Vault — and then they travel locked with a password only you know; not even the Revela team can see them.'),
    ],
    [
      tr('Funciona no celular?', 'Does it work on my phone?'),
      tr('Sim. O Revela funciona no navegador do celular, do tablet e do computador, sem instalar nada.', 'Yes. Revela works in the browser on your phone, tablet and computer, nothing to install.'),
    ],
    [
      tr('Posso mudar de plano depois?', 'Can I change plans later?'),
      tr('Sim. Você pode subir do Free para o Pro ou o Premium, ou do Pro para o Premium, quando quiser.', 'Yes. You can move from Free to Pro or Premium, or from Pro to Premium, whenever you want.'),
    ],
  ];

  const renderCell = (c: Cell) =>
    c === true ? (
      <Check className="w-5 h-5 mx-auto text-revela-teal" aria-label={tr('Sim', 'Yes')} />
    ) : c === false ? (
      <Minus className="w-4 h-4 mx-auto text-revela-cream/30" aria-label={tr('Não', 'No')} />
    ) : (
      <span className="text-[11px] sm:text-sm leading-tight text-revela-cream/85">{c}</span>
    );

  return (
    <div className="min-h-screen bg-revela-dark flex flex-col">
      {loggedIn ? <NavigationHeader /> : <LandingHeader />}

      <main className="flex-1 pt-20 sm:pt-24 pb-12 px-4 sm:px-6 md:px-8">
        <section className="max-w-5xl mx-auto">
          <header className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-revela-cream mb-3">
              {tr('Escolha o plano para a sua rotina', 'Choose the plan for your routine')}
            </h1>
            <p className="text-sm sm:text-base text-revela-cream/75 max-w-2xl mx-auto">
              {tr('Comece grátis. Quando precisar de mais projetos, da sua marca ou de levar tudo para outros aparelhos, é só mudar de plano.', 'Start for free. When you need more projects, your own brand or to take everything to other devices, just switch plans.')}
            </p>
          </header>

          {/* Dev: alternar plano sem Hotmart (somente para emails autorizados) */}
          {isDev && (
            <div className="rounded-xl border p-3 sm:p-4 mb-6" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', borderColor: 'rgba(56, 189, 248, 0.5)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-medium text-revela-cream">{tr('Modo desenvolvedor', 'Developer mode')}</p>
                  <p className="text-[11px] sm:text-xs text-revela-cream/75">
                    {tr('Simule outro plano para testar. Vale só nesta aba: ao fechá-la (ou tocar em "Plano real") você volta ao Premium.', 'Simulate another plan for testing. It only applies to this tab: close it (or tap "Real plan") to return to Premium.')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] sm:text-xs text-slate-400">
                    {tr('Plano atual', 'Current plan')}: <strong className="text-revela-cream">{userPlan}</strong>
                  </span>
                  <select
                    value={userPlan}
                    onChange={(e) => handleDevPlanChange(e.target.value as UserPlan)}
                    className="px-3 py-2 rounded-lg text-xs sm:text-sm border text-revela-cream"
                    style={{ backgroundColor: 'rgba(2, 6, 23, 0.8)', borderColor: 'rgba(148, 163, 184, 0.5)' }}
                  >
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                    <option value="premium">premium</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setDevPlanOverride(null); if (typeof window !== 'undefined') window.location.reload(); }}
                    className="px-3 py-2 rounded-lg text-xs sm:text-sm border text-revela-cream"
                    style={{ borderColor: 'rgba(148, 163, 184, 0.5)' }}
                  >
                    {tr('Plano real', 'Real plan')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cartões */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-5 mb-5" data-testid="plan-cards">
            {/* Free */}
            <div className={`rounded-2xl border p-5 sm:p-6 flex flex-col relative ${plan === 'free' ? 'border-revela-teal' : 'border-revela-cream/15'} bg-revela-cream/[0.03]`} data-plan="free">
              {yourPlanBadge('free')}
              <h2 className="text-lg sm:text-xl font-semibold text-revela-cream">Revela Free</h2>
              <p className="text-sm text-revela-cream/65 mb-4">{tr('Para conhecer e começar', 'To try it out and get started')}</p>
              <p className="mb-5 text-revela-cream">
                <span className="text-3xl font-semibold">R$ 0</span>
                <span className="text-sm text-revela-cream/60"> {tr('/ mês, sem prazo', '/ month, no time limit')}</span>
              </p>
              <ul className="text-sm text-revela-cream/85 space-y-2.5 mb-6 flex-1">
                <Feature>{tr(`Até ${FREE_MAX_PROJECTS} projetos`, `Up to ${FREE_MAX_PROJECTS} projects`)}</Feature>
                <Feature>{tr(`Até ${FREE_MAX_BEFORE_IMAGES} fotos antes e ${FREE_MAX_AFTER_IMAGES} depois por projeto`, `Up to ${FREE_MAX_BEFORE_IMAGES} before and ${FREE_MAX_AFTER_IMAGES} after photos per project`)}</Feature>
                <Feature>{tr('Antes e depois lado a lado e Slider', 'Side-by-side before/after and Slider')}</Feature>
                <Feature>{tr('Medir com régua e modo apresentação', 'Ruler measurement and presentation mode')}</Feature>
                <Feature>{tr('Salvar imagem com a marca Revela', 'Save images with the Revela mark')}</Feature>
                <Feature>{tr('Fotos guardadas só no seu aparelho', 'Photos kept only on your device')}</Feature>
              </ul>
              {cta('free', null, 'Free', false)}
            </div>

            {/* Pro */}
            <div className={`rounded-2xl border p-5 sm:p-6 flex flex-col relative bg-revela-teal/10 ${plan === 'pro' ? 'border-revela-teal border-2' : 'border-revela-teal/60'}`} data-plan="pro">
              {plan !== 'pro' && (
                <span className="absolute -top-3 left-5 px-2.5 py-1 rounded-full text-xs font-semibold bg-revela-teal text-white shadow">
                  {tr('Para profissionais', 'For professionals')}
                </span>
              )}
              {yourPlanBadge('pro')}
              <h2 className="text-lg sm:text-xl font-semibold text-revela-cream">Revela Pro</h2>
              <p className="text-sm text-revela-cream/65 mb-4">{tr('Sem limites e com a sua marca', 'No limits and your own brand')}</p>
              <p className="mb-5 text-revela-cream">
                <span className="text-3xl font-semibold">{tr('R$ 19,90', 'R$ 19.90')}</span>
                <span className="text-sm text-revela-cream/60"> {tr('/ mês', '/ month')}</span>
              </p>
              <p className="text-xs uppercase tracking-wide text-revela-cream/55 mb-2">{tr('Tudo do Free, mais:', 'Everything in Free, plus:')}</p>
              <ul className="text-sm text-revela-cream/85 space-y-2.5 mb-6 flex-1">
                <Feature strong>{tr('Projetos e fotos ilimitados', 'Unlimited projects and photos')}</Feature>
                <Feature strong>{tr('Sua logo nas imagens (ou sem marca Revela)', 'Your logo on images (or no Revela mark)')}</Feature>
                <Feature strong>{tr('Publicar nas redes com formatos prontos', 'Publish to social media in ready formats')}</Feature>
              </ul>
              {cta('pro', HOTMART_PRO, 'Revela Pro', true)}
            </div>

            {/* Premium */}
            <div className={`rounded-2xl border p-5 sm:p-6 flex flex-col relative bg-gradient-to-b from-revela-cream/[0.10] via-revela-cream/[0.05] to-revela-dark/60 ${plan === 'premium' ? 'border-revela-teal border-2' : 'border-revela-cream/35'}`} data-plan="premium">
              {plan !== 'premium' && (
                <span className="absolute -top-3 right-5 px-2.5 py-1 rounded-full text-xs font-semibold bg-revela-cream text-revela-dark shadow">
                  {tr('Completo', 'Complete')}
                </span>
              )}
              {yourPlanBadge('premium')}
              <h2 className="text-lg sm:text-xl font-semibold text-revela-cream">Revela Premium</h2>
              <p className="text-sm text-revela-cream/65 mb-4">{tr('Para acompanhar tratamentos em qualquer aparelho', 'To follow treatments on any device')}</p>
              <p className="mb-5 text-revela-cream">
                <span className="text-3xl font-semibold">{tr('R$ 49,00', 'R$ 49.00')}</span>
                <span className="text-sm text-revela-cream/60"> {tr('/ mês', '/ month')}</span>
              </p>
              <div className="rounded-xl border border-revela-teal/50 bg-revela-teal/10 p-3 mb-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-revela-cream">
                  <ShieldCheck className="w-4 h-4 text-revela-teal" /> {tr('Cofre Revela', 'Revela Vault')}
                </p>
                <p className="text-xs text-revela-cream/75 mt-1">
                  {tr('Seus projetos no celular, no computador e em qualquer aparelho, trancados com uma senha que só você sabe.', 'Your projects on your phone, computer and any device, locked with a password only you know.')}
                </p>
              </div>
              <p className="text-xs uppercase tracking-wide text-revela-cream/55 mb-2">{tr('Tudo do Pro, mais:', 'Everything in Pro, plus:')}</p>
              <ul className="text-sm text-revela-cream/85 space-y-2.5 mb-6 flex-1">
                <Feature strong>{tr('Relatório em PDF para o paciente', 'PDF report for the patient')}</Feature>
                <Feature strong>{tr('Revela Evolução: linha do tempo do tratamento', 'Revela Evolution: treatment timeline')}</Feature>
                <Feature strong>{tr('Marcações clínicas no editor', 'Clinical annotations in the editor')}</Feature>
              </ul>
              {cta('premium', HOTMART_PREMIUM, 'Revela Premium', false)}
            </div>
          </div>

          {/* Mesmo e-mail na Hotmart */}
          {!(plan === 'premium') && !authLoading && (
            <p className="flex items-start sm:items-center justify-center gap-2 text-xs sm:text-sm text-revela-cream/70 text-center mb-12" data-testid="email-hint">
              <Mail className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-revela-teal" />
              <span>
                {loggedIn && user?.email
                  ? tr('Na Hotmart, pague com o mesmo e-mail da sua conta: ', 'On Hotmart, pay with the same e-mail as your account: ')
                  : tr('Na Hotmart, use o mesmo e-mail que você usa (ou vai usar) no Revela — é por ele que o plano é liberado.', 'On Hotmart, use the same e-mail you use (or will use) on Revela — that is how the plan is unlocked.')}
                {loggedIn && user?.email && <strong className="text-revela-cream">{user.email}</strong>}
              </span>
            </p>
          )}

          {/* Comparação */}
          <section className="mb-12" aria-labelledby="compare-title">
            <h2 id="compare-title" className="text-xl sm:text-2xl font-light text-revela-cream text-center mb-5">
              {tr('Compare os planos', 'Compare plans')}
            </h2>
            <div className="rounded-2xl border border-revela-cream/15 overflow-x-auto">
              <table className="w-full table-fixed text-left" data-testid="compare-table">
                <thead>
                  <tr className="bg-revela-cream/[0.06]">
                    <th className="w-[34%] sm:w-[40%] px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-revela-cream/60">{tr('Recurso', 'Feature')}</th>
                    {(['free', 'pro', 'premium'] as UserPlan[]).map((p) => (
                      <th key={p} className={`px-1 sm:px-3 py-3 text-xs sm:text-sm font-semibold text-center ${plan === p ? 'text-revela-teal' : 'text-revela-cream'}`}>
                        {p === 'free' ? 'Free' : p === 'pro' ? 'Pro' : 'Premium'}
                        {plan === p && <span className="block text-[11px] font-normal">{tr('seu plano', 'your plan')}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label} className="border-t border-revela-cream/10">
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-revela-cream/90">{r.label}</td>
                      {r.cells.map((c, i) => (
                        <td key={i} className="px-1 sm:px-3 py-3 text-center align-middle">{renderCell(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Perguntas frequentes */}
          <section className="max-w-3xl mx-auto" aria-labelledby="plans-faq-title">
            <h2 id="plans-faq-title" className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-light text-revela-cream text-center mb-5">
              <HelpCircle className="w-6 h-6 text-revela-teal" /> {tr('Perguntas frequentes', 'Frequently asked questions')}
            </h2>
            <div className="rounded-2xl border border-revela-cream/15 overflow-hidden" data-testid="plans-faq">
              {faq.map(([q, a], i) => (
                <details key={q} className={`group bg-revela-cream/[0.03] ${i ? 'border-t border-revela-cream/10' : ''}`}>
                  <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none hover:bg-white/5 [&::-webkit-details-marker]:hidden">
                    <span className="flex-1 text-sm sm:text-base font-medium text-revela-cream">{q}</span>
                    <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180 text-slate-400" />
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-revela-cream/80">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}
