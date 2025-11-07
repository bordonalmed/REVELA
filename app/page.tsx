import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <div style={{ backgroundColor: '#1A2B32', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="text-center w-full max-w-5xl px-2 sm:px-4 md:px-6">
          {/* Logo - DESTAQUE PRINCIPAL */}
          <div className="flex justify-center mb-6 sm:mb-8 md:mb-10">
            <div
              className="relative w-[50vw] sm:w-[40vw] md:w-[35vw] lg:w-[280px] h-auto"
              style={{
                minHeight: '100px'
              }}
            >
              <Image
                src="/revela3.png"
                alt="Revela Logo"
                width={280}
                height={160}
                className="w-full h-auto object-contain"
                priority
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 40vw, (max-width: 1024px) 35vw, 280px"
              />
            </div>
          </div>
          
          {/* Slogan */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl italic px-2" style={{ color: '#E8DCC0', opacity: 0.9 }}>
              Cada imagem Revela uma Evolução
            </p>
          </div>
          
          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-sm sm:max-w-md mx-auto mb-12 sm:mb-16 px-4">
            <Link href="/signup" className="w-full sm:flex-1">
              <button 
                className="w-full rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 md:px-4 md:py-2.5 text-xs sm:text-sm md:text-sm font-medium transition-opacity hover:opacity-90"
                style={{ 
                  backgroundColor: '#00A88F',
                  color: '#FFFFFF'
                }}
              >
                Criar conta
              </button>
            </Link>
            <Link href="/login" className="w-full sm:flex-1">
              <button 
                className="w-full rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 md:px-4 md:py-2.5 text-xs sm:text-sm md:text-sm font-medium transition-opacity hover:opacity-90"
                style={{ 
                  backgroundColor: '#E8E0D0',
                  color: '#1A2B32'
                }}
              >
                Entrar
              </button>
            </Link>
          </div>
          
          {/* Descrição Envolvente - Depois dos Botões */}
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8 px-4 sm:px-6">
            <div className="space-y-4 sm:space-y-5">
              <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed px-2" style={{ color: '#E8DCC0', opacity: 0.9 }}>
                O Revela é um programa de fotos desenvolvido para qualquer profissional que precise visualizar transformações — seja na saúde, estética, design, arquitetura, moda ou arte.
              </p>
              
              <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed px-2" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Compare imagens antes e depois lado a lado, ou deslize entre elas em um carrossel interativo. Tudo na mesma tela, com leveza e precisão.
              </p>
              
              <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed px-2" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Compatível com smartphones, tablets e notebooks, o Revela funciona sem depender da nuvem — suas fotos ficam armazenadas com segurança no seu dispositivo, garantindo privacidade total e acesso exclusivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Por que Revela? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-3 sm:mb-4 px-2" style={{ color: '#E8DCC0' }}>
              Por que Revela?
            </h2>
            <p className="text-sm sm:text-base md:text-lg font-light px-4 sm:px-6" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              Tudo que você precisa para comparar e mostrar transformações
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {/* Card 1 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">📸</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                Comparação Simultânea
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Veja antes e depois na mesma tela, lado a lado ou em carrossel interativo. Sem abas, sem complicação.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">🔒</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                Privacidade Total
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Suas fotos ficam salvas apenas no dispositivo. Sem nuvem, sem compartilhamento. Acesso exclusivo para você.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">⚡</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                Rápido e Intuitivo
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Interface fluida e responsiva, feita para o seu ritmo. Comparações instantâneas, resultados claros.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">💼</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                Para Todos os Profissionais
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Ideal para médicos, dentistas, fisioterapeutas, designers, maquiadores, restauradores e muito mais.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">🌎</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                Funciona em Qualquer Dispositivo
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                Mobile, tablet ou notebook. Tudo sincronizado localmente, sempre acessível onde você estiver.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Como Funciona */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-8 sm:mb-10 md:mb-12 px-2" style={{ color: '#E8DCC0' }}>
            Como Funciona?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-10 mb-8 sm:mb-10 md:mb-12">
            <div className="space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto text-lg sm:text-xl md:text-2xl font-medium" style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}>
                1
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium px-2" style={{ color: '#E8DCC0' }}>
                Tire ou envie suas fotos
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed px-4 sm:px-2" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                Adicione as imagens diretamente do seu dispositivo
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto text-lg sm:text-xl md:text-2xl font-medium" style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}>
                2
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium px-2" style={{ color: '#E8DCC0' }}>
                Compare em carrossel
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed px-4 sm:px-2" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                Visualize lado a lado ou navegue de forma interativa
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto text-lg sm:text-xl md:text-2xl font-medium" style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}>
                3
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium px-2" style={{ color: '#E8DCC0' }}>
                Mostre evolução real
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed px-4 sm:px-2" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                Apresente resultados de forma clara e profissional
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção CTA Final */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-4 sm:mb-6 px-2" style={{ color: '#E8DCC0' }}>
            Pronto para Revelar Resultados?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light mb-8 sm:mb-10 md:mb-12 leading-relaxed px-4 sm:px-6" style={{ color: '#E8DCC0', opacity: 0.9 }}>
            Comece agora - Cada imagem Revela uma Evolução
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 justify-center items-center w-full max-w-md sm:max-w-lg mx-auto px-4">
            <Link href="/signup" className="w-full sm:flex-1">
              <button 
                className="w-full rounded-lg px-5 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-medium transition-opacity hover:opacity-90"
                style={{ 
                  backgroundColor: '#00A88F',
                  color: '#FFFFFF'
                }}
              >
                Criar conta grátis
              </button>
            </Link>
            <Link href="/login" className="w-full sm:flex-1">
              <button 
                className="w-full rounded-lg px-5 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-medium transition-opacity hover:opacity-90 border-2"
                style={{ 
                  borderColor: '#E8E0D0',
                  color: '#E8E0D0',
                  backgroundColor: 'transparent'
                }}
              >
                Já tenho conta
              </button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
