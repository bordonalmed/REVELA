export type BrandingSelectedLogo = 'revela' | 'custom';

export interface BrandingSettings {
  watermarkEnabled: boolean;
  selectedLogo: BrandingSelectedLogo;
  customLogoDataUrl: string | null;
  updatedAt: string;
}

const STORAGE_PREFIX = 'revela_branding';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getBrandingStorageKey(ownerEmail?: string | null): string {
  const email = (ownerEmail || '').trim().toLowerCase();
  if (!email) return `${STORAGE_PREFIX}:last`;
  return `${STORAGE_PREFIX}:${email}`;
}

export function getDefaultBrandingSettings(): BrandingSettings {
  return {
    watermarkEnabled: true,
    selectedLogo: 'revela',
    customLogoDataUrl: null,
    updatedAt: new Date().toISOString(),
  };
}

export function readBrandingSettings(ownerEmail?: string | null): BrandingSettings {
  if (typeof window === 'undefined') return getDefaultBrandingSettings();

  const key = getBrandingStorageKey(ownerEmail);
  const fromUserKey = safeParse<BrandingSettings>(window.localStorage.getItem(key));
  const fromLastKey = safeParse<BrandingSettings>(
    key === `${STORAGE_PREFIX}:last` ? null : window.localStorage.getItem(`${STORAGE_PREFIX}:last`),
  );

  const legacyClinicLogo = window.localStorage.getItem('revela_clinic_logo');

  const base = fromUserKey || fromLastKey || getDefaultBrandingSettings();

  // Migração suave: se existir logo legado, considerar como customLogoDataUrl.
  if (!base.customLogoDataUrl && legacyClinicLogo) {
    base.customLogoDataUrl = legacyClinicLogo;
  }

  return {
    watermarkEnabled: !!base.watermarkEnabled,
    selectedLogo: base.selectedLogo === 'custom' ? 'custom' : 'revela',
    customLogoDataUrl: base.customLogoDataUrl || null,
    updatedAt: base.updatedAt || new Date().toISOString(),
  };
}

export function writeBrandingSettings(
  next: Omit<BrandingSettings, 'updatedAt'>,
  ownerEmail?: string | null,
): BrandingSettings {
  const saved: BrandingSettings = {
    watermarkEnabled: !!next.watermarkEnabled,
    selectedLogo: next.selectedLogo === 'custom' ? 'custom' : 'revela',
    customLogoDataUrl: next.customLogoDataUrl || null,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return saved;

  const key = getBrandingStorageKey(ownerEmail);
  window.localStorage.setItem(key, JSON.stringify(saved));
  window.localStorage.setItem(`${STORAGE_PREFIX}:last`, JSON.stringify(saved));
  return saved;
}

export interface EffectiveBranding {
  watermarkEnabled: boolean;
  watermarkLogo: BrandingSelectedLogo;
  watermarkLogoDataUrl: string; // always resolved to a URL
}

export function resolveEffectiveBranding(params: {
  ownerEmail?: string | null;
  hasProAccess: boolean;
  revealsLogoUrl?: string; // default: '/revela3-transparent-processed.png'
}): EffectiveBranding {
  const { ownerEmail, hasProAccess } = params;
  const revealsLogoUrl = params.revealsLogoUrl || '/revela3-transparent-processed.png';
  const stored = readBrandingSettings(ownerEmail);

  if (!hasProAccess) {
    return {
      watermarkEnabled: true,
      watermarkLogo: 'revela',
      watermarkLogoDataUrl: revealsLogoUrl,
    };
  }

  const watermarkEnabled = !!stored.watermarkEnabled;
  const watermarkLogo: BrandingSelectedLogo = stored.selectedLogo === 'custom' ? 'custom' : 'revela';
  const watermarkLogoDataUrl =
    watermarkLogo === 'custom' && stored.customLogoDataUrl ? stored.customLogoDataUrl : revealsLogoUrl;

  return { watermarkEnabled, watermarkLogo, watermarkLogoDataUrl };
}

