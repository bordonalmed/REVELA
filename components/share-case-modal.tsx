'use client';

import { useEffect, useState } from 'react';
import { X, Link2, Copy, Check, MessageCircle, Loader2, AlertTriangle } from 'lucide-react';
import type { Project } from '@/lib/storage';
import {
  createSharedCase,
  deactivateSharedCase,
  findActiveSharedCaseForProject,
  type SharedCaseRecord,
} from '@/lib/share-case';

export function ShareCaseModal({
  project,
  userId,
  watermarkEnabled,
  watermarkLogoUrl,
  onClose,
}: {
  project: Project;
  userId: string;
  watermarkEnabled: boolean;
  watermarkLogoUrl: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState('');
  const [shared, setShared] = useState<SharedCaseRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const hasPhotos = project.beforeImages?.[0] && project.afterImages?.[0];

  useEffect(() => {
    let cancelled = false;
    findActiveSharedCaseForProject(project.id, userId)
      .then((record) => {
        if (!cancelled) setShared(record);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id, userId]);

  const shareUrl = shared ? `${window.location.origin}/c/${shared.id}` : null;

  const handleCreate = async () => {
    if (!hasPhotos) return;
    setError('');
    setCreating(true);
    try {
      const { id } = await createSharedCase({
        userId,
        projectId: project.id,
        beforeImageBase64: project.beforeImages[0],
        afterImageBase64: project.afterImages[0],
        watermarkEnabled,
        watermarkLogoUrl,
      });
      setShared({
        id,
        before_image_url: '',
        after_image_url: '',
        watermark_enabled: watermarkEnabled,
        watermark_logo_url: watermarkLogoUrl,
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar o link. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async () => {
    if (!shared) return;
    if (!window.confirm('Desativar esse link? Quem já tiver o link não vai mais conseguir abrir.')) return;
    setError('');
    setDeactivating(true);
    try {
      await deactivateSharedCase(shared.id);
      setShared(null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao desativar o link.');
    } finally {
      setDeactivating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignora falha de clipboard (ex.: contexto não seguro); o link já está visível pra copiar manualmente.
    }
  };

  const whatsappHref = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Veja o resultado: ${shareUrl}`)}`
    : '#';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-5 sm:p-6"
        style={{ backgroundColor: '#1A2B32', border: '1px solid rgba(232, 220, 192, 0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center gap-2" style={{ color: '#E8DCC0' }}>
            <Link2 className="w-5 h-5" />
            Link compartilhável
          </h2>
          <button onClick={onClose} style={{ color: '#E8DCC0', opacity: 0.7 }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00A88F' }} />
          </div>
        ) : !hasPhotos ? (
          <p className="text-sm" style={{ color: '#E8DCC0', opacity: 0.8 }}>
            Adicione pelo menos uma foto de antes e uma de depois neste projeto antes de gerar o link.
          </p>
        ) : shared ? (
          <div className="space-y-4">
            <p className="text-xs sm:text-sm" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              Esse link está ativo. Qualquer pessoa que o receber pode ver essas duas fotos (com marca d&apos;água),
              sem precisar de login.
            </p>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm break-all"
              style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', color: '#00A88F' }}
            >
              {shareUrl}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
            <button
              onClick={handleDeactivate}
              disabled={deactivating}
              className="w-full px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border disabled:opacity-50"
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5', backgroundColor: 'transparent' }}
            >
              {deactivating ? 'Desativando...' : 'Desativar compartilhamento'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="flex gap-2 p-3 rounded-lg text-xs sm:text-sm"
              style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#facc15' }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Isso vai gerar um link público: qualquer pessoa que o receber poderá ver a foto de antes e
                depois deste caso, sem precisar de login. Nenhum outro dado do paciente (nome, notas) é
                incluído — só as duas imagens, com marca d&apos;água. Você pode desativar o link quando quiser.
              </span>
            </div>
            {error && (
              <p className="text-xs sm:text-sm" style={{ color: '#fca5a5' }}>
                {error}
              </p>
            )}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {creating ? 'Gerando link...' : 'Gerar link compartilhável'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
