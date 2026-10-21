'use client';

import { useTr } from '@/contexts/language-context';

import { notify } from '@/lib/notify';
import Link from 'next/link';
import { ShieldCheck, ChevronRight, Upload, Compass } from 'lucide-react';
import { resetTours } from '@/components/guided-tour';

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
import { readBrandingSettings, writeBrandingSettings, type BrandingSelectedLogo } from '@/lib/branding';
import { readClinicProfileSettings, writeClinicProfileSettings } from '@/lib/clinic-profile';

export default function SettingsPage() {
  const { t } = useLanguage();
  const tr = useTr();
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

  // Backup em nuvem (Premium)
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


  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoMessage(tr('Selecione um arquivo de imagem (PNG ou JPG).', 'Select an image file (PNG or JPG).'));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setClinicLogo(result);
      setSelectedLogo('custom');
      setLogoMessage(tr('Logo salvo. Ele será usado como marca d’água quando selecionado.', 'Logo saved. It will be used as the watermark when selected.'));
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
    setClinicDataMessage(tr('Dados da clínica salvos com sucesso.', 'Clinic details saved.'));
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
            {tr('Marca d’água e Logo', 'Watermark and Logo')}
          </h2>
          <p className="text-xs sm:text-sm mb-4" style={{ color: '#E8DCC0', opacity: 0.8 }}>
            {tr(
              'A marca d’água aparece no canto inferior direito em visualização e exportações. No Pro/Premium, você pode desativar e escolher seu logo.',
              'The watermark appears in the bottom-right corner when viewing and exporting. On Pro/Premium you can turn it off and choose your own logo.'
            )}
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
                {tr('Ativar marca d’água', 'Enable watermark')}
                {!isProUser && tr(' (obrigatório no plano Free)', ' (required on the Free plan)')}
              </span>
            </label>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                {tr('Logo usado na marca d’água', 'Logo used in the watermark')}
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
                  {tr('Logo Revela', 'Revela logo')}
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
                  {tr('Meu logo', 'My logo')}
                </button>
              </div>
            </div>

            {isProUser ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="clinicLogo" style={{ color: '#E8DCC0' }}>
                    {tr('Enviar meu logo', 'Upload my logo')}
                  </Label>
                  <label
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border cursor-pointer transition-colors hover:bg-white/5"
                    style={{ color: '#E8DCC0', borderColor: 'rgba(232, 220, 192, 0.25)' }}
                  >
                    <Upload className="w-4 h-4" />
                    {clinicLogo ? tr('Trocar imagem', 'Change image') : tr('Escolher imagem', 'Choose image')}
                    <input
                      id="clinicLogo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="sr-only"
                    />
                  </label>
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
                        alt={tr('Logo do usuário', 'User logo')}
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
                      {tr('Remover logo', 'Remove logo')}
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
                {tr('Conhecer planos Pro/Premium', 'See Pro/Premium plans')}
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
            {tr('Dados da clínica (PDF)', 'Clinic details (PDF)')}
          </h2>
          <p className="text-xs sm:text-sm mb-4" style={{ color: '#E8DCC0', opacity: 0.8 }}>
            {tr('Esses dados aparecem no relatório PDF para identificar a clínica.', 'These details appear in the PDF report to identify the clinic.')}
          </p>

          {isPremiumUser ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="clinicNamePdf" style={{ color: '#E8DCC0' }}>
                  {tr('Nome da clínica', 'Clinic name')}
                </Label>
                <Input
                  id="clinicNamePdf"
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder={tr('Ex.: Clínica Exemplo', 'e.g. Example Clinic')}
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicAddressPdf" style={{ color: '#E8DCC0' }}>
                  {tr('Endereço da clínica', 'Clinic address')}
                </Label>
                <Input
                  id="clinicAddressPdf"
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder={tr('Rua, número, cidade/UF', 'Street, number, city/state')}
                  className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicPhonePdf" style={{ color: '#E8DCC0' }}>
                  {tr('Telefone da clínica', 'Clinic phone')}
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
                  {tr('Salvar dados da clínica', 'Save clinic details')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                {tr('Nome, endereço e telefone no PDF são exclusivos do plano Revela Premium.', 'Name, address and phone in the PDF are available on the Revela Premium plan only.')}
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
                {tr('Conhecer Revela Premium', 'See Revela Premium')}
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
                  {tr('Logo da clínica', 'Clinic logo')}
                </Label>
                <label
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border cursor-pointer transition-colors hover:bg-white/5"
                  style={{ color: '#E8DCC0', borderColor: 'rgba(232, 220, 192, 0.25)' }}
                >
                  <Upload className="w-4 h-4" />
                  {clinicLogo ? tr('Trocar imagem', 'Change image') : tr('Escolher imagem', 'Choose image')}
                  <input
                    id="clinicLogo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="sr-only"
                  />
                </label>
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
                      alt={tr('Logo da clínica', 'Clinic logo')}
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
                    {t.settings.clinicLogoRemove || tr('Remover logo', 'Remove logo')}
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

        {/* Cofre Revela (Premium) */}
        <Link
          href="/cofre"
          className="flex items-center gap-4 rounded-lg p-4 sm:p-6 mb-6 border transition-colors hover:bg-white/5"
          style={{ backgroundColor: 'rgba(0, 168, 143, 0.08)', borderColor: 'rgba(0, 168, 143, 0.4)' }}
        >
          <span className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 168, 143, 0.18)', color: '#00A88F' }}>
            <ShieldCheck className="w-6 h-6" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-lg font-light" style={{ color: '#E8DCC0' }}>
              {tr('Cofre Revela', 'Revela Vault')}
              {!isPremiumUser && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full align-middle" style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)', color: '#facc15' }}>Premium</span>}
            </span>
            <span className="block text-xs sm:text-sm" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              {tr('Seus projetos em todos os seus aparelhos, trancados com uma senha que só você sabe.', 'Your projects on all your devices, locked with a password only you know.')}
            </span>
          </span>
          <ChevronRight className="w-5 h-5 shrink-0" style={{ color: '#94a3b8' }} />
        </Link>

        {/* Tour de primeiro uso */}
        <button
          type="button"
          onClick={() => {
            void resetTours();
            notify.success(tr('Pronto! O tour vai aparecer de novo nas telas.', 'Done! The tour will show again on each screen.'), { label: tr('Ir para o início', 'Go to home'), href: '/dashboard' });
          }}
          className="w-full flex items-center gap-4 rounded-lg p-4 sm:p-6 mb-6 border text-left transition-colors hover:bg-white/5"
          style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', borderColor: 'rgba(232, 220, 192, 0.1)' }}
        >
          <span className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(232, 220, 192, 0.08)', color: '#E8DCC0' }}>
            <Compass className="w-6 h-6" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-lg font-light" style={{ color: '#E8DCC0' }}>{tr('Rever o tour', 'Replay the tour')}</span>
            <span className="block text-xs sm:text-sm" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              {tr('Mostra de novo as dicas de onde fica cada coisa.', 'Shows the tips about where everything is again.')}
            </span>
          </span>
          <ChevronRight className="w-5 h-5 shrink-0" style={{ color: '#94a3b8' }} />
        </button>

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


