export interface ClinicProfileSettings {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'revela_clinic_profile';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function sanitizeText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

export function getClinicProfileStorageKey(ownerEmail?: string | null): string {
  const email = sanitizeText(ownerEmail).toLowerCase();
  if (!email) return `${STORAGE_PREFIX}:last`;
  return `${STORAGE_PREFIX}:${email}`;
}

export function getDefaultClinicProfileSettings(): ClinicProfileSettings {
  return {
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    updatedAt: new Date().toISOString(),
  };
}

export function readClinicProfileSettings(ownerEmail?: string | null): ClinicProfileSettings {
  if (typeof window === 'undefined') return getDefaultClinicProfileSettings();

  const key = getClinicProfileStorageKey(ownerEmail);
  const fromUserKey = safeParse<ClinicProfileSettings>(window.localStorage.getItem(key));
  const fromLastKey = safeParse<ClinicProfileSettings>(
    key === `${STORAGE_PREFIX}:last` ? null : window.localStorage.getItem(`${STORAGE_PREFIX}:last`),
  );

  const base = fromUserKey || fromLastKey || getDefaultClinicProfileSettings();

  return {
    clinicName: sanitizeText(base.clinicName),
    clinicAddress: sanitizeText(base.clinicAddress),
    clinicPhone: sanitizeText(base.clinicPhone),
    updatedAt: base.updatedAt || new Date().toISOString(),
  };
}

export function writeClinicProfileSettings(
  next: Omit<ClinicProfileSettings, 'updatedAt'>,
  ownerEmail?: string | null,
): ClinicProfileSettings {
  const saved: ClinicProfileSettings = {
    clinicName: sanitizeText(next.clinicName),
    clinicAddress: sanitizeText(next.clinicAddress),
    clinicPhone: sanitizeText(next.clinicPhone),
    updatedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return saved;

  const key = getClinicProfileStorageKey(ownerEmail);
  window.localStorage.setItem(key, JSON.stringify(saved));
  window.localStorage.setItem(`${STORAGE_PREFIX}:last`, JSON.stringify(saved));
  return saved;
}

