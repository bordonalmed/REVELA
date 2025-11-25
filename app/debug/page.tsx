'use client';

import { useState, useEffect } from 'react';
import { collectDebugInfo, exportDebugInfo, copyDebugInfoToClipboard, detectCommonIssues } from '@/lib/debug-info';
import type { DebugInfo } from '@/lib/debug-info';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const info = collectDebugInfo();
    setDebugInfo(info);
    setIssues(detectCommonIssues());
  }, []);

  const handleCopy = async () => {
    const success = await copyDebugInfoToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Fallback: mostrar texto para copiar manualmente
      const text = exportDebugInfo();
      alert('Copie o texto abaixo:\n\n' + text);
    }
  };

  if (!debugInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A2B32' }}>
        <p style={{ color: '#E8DCC0' }}>Carregando informações...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8" style={{ backgroundColor: '#1A2B32' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: '#E8DCC0' }}>
          🔍 Informações de Debug
        </h1>

        {/* Botões de Ação */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
          >
            {copied ? '✓ Copiado!' : '📋 Copiar Informações'}
          </button>
          <button
            onClick={() => {
              const text = exportDebugInfo();
              const blob = new Blob([text], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `debug-info-${new Date().toISOString()}.json`;
              a.click();
            }}
            className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90 border"
            style={{ 
              borderColor: '#E8DCC0', 
              color: '#E8DCC0',
              backgroundColor: 'transparent'
            }}
          >
            💾 Baixar JSON
          </button>
        </div>

        {/* Problemas Detectados */}
        {issues.length > 0 && (
          <div className="mb-6 p-4 rounded-lg border" style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            borderColor: 'rgba(239, 68, 68, 0.3)' 
          }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#fca5a5' }}>
              ⚠️ Problemas Detectados
            </h2>
            <ul className="list-disc list-inside space-y-1">
              {issues.map((issue, index) => (
                <li key={index} style={{ color: '#fca5a5' }}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Informações do Navegador */}
        <div className="mb-6 p-4 rounded-lg border" style={{ 
          backgroundColor: 'rgba(232, 220, 192, 0.05)', 
          borderColor: 'rgba(232, 220, 192, 0.1)' 
        }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#E8DCC0' }}>
            🌐 Navegador e Sistema
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>User Agent:</span>
              <p style={{ color: '#E8DCC0' }} className="break-all">{debugInfo.userAgent}</p>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Plataforma:</span>
              <span style={{ color: '#E8DCC0' }}> {debugInfo.platform}</span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Idioma:</span>
              <span style={{ color: '#E8DCC0' }}> {debugInfo.language}</span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Cookies:</span>
              <span style={{ color: debugInfo.cookieEnabled ? '#00A88F' : '#ef4444' }}>
                {' '}{debugInfo.cookieEnabled ? '✓ Habilitado' : '✗ Desabilitado'}
              </span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Online:</span>
              <span style={{ color: debugInfo.onLine ? '#00A88F' : '#ef4444' }}>
                {' '}{debugInfo.onLine ? '✓ Sim' : '✗ Não'}
              </span>
            </div>
          </div>
        </div>

        {/* Tela e Janela */}
        <div className="mb-6 p-4 rounded-lg border" style={{ 
          backgroundColor: 'rgba(232, 220, 192, 0.05)', 
          borderColor: 'rgba(232, 220, 192, 0.1)' 
        }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#E8DCC0' }}>
            📱 Tela e Janela
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Largura da Tela:</span>
              <span style={{ color: '#E8DCC0' }}> {debugInfo.screen.width}px</span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Altura da Tela:</span>
              <span style={{ color: '#E8DCC0' }}> {debugInfo.screen.height}px</span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Largura da Janela:</span>
              <span style={{ color: '#E8DCC0' }}> {debugInfo.window.innerWidth}px</span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Altura da Janela:</span>
              <span style={{ color: '#E8DCC0' }}> {debugInfo.window.innerHeight}px</span>
            </div>
          </div>
        </div>

        {/* Armazenamento */}
        <div className="mb-6 p-4 rounded-lg border" style={{ 
          backgroundColor: 'rgba(232, 220, 192, 0.05)', 
          borderColor: 'rgba(232, 220, 192, 0.1)' 
        }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#E8DCC0' }}>
            💾 Armazenamento
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>localStorage:</span>
              <span style={{ color: debugInfo.storage.localStorage ? '#00A88F' : '#ef4444' }}>
                {' '}{debugInfo.storage.localStorage ? '✓ Disponível' : '✗ Indisponível'}
              </span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>sessionStorage:</span>
              <span style={{ color: debugInfo.storage.sessionStorage ? '#00A88F' : '#ef4444' }}>
                {' '}{debugInfo.storage.sessionStorage ? '✓ Disponível' : '✗ Indisponível'}
              </span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>IndexedDB:</span>
              <span style={{ color: debugInfo.storage.indexedDB ? '#00A88F' : '#ef4444' }}>
                {' '}{debugInfo.storage.indexedDB ? '✓ Disponível' : '✗ Indisponível'}
              </span>
            </div>
          </div>
        </div>

        {/* Recursos */}
        <div className="mb-6 p-4 rounded-lg border" style={{ 
          backgroundColor: 'rgba(232, 220, 192, 0.05)', 
          borderColor: 'rgba(232, 220, 192, 0.1)' 
        }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#E8DCC0' }}>
            ⚙️ Recursos do Navegador
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Service Worker:</span>
              <span style={{ color: debugInfo.features.serviceWorker ? '#00A88F' : '#ef4444' }}>
                {' '}{debugInfo.features.serviceWorker ? '✓ Disponível' : '✗ Indisponível'}
              </span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>WebGL:</span>
              <span style={{ color: debugInfo.features.webGL ? '#00A88F' : '#ef4444' }}>
                {' '}{debugInfo.features.webGL ? '✓ Disponível' : '✗ Indisponível'}
              </span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Canvas:</span>
              <span style={{ color: debugInfo.features.canvas ? '#00A88F' : '#ef4444' }}>
                {' '}{debugInfo.features.canvas ? '✓ Disponível' : '✗ Indisponível'}
              </span>
            </div>
            <div>
              <span style={{ color: '#E8DCC0', opacity: 0.7 }}>Web Audio:</span>
              <span style={{ color: debugInfo.features.webAudio ? '#00A88F' : '#ef4444' }}>
                {' '}{debugInfo.features.webAudio ? '✓ Disponível' : '✗ Indisponível'}
              </span>
            </div>
          </div>
        </div>

        {/* JSON Completo */}
        <details className="mt-6">
          <summary className="cursor-pointer text-lg font-semibold mb-2" style={{ color: '#E8DCC0' }}>
            📄 JSON Completo (clique para expandir)
          </summary>
          <pre className="p-4 rounded-lg overflow-auto text-xs" style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: '#E8DCC0'
          }}>
            {exportDebugInfo()}
          </pre>
        </details>
      </div>
    </div>
  );
}

