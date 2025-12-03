'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escutar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar se foi instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Salvar no localStorage para não mostrar novamente por um tempo
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Não mostrar se já estiver instalado ou se foi dispensado recentemente
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  // Verificar se foi dispensado recentemente (24 horas)
  const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
  if (dismissedTime) {
    const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
    if (hoursSinceDismissed < 24) {
      return null;
    }
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-lg border shadow-lg p-4"
      style={{
        backgroundColor: '#1B3C45',
        borderColor: 'rgba(232, 220, 192, 0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1" style={{ color: '#E8DCC0' }}>
            Instalar Revela
          </h3>
          <p className="text-xs mb-3" style={{ color: '#E8DCC0', opacity: 0.8 }}>
            Instale o app para acesso rápido e uso offline
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all hover:opacity-90"
              style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
            >
              <Download className="w-3.5 h-3.5" />
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all hover:opacity-90 border"
              style={{
                backgroundColor: 'transparent',
                color: '#E8DCC0',
                borderColor: 'rgba(232, 220, 192, 0.2)',
              }}
            >
              Depois
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: '#E8DCC0' }}
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

