import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#1A2B32' }}>
      <div className="text-center space-y-8 w-full max-w-4xl px-4">
        {/* Logo */}
        <div className="flex justify-center">
          <Image 
            src="/revela3.png" 
            alt="Revela Logo" 
            width={0}
            height={0}
            sizes="100vw"
            className="w-[85vw] max-w-[600px] h-auto"
            priority
          />
        </div>
        
        {/* Slogan */}
        <p className="text-sm sm:text-base md:text-lg italic" style={{ color: '#E8DCC0' }}>
          Cada imagem Revela uma Evolução
        </p>
        
        {/* Botões - LADO A LADO */}
        <div className="flex flex-row gap-3 justify-center items-center w-full max-w-md mx-auto pt-8">
          <Link href="/signup" className="flex-1">
            <button 
              className="w-full rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium transition-opacity hover:opacity-90"
              style={{ 
                backgroundColor: '#00A88F',
                color: '#FFFFFF'
              }}
            >
              Criar conta
            </button>
          </Link>
          <Link href="/login" className="flex-1">
            <button 
              className="w-full rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium transition-opacity hover:opacity-90"
              style={{ 
                backgroundColor: '#E8E0D0',
                color: '#1A2B32'
              }}
            >
              Acessar conta
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
