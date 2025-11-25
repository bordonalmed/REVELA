'use client';

import { Plus, FolderOpen } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';

interface StartMenuProps {
  onNew: () => void;
  onStored: () => void;
}

export function StartMenu({ onNew, onStored }: StartMenuProps) {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 animate-in fade-in duration-700"
      style={{ backgroundColor: '#1B3C45' }}
    >
      <div className="w-full max-w-md mx-auto space-y-8 sm:space-y-10 md:space-y-12">
        {/* Logotipo e Nome */}
        <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-800">
          <div className="relative w-[200px] sm:w-[240px] md:w-[280px] h-auto">
            <SafeImage
              src="/revela3.png"
              alt="Revela Logo"
              width={280}
              height={160}
              className="w-full h-auto object-contain"
              priority
              unoptimized
              sizes="(max-width: 640px) 200px, (max-width: 768px) 240px, 280px"
            />
          </div>
        </div>

        {/* Botões Principais */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Botão Novo */}
          <button
            onClick={onNew}
            className="w-full rounded-lg px-6 py-4 sm:px-8 sm:py-5 md:px-10 md:py-6 flex items-center space-x-4 sm:space-x-5 transition-all duration-300 hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              backgroundColor: '#FFFFFF',
              color: '#0f172a'
            }}
          >
            <div className="flex-shrink-0">
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-base sm:text-lg md:text-xl font-medium mb-1">
                Novo
              </div>
              <div className="text-xs sm:text-sm md:text-base opacity-70">
                Criar novo projeto (antes & depois)
              </div>
            </div>
          </button>

          {/* Botão Armazenados */}
          <button
            onClick={onStored}
            className="w-full rounded-lg px-6 py-4 sm:px-8 sm:py-5 md:px-10 md:py-6 flex items-center space-x-4 sm:space-x-5 transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] border"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex-shrink-0">
              <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-base sm:text-lg md:text-xl font-medium mb-1">
                Armazenados
              </div>
              <div className="text-xs sm:text-sm md:text-base opacity-80">
                Acesse projetos salvos no dispositivo
              </div>
            </div>
          </button>
        </div>

        {/* Rodapé Informativo */}
        <div className="text-center pt-4 sm:pt-6 md:pt-8">
          <p 
            className="text-xs sm:text-sm md:text-base leading-relaxed px-4 sm:px-6"
            style={{ color: '#FFFFFF', opacity: 0.6 }}
          >
            As fotos permanecem apenas neste dispositivo. Privacidade garantida.
          </p>
        </div>
      </div>
    </div>
  );
}
