'use client';

import Link from 'next/link';
import { LandingHeader } from '@/components/landing-header';
import { Footer } from '@/components/footer';

export default function ContatoPage() {
  return (
    <div className="bg-revela-dark min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-8">
        <section className="max-w-2xl mx-auto text-revela-cream opacity-90 text-sm sm:text-base leading-relaxed">
          <header className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3">
              Fale com a equipe Revela
            </h1>
            <p className="text-sm sm:text-base opacity-80">
              Use o formulário abaixo para enviar dúvidas, sugestões ou feedback sobre o Revela.
            </p>
          </header>

          <div
            className="w-full rounded-lg p-6 sm:p-8 mb-6 text-center"
            style={{
              backgroundColor: 'rgba(232, 220, 192, 0.05)',
              border: '1px solid rgba(232, 220, 192, 0.1)',
            }}
          >
            <p className="mb-4 text-sm sm:text-base">
              Clique no botão abaixo para enviar um e-mail diretamente para a equipe do Revela.
            </p>
            <Link
              href="mailto:revela.fun@gmail.com?subject=Contato%20via%20site%20Revela"
              className="inline-block w-full sm:w-auto"
            >
              <button
                type="button"
                className="w-full sm:w-auto rounded-lg px-6 py-3 text-sm sm:text-base font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
              >
                Enviar e-mail para revela.fun@gmail.com
              </button>
            </Link>
          </div>

          <div className="text-center text-xs sm:text-sm opacity-70 space-y-2">
            <p>
              Se preferir, você também pode entrar em contato diretamente por e-mail:{' '}
              <Link
                href="mailto:revela.fun@gmail.com"
                className="underline hover:opacity-80"
                style={{ color: '#00A88F' }}
              >
                revela.fun@gmail.com
              </Link>
              .
            </p>
            <p>
              Acompanhe também novidades e exemplos de uso no Instagram:{' '}
              <Link
                href="https://instagram.com/revela.fun"
                className="underline hover:opacity-80"
                style={{ color: '#00A88F' }}
              >
                @revela.fun
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

