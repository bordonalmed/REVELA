import type { UserPlan } from './plans';

/**
 * IDs das features exclusivas do plano Premium.
 * Use com canUsePremiumFeature(plan, id) para proteger UI e lógica.
 *
 * Onde cada feature entra na interface:
 * - timeline: app/projects/[id]/page.tsx — nova aba/seção "Timeline de evolução"
 * - templates: app/new-project ou fluxo de export — escolha de templates profissionais
 * - pdf_report: app/projects/[id] — botão "Relatório PDF" no modal de export ou barra de ações
 * - clinical_markings: components/image-editor-modal.tsx — marcações clínicas sobre a imagem (além da tarja)
 * - presentation_mode: app/projects/[id] — modo apresentação ao paciente (já existe; pode destacar para Premium)
 * - guided_capture: app/new-project ou captura no projeto — captura guiada com foto padronizada
 * - encrypted_backup: app/settings/page.tsx — seção "Backup criptografado" (opcional)
 */
export const PREMIUM_FEATURE_IDS = [
  'timeline',
  'templates',
  'pdf_report',
  'clinical_markings',
  'presentation_mode',
  'guided_capture',
  'encrypted_backup',
] as const;

export type PremiumFeatureId = (typeof PREMIUM_FEATURE_IDS)[number];

const PREMIUM_FEATURES_SET = new Set<string>(PREMIUM_FEATURE_IDS);

/**
 * Verifica se o plano do usuário permite usar uma feature Premium.
 * Use em componentes e APIs para esconder ou bloquear recursos Premium.
 */
export function canUsePremiumFeature(plan: UserPlan, featureId: PremiumFeatureId): boolean {
  if (plan !== 'premium') return false;
  return PREMIUM_FEATURES_SET.has(featureId);
}

/**
 * Lista de features Premium (para menus, upgrade prompts, etc.).
 */
export function getPremiumFeatureList(): { id: PremiumFeatureId; label: string }[] {
  return [
    { id: 'timeline', label: 'Timeline de evolução' },
    { id: 'templates', label: 'Templates profissionais automáticos' },
    { id: 'pdf_report', label: 'Relatório visual em PDF' },
    { id: 'clinical_markings', label: 'Marcações clínicas sobre a imagem' },
    { id: 'presentation_mode', label: 'Modo apresentação ao paciente' },
    { id: 'guided_capture', label: 'Captura guiada com foto padronizada' },
    { id: 'encrypted_backup', label: 'Backup opcional criptografado' },
  ];
}
