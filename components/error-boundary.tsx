'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    // Log adicional para ajudar no debug
    if (typeof window !== 'undefined') {
      try {
        const errorData = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        };
        console.error('Detalhes do erro:', errorData);
      } catch (logError) {
        console.error('Erro ao logar detalhes:', logError);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4" 
          style={{ backgroundColor: '#1A2B32' }}
        >
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#E8DCC0' }}>
              Ops! Algo deu errado
            </h2>
            <p className="mb-6" style={{ color: '#E8DCC0' }}>
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-6 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
                style={{ 
                  backgroundColor: '#00A88F', 
                  color: '#FFFFFF' 
                }}
              >
                Recarregar Página
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="px-6 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 border-2"
                style={{ 
                  borderColor: '#E8E0D0',
                  color: '#E8E0D0',
                  backgroundColor: 'transparent'
                }}
              >
                Ir para Início
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer mb-2" style={{ color: '#E8DCC0' }}>
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="bg-gray-800 p-4 rounded text-xs overflow-auto" style={{ color: '#E8DCC0' }}>
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

