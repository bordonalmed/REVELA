'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { trackChangePassword } from '@/lib/analytics';
import { usePlan } from '@/hooks/usePlan';
import { createEncryptedBackup, sendEncryptedBackupToServer } from '@/lib/secure-backup';
import type { Project } from '@/lib/storage';
import {
  listLocalProjectsForCloud,
  restoreProjectsFromCloud,
  syncSelectedProjectsToCloud,
} from '@/lib/cloud-project-backup';
import { readBrandingSettings, writeBrandingSettings, type BrandingSelectedLogo } from '@/lib/branding';
import { readClinicProfileSettings, writeClinicProfileSettings } from '@/lib/clinic-profile';

export default function SettingsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { hasProAccess: isProUser, hasPremiumAccess: isPremiumUser } = usePlan();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);
  const [logoMessage, setLogoMessage] = useState('');
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [selectedLogo, setSelectedLogo] = useState<BrandingSelectedLogo>('revela');
  const [secureBackupEnabled, setSecureBackupEnabled] = useState(false);
  const [secureBackupStatus, setSecureBackupStatus] = useState<string | null>(null);
  const [secureBackupPassword, setSecureBackupPassword] = useState('');
  const [secureBackupRunning, setSecureBackupRunning] = useState(false);

  // Backup em nuvem (Premium)
  const [cloudBackupEnabled, setCloudBackupEnabled] = useState(false);
  const [cloudBackupRunning, setCloudBackupRunning] = useState(false);
  const [cloudRestoreRunning, setCloudRestoreRunning] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);
  const [localCloudProjects, setLocalCloudProjects] = useState<Project[]>([]);
  const [selectedCloudProjectIds, setSelectedCloudProjectIds] = useState<Record<string, boolean>>(
    {}
  );
  const [cloudSyncScope, setCloudSyncScope] = useState<'all' | 'selected'>('selected');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicDataMessage, setClinicDataMessage] = useState('');
  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const sessionUser = session?.user ?? null;
    setUser(sessionUser);
    if (sessionUser) {
      setEmail(sessionUser.email || '');
    }
    if (!session) {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router, checkUser]);

  // Carregar logo salvo localmente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const branding = readBrandingSettings(user?.email || null);
    setWatermarkEnabled(branding.watermarkEnabled);
    setSelectedLogo(branding.selectedLogo);
    if (branding.customLogoDataUrl) setClinicLogo(branding.customLogoDataUrl);
  }, [isProUser, user?.email]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const profile = readClinicProfileSettings(user?.email || null);
    setClinicName(profile.clinicName);
    setClinicAddress(profile.clinicAddress);
    setClinicPhone(profile.clinicPhone);
  }, [user?.email]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const enabled = window.localStorage.getItem('revela_secure_backup_enabled');
    setSecureBackupEnabled(enabled === 'true');
    const last = window.localStorage.getItem('revela_secure_backup_last_cloud');
    if (last) {
      const d = new Date(last);
      setSecureBackupStatus(
        `Último backup seguro: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
      );
    }
  }, []);

  // Init do backup em nuvem (Premium)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const enabled = window.localStorage.getItem('revela_cloud_backup_enabled');
    setCloudBackupEnabled(enabled === 'true');

    const lastAuto = window.localStorage.getItem('revela_cloud_last_auto_sync');
    if (lastAuto) {
      try {
        const parsed = JSON.parse(lastAuto) as { at?: string; uploaded?: number; updated?: number; skipped?: number; failures?: number };
        if (parsed?.at) {
          const d = new Date(parsed.at);
          setCloudSyncStatus(
            `Última sincronização automática: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
          );
        }
      } catch {
        // ignore
      }
    }

    const stored = window.localStorage.getItem('revela_cloud_selected_project_ids');
    if (stored) {
      try {
        const ids = JSON.parse(stored) as string[];
        const map: Record<string, boolean> = {};
        for (const id of ids) map[id] = true;
        setSelectedCloudProjectIds(map);
      } catch {
        // ignore
      }
    }

    const scope = window.localStorage.getItem('revela_cloud_sync_scope');
    if (scope === 'all' || scope === 'selected') {
      setCloudSyncScope(scope);
    }
  }, []);

  useEffect(() => {
    // Carrega projetos locais para seleção (apenas para Premium).
    if (!isPremiumUser) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    listLocalProjectsForCloud()
      .then((projects) => {
        if (cancelled) return;
        setLocalCloudProjects(
          (projects || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        );
      })
      .catch(() => {
        // Se falhar, não bloqueia a página.
      });

    return () => {
      cancelled = true;
    };
  }, [isPremiumUser, user?.id]);

  const handleToggleSecureBackup = (enabled: boolean) => {
    setSecureBackupEnabled(enabled);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('revela_secure_backup_enabled', enabled ? 'true' : 'false');
    }
  };

  const handleRunSecureBackup = async () => {
    if (!isPremiumUser) {
      router.push('/planos');
      return;
    }
    if (!secureBackupEnabled) {
      alert('Ative o backup seguro antes de criar um backup.');
      return;
    }
    if (!secureBackupPassword || secureBackupPassword.length < 8) {
      alert('Defina uma senha de backup com pelo menos 8 caracteres.');
      return;
    }
    try {
      setSecureBackupRunning(true);
      const { payload } = await createEncryptedBackup(secureBackupPassword);
      await sendEncryptedBackupToServer(payload);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('revela_secure_backup_last_cloud', payload.createdAt);
      }
      setSecureBackupStatus(
        `Último backup seguro: ${new Date(payload.createdAt).toLocaleDateString()} ${new Date(
          payload.createdAt
        ).toLocaleTimeString()}`
      );
      alert('Backup seguro criado com sucesso. Armazenamento local continua sendo o padrão.');
    } catch (err: any) {
      console.error('Erro ao criar backup seguro:', err);
      alert(err.message || 'Erro ao criar backup seguro. Tente novamente.');
    } finally {
      setSecureBackupRunning(false);
    }
  };

  const handleToggleCloudBackupEnabled = (enabled: boolean) => {
    setCloudBackupEnabled(enabled);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('revela_cloud_backup_enabled', enabled ? 'true' : 'false');
    }
  };

  const toggleSelectedCloudProject = (projectId: string) => {
    setSelectedCloudProjectIds((prev) => {
      const next = { ...prev };
      if (next[projectId]) delete next[projectId];
      else next[projectId] = true;

      if (typeof window !== 'undefined') {
        const ids = Object.keys(next);
        window.localStorage.setItem('revela_cloud_selected_project_ids', JSON.stringify(ids));
      }

      return next;
    });
  };

  const handleSyncSelectedProjectsToCloud = async () => {
    if (!isPremiumUser) {
      router.push('/planos');
      return;
    }
    if (!cloudBackupEnabled) {
      alert('Ative o backup em nuvem antes de sincronizar.');
      return;
    }
    if (!user?.id) {
      alert('Usuário não carregado. Tente novamente.');
      return;
    }

    const selected =
      cloudSyncScope === 'all'
        ? localCloudProjects
        : localCloudProjects.filter((p) => selectedCloudProjectIds[p.id]);
    if (!selected.length) {
      alert(
        cloudSyncScope === 'all'
          ? 'Não há projetos locais para sincronizar.'
          : 'Selecione ao menos 1 projeto para sincronizar.'
      );
      return;
    }

    try {
      setCloudSyncStatus(null);
      setCloudBackupRunning(true);
      const res = await syncSelectedProjectsToCloud(user.id, selected);

      const msg = [
        `Enviados/atualizados: +${res.uploaded} novos, +${res.updated} atualizados.`,
        res.skipped ? `Pulados (sem fotos para armazenar): ${res.skipped}.` : null,
        res.failures.length ? `Falhas: ${res.failures.length}.` : null,
      ]
        .filter(Boolean)
        .join(' ');
      setCloudSyncStatus(msg);
    } catch (err: any) {
      console.error('Erro ao sincronizar para nuvem:', err);
      setCloudSyncStatus(err?.message || 'Erro ao sincronizar para nuvem.');
    } finally {
      setCloudBackupRunning(false);
    }
  };

  const handleRestoreProjectsFromCloud = async () => {
    if (!isPremiumUser) {
      router.push('/planos');
      return;
    }
    if (!user?.id) {
      alert('Usuário não carregado. Tente novamente.');
      return;
    }
    try {
      setCloudSyncStatus(null);
      setCloudRestoreRunning(true);
      const res = await restoreProjectsFromCloud(user.id);
      const msg = [
        `Restaurados: ${res.restored}.`,
        res.skipped ? `Ignorados (não eram backups): ${res.skipped}.` : null,
        res.failures.length ? `Falhas: ${res.failures.length}.` : null,
      ]
        .filter(Boolean)
        .join(' ');
      setCloudSyncStatus(msg);

      // Recarregar projetos locais
      const refreshed = await listLocalProjectsForCloud();
      setLocalCloudProjects(
        (refreshed || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      );
    } catch (err: any) {
      console.error('Erro ao restaurar da nuvem:', err);
      setCloudSyncStatus(err?.message || 'Erro ao restaurar da nuvem.');
    } finally {
      setCloudRestoreRunning(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoMessage('Selecione um arquivo de imagem (PNG ou JPG).');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setClinicLogo(result);
      setSelectedLogo('custom');
      setLogoMessage('Logo salvo. Ele será usado como marca d’água quando selecionado.');
      if (typeof window !== 'undefined') {
        writeBrandingSettings(
          {
            watermarkEnabled: isProUser ? watermarkEnabled : true,
            selectedLogo: 'custom',
            customLogoDataUrl: result,
          },
          user?.email || null,
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setClinicLogo(null);
    setLogoMessage('');
    if (typeof window !== 'undefined') {
      writeBrandingSettings(
        {
          watermarkEnabled: isProUser ? watermarkEnabled : true,
          selectedLogo: 'revela',
          customLogoDataUrl: null,
        },
        user?.email || null,
      );
    }
  };

  const handleToggleWatermark = (enabled: boolean) => {
    const effectiveEnabled = isProUser ? enabled : true;
    setWatermarkEnabled(effectiveEnabled);
    if (typeof window !== 'undefined') {
      writeBrandingSettings(
        {
          watermarkEnabled: effectiveEnabled,
          selectedLogo,
          customLogoDataUrl: clinicLogo,
        },
        user?.email || null,
      );
    }
  };

  const handleSelectLogo = (nextLogo: BrandingSelectedLogo) => {
    const resolved = nextLogo === 'custom' && !clinicLogo ? 'revela' : nextLogo;
    setSelectedLogo(resolved);
    if (typeof window !== 'undefined') {
      writeBrandingSettings(
        {
          watermarkEnabled: isProUser ? watermarkEnabled : true,
          selectedLogo: resolved,
          customLogoDataUrl: clinicLogo,
        },
        user?.email || null,
      );
    }
  };

  const handleSaveClinicData = () => {
    if (!isPremiumUser) {
      router.push('/planos');
      return;
    }
    const saved = writeClinicProfileSettings(
      {
        clinicName,
        clinicAddress,
        clinicPhone,
      },
      user?.email || null,
    );
    setClinicName(saved.clinicName);
    setClinicAddress(saved.clinicAddress);
    setClinicPhone(saved.clinicPhone);
    setClinicDataMessage('Dados da clínica salvos com sucesso.');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(t.settings.passwordMismatch);
      setUpdating(false);
      return;
    }

    if (newPassword.length < 6) {
      setError(t.settings.passwordTooShort);
      setUpdating(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Trackear alteração de senha
      trackChangePassword();

      setSuccess(t.settings.success);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setError(error.message || t.settings.error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ backgroundColor: '#1A2B32' }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
            style={{ borderColor: '#00A88F', borderTopColor: 'transparent' }}
          ></div>
          <p style={{ color: '#E8DCC0' }}>{t.settings.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A2B32' }}>
      <NavigationHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-2xl pt-20 sm:pt-24">
        <h1 
          className="text-2xl sm:text-3xl font-light mb-6" 
          style={{ color: '#E8DCC0' }}
        >
          {t.settings.title}
        </h1>

        {/* Informações da Conta */}
        <div 
          className="rounded-lg p-4 sm:p-6 mb-6 border" 
          style={{ 
            backgroundColor: 'rgba(232, 220, 192, 0.05)', 
            borderColor: 'rgba(232, 220, 192, 0.1)' 
          }}
        >
          <h2 
            className="text-lg sm:text-xl font-light mb-4" 
            style={{ color: '#E8DCC0' }}
          >
            {t.settings.accountInfo}
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: '#E8DCC0' }}>{t.common.email}</Label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-transparent border-gray-600 text-white placeholder:text-gray-500"
              />
              <p className="text-xs" style={{ color: '#E8DCC0', opacity: 0.7 }}>
                {t.settings.emailCannotChange}
              </p>
            </div>
          </div>
        </div>

        {/* Marca d’água e Logo (Pro/Premium) */}
        <div
          className="rounded-lg p-4 sm:p-6 mb-6 border"
          style={{
            backgroundColor: 'rgba(232, 220, 192, 0.05)',
            borderColor: 'rgba(232, 220, 192, 0.1)',
          }}
        >
          <h2 className="text-lg sm:text-xl font-light mb-2" style={{ color: '#E8DCC0' }}>
            Marca d&apos;água e Logo
          </h2>
          <p className="text-xs sm:text-sm mb-4" style={{ color: '#E8DCC0', opacity: 0.8 }}>
            A marca d&apos;água aparece no canto inferior direito em visualização e exportações. No Pro/Premium,
            você pode desativar e escolher seu logo.
          </p>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => handleToggleWatermark(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#00A88F' }}
                disabled={!isProUser}
              />
              <span className="text-xs sm:text-sm" style={{ color: '#E8DCC0' }}>
                Ativar marca d&apos;água
                {!isProUser && ' (obrigatório no plano Free)'}
              </span>
            </label>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Logo usado na marca d&apos;água
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectLogo('revela')}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all hover:opacity-90"
                  style={{
                    backgroundColor: selectedLogo === 'revela' ? 'rgba(0, 168, 143, 0.25)' : 'rgba(232, 220, 192, 0.05)',
                    borderColor: selectedLogo === 'revela' ? 'rgba(0, 168, 143, 0.6)' : 'rgba(232, 220, 192, 0.2)',
                    color: '#E8DCC0',
                    opacity: isProUser ? 1 : 0.6,
                  }}
                  disabled={!isProUser}
                >
                  Logo Revela
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectLogo('custom')}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all hover:opacity-90"
                  style={{
                    backgroundColor: selectedLogo === 'custom' ? 'rgba(0, 168, 143, 0.25)' : 'rgba(232, 220, 192, 0.05)',
                    borderColor: selectedLogo === 'custom' ? 'rgba(0, 168, 143, 0.6)' : 'rgba(232, 220, 192, 0.2)',
                    color: '#E8DCC0',
                    opacity: isProUser ? 1 : 0.6,
                  }}
                  disabled={!isProUser}
                >
                  Meu logo
                </button>
              </div>
            </div>

            {isProUser ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="clinicLogo" style={{ color: '#E8DCC0' }}>
                    Enviar meu logo
                  </Label>
                  <input
                    id="clinicLogo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="text-sm text-revela-cream"
                  />
                </div>

                {clinicLogo && (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-md overflow-hidden border"
                      style={{ borderColor: 'rgba(232, 220, 192, 0.2)' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={clinicLogo}
                        alt="Logo do usuário"
                        className="w-full h-full object-contain bg-black/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 text-xs rounded-lg border transition-colors hover:bg-white/10"
                      style={{
                        color: '#E8DCC0',
                        borderColor: 'rgba(232, 220, 192, 0.3)',
                      }}
                    >
                      Remover logo
                    </button>
                  </div>
                )}

                {logoMessage && (
                  <p className="text-xs" style={{ color: '#00A88F' }}>
                    {logoMessage}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/planos')}
                className="px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#00A88F',
                  color: '#FFFFFF',
                }}
              >
                Conhecer planos Pro/Premium
              </button>
            )}
          </div>
        </div>

        {/* Dados da clínica (PDF Premium) */}
        <div
          className="rounded-lg p-4 sm:p-6 mb-6 border"
          style={{
            backgroundColor: 'rgba(232, 220, 192, 0.05)',
            borderColor: 'rgba(232, 220, 192, 0.1)',
          }}
        >
          <h2 className="text-lg sm:text-xl font-light mb-2" style={{ color: '#E8DCC0' }}>
            Dados da clínica (PDF)
          </h2>
          <p className="text-xs sm:text-sm mb-4" style={{ color: '#E8DCC0', opacity: 0.8 }}>
            Esses dados aparecem no relatório PDF para identificar a clínica.
          </p>

          {isPremiumUser ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="clinicNamePdf" style={{ color: '#E8DCC0' }}>
                  Nome da clínica
                </Label>
                <Input
                  id="clinicNamePdf"
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Ex.: Clínica Exemplo"
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicAddressPdf" style={{ color: '#E8DCC0' }}>
                  Endereço da clínica
                </Label>
                <Input
                  id="clinicAddressPdf"
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="Rua, número, cidade/UF"
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicPhonePdf" style={{ color: '#E8DCC0' }}>
                  Telefone da clínica
                </Label>
                <Input
                  id="clinicPhonePdf"
                  type="text"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                {clinicDataMessage ? (
                  <p className="text-xs" style={{ color: '#00A88F' }}>
                    {clinicDataMessage}
                  </p>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={handleSaveClinicData}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{
                    backgroundColor: '#00A88F',
                    color: '#FFFFFF',
                  }}
                >
                  Salvar dados da clínica
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Nome, endereço e telefone no PDF são exclusivos do plano Revela Premium.
              </p>
              <button
                type="button"
                onClick={() => router.push('/planos')}
                className="px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#00A88F',
                  color: '#FFFFFF',
                }}
              >
                Conhecer Revela Premium
              </button>
            </div>
          )}
        </div>

        {/* Logo da clínica (legado) */}
        {false && isProUser ? (
          <div
            className="rounded-lg p-4 sm:p-6 mb-6 border"
            style={{
              backgroundColor: 'rgba(232, 220, 192, 0.05)',
              borderColor: 'rgba(232, 220, 192, 0.1)',
            }}
          >
            <h2
              className="text-lg sm:text-xl font-light mb-2"
              style={{ color: '#E8DCC0' }}
            >
              {t.settings.clinicLogoTitle}
            </h2>
            {t.settings.clinicLogoDescription && (
              <p className="text-xs sm:text-sm mb-4" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                {t.settings.clinicLogoDescription}
              </p>
            )}

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="clinicLogo" style={{ color: '#E8DCC0' }}>
                  Logo da clínica
                </Label>
                <input
                  id="clinicLogo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="text-sm text-revela-cream"
                />
              </div>

              {clinicLogo && (
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-md overflow-hidden border"
                    style={{ borderColor: 'rgba(232, 220, 192, 0.2)' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={clinicLogo || undefined}
                      alt="Logo da clínica"
                      className="w-full h-full object-contain bg-black/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-2 text-xs rounded-lg border transition-colors hover:bg-white/10"
                    style={{
                      color: '#E8DCC0',
                      borderColor: 'rgba(232, 220, 192, 0.3)',
                    }}
                  >
                    {t.settings.clinicLogoRemove || 'Remover logo'}
                  </button>
                </div>
              )}

              {logoMessage && (
                <p className="text-xs" style={{ color: '#00A88F' }}>
                  {logoMessage}
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* Backup seguro (Premium) */}
        <div
          className="rounded-lg p-4 sm:p-6 mb-6 border"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderColor: 'rgba(30, 64, 175, 0.7)',
          }}
        >
          <h2
            className="text-lg sm:text-xl font-light mb-2"
            style={{ color: '#E8DCC0' }}
          >
            Backup seguro (Revela Premium)
          </h2>
          <p className="text-xs sm:text-sm mb-3" style={{ color: '#E8DCC0', opacity: 0.85 }}>
            Armazenamento local continua sendo o padrão. O backup seguro é opcional e é
            criptografado antes do envio.
          </p>

          {isPremiumUser ? (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={secureBackupEnabled}
                  onChange={(e) => handleToggleSecureBackup(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#facc15' }}
                />
                <span className="text-xs sm:text-sm" style={{ color: '#E8DCC0' }}>
                  Ativar backup criptografado opcional (beta)
                </span>
              </label>

              {secureBackupEnabled && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm" style={{ color: '#E8DCC0' }}>
                      Senha do backup (não será enviada ao servidor)
                    </label>
                    <input
                      type="password"
                      value={secureBackupPassword}
                      onChange={(e) => setSecureBackupPassword(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-slate-900 border border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-amber-400/70 focus:outline-none"
                    />
                    <p className="text-[11px]" style={{ color: '#9ca3af' }}>
                      Guarde esta senha em local seguro. Ela será usada para criptografar seus
                      dados. Não conseguimos recuperá-la se você esquecer.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <div className="text-[11px] sm:text-xs" style={{ color: '#9ca3af' }}>
                      {secureBackupStatus || 'Nenhum backup seguro criado ainda.'}
                    </div>
                    <button
                      type="button"
                      onClick={handleRunSecureBackup}
                      disabled={secureBackupRunning}
                      className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#facc15', color: '#0f172a' }}
                    >
                      {secureBackupRunning ? 'Gerando backup...' : 'Criar backup seguro agora'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm mb-4" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                Faça backup dos seus projetos com criptografia opcional, mantendo o armazenamento
                local como padrão. Disponível no Revela Premium.
              </p>
              <button
                type="button"
                onClick={() => router.push('/planos')}
                className="px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.2)',
                  color: '#facc15',
                  borderWidth: 1,
                  borderColor: 'rgba(234, 179, 8, 0.4)',
                }}
              >
                Conhecer Revela Premium
              </button>
            </>
          )}
        </div>

        {/* Backup em nuvem (Premium) */}
        <div
          className="rounded-lg p-4 sm:p-6 mb-6 border"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderColor: 'rgba(0, 168, 143, 0.35)',
          }}
        >
          <h2
            className="text-lg sm:text-xl font-light mb-2"
            style={{ color: '#E8DCC0' }}
          >
            Backup em nuvem (Revela Premium)
          </h2>
          <p className="text-xs sm:text-sm mb-3" style={{ color: '#E8DCC0', opacity: 0.85 }}>
            Selecione quais projetos você quer sincronizar. Na fase 1, projetos sem fotos podem ser
            ignorados ao salvar na nuvem.
          </p>

          {isPremiumUser ? (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cloudBackupEnabled}
                  onChange={(e) => handleToggleCloudBackupEnabled(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#00A88F' }}
                />
                <span className="text-xs sm:text-sm" style={{ color: '#E8DCC0' }}>
                  Ativar backup em nuvem (Premium)
                </span>
              </label>

              {cloudBackupEnabled && (
                <>
                  <div
                    className="rounded-lg border p-3"
                    style={{
                      backgroundColor: 'rgba(2, 6, 23, 0.55)',
                      borderColor: 'rgba(0, 168, 143, 0.2)',
                      maxHeight: 260,
                      overflowY: 'auto',
                    }}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#E8DCC0' }}>
                        <input
                          type="radio"
                          name="cloudSyncScope"
                          checked={cloudSyncScope === 'all'}
                          onChange={() => {
                            setCloudSyncScope('all');
                            if (typeof window !== 'undefined') {
                              window.localStorage.setItem('revela_cloud_sync_scope', 'all');
                            }
                          }}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#00A88F' }}
                        />
                        Todos
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#E8DCC0' }}>
                        <input
                          type="radio"
                          name="cloudSyncScope"
                          checked={cloudSyncScope === 'selected'}
                          onChange={() => {
                            setCloudSyncScope('selected');
                            if (typeof window !== 'undefined') {
                              window.localStorage.setItem('revela_cloud_sync_scope', 'selected');
                            }
                          }}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#00A88F' }}
                        />
                        Selecionados
                      </label>
                    </div>

                    {localCloudProjects.length === 0 ? (
                      <p className="text-xs" style={{ color: '#94a3b8' }}>
                        Nenhum projeto local encontrado para sincronizar.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {localCloudProjects.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center justify-between gap-3 cursor-pointer px-2 py-2 rounded-lg border"
                            style={{
                              backgroundColor: 'rgba(232, 220, 192, 0.04)',
                              borderColor: selectedCloudProjectIds[p.id]
                                ? 'rgba(0, 168, 143, 0.55)'
                                : 'rgba(148, 163, 184, 0.2)',
                            }}
                          >
                            <div className="min-w-0">
                              <div
                                className="text-xs font-medium truncate"
                                style={{ color: '#E8DCC0' }}
                              >
                                {p.name}
                              </div>
                              <div className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>
                                {p.date
                                  ? new Date(p.date).toLocaleDateString('pt-BR')
                                  : new Date(p.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={!!selectedCloudProjectIds[p.id]}
                              onChange={() => toggleSelectedCloudProject(p.id)}
                              className="w-4 h-4 rounded"
                              style={{ accentColor: '#00A88F' }}
                              disabled={cloudSyncScope === 'all'}
                            />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleSyncSelectedProjectsToCloud}
                      disabled={cloudBackupRunning}
                      className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#00A88F', color: '#0f172a' }}
                    >
                      {cloudBackupRunning ? 'Sincronizando...' : 'Sincronizar selecionados'}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestoreProjectsFromCloud}
                      disabled={cloudRestoreRunning}
                      className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'rgba(232, 220, 192, 0.08)',
                        color: '#E8DCC0',
                        border: '1px solid rgba(232, 220, 192, 0.15)',
                      }}
                    >
                      {cloudRestoreRunning ? 'Restaurando...' : 'Restaurar da nuvem'}
                    </button>
                  </div>

                  {cloudSyncStatus && (
                    <div
                      className="p-3 rounded-lg text-xs sm:text-sm"
                      style={{
                        backgroundColor: 'rgba(0, 168, 143, 0.12)',
                        color: '#bff7ea',
                        border: '1px solid rgba(0, 168, 143, 0.25)',
                      }}
                    >
                      {cloudSyncStatus}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Backup em nuvem é exclusivo do plano <strong>Revela Premium</strong>.
              </p>
              <button
                type="button"
                onClick={() => router.push('/planos')}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'rgba(0, 168, 143, 0.2)',
                  color: '#00A88F',
                  border: '1px solid rgba(0, 168, 143, 0.4)',
                }}
              >
                Ver planos Premium
              </button>
            </div>
          )}
        </div>

        {/* Alterar Senha */}
        <div 
          className="rounded-lg p-4 sm:p-6 border" 
          style={{ 
            backgroundColor: 'rgba(232, 220, 192, 0.05)', 
            borderColor: 'rgba(232, 220, 192, 0.1)' 
          }}
        >
          <h2 
            className="text-lg sm:text-xl font-light mb-4" 
            style={{ color: '#E8DCC0' }}
          >
            {t.settings.changePassword}
          </h2>

          <form onSubmit={handleUpdatePassword}>
            <div className="space-y-4">
              {error && (
                <div 
                  className="p-3 text-sm rounded-md border"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5'
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div 
                  className="p-3 text-sm rounded-md border"
                  style={{ 
                    backgroundColor: 'rgba(0, 168, 143, 0.1)', 
                    borderColor: 'rgba(0, 168, 143, 0.3)',
                    color: '#00A88F'
                  }}
                >
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword" style={{ color: '#E8DCC0' }}>
                  {t.settings.newPassword}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t.login.passwordPlaceholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={updating}
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" style={{ color: '#E8DCC0' }}>
                  {t.settings.confirmPassword}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t.login.passwordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={updating}
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full rounded-lg px-4 py-3 text-sm sm:text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#00A88F',
                  color: '#FFFFFF'
                }}
              >
                {updating ? t.settings.updating : t.settings.update}
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}


