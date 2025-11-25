'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { errorLogger } from '@/lib/error-logger';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  onError?: () => void;
  fallbackSrc?: string;
}

/**
 * Componente de imagem seguro com tratamento de erro
 * Previne quebra da aplicação quando uma imagem não carrega
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  unoptimized = false,
  sizes,
  style,
  onError,
  fallbackSrc,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const handleError = useCallback(() => {
    errorLogger.warn(`Erro ao carregar imagem`, { src, retryCount, alt });
    
    if (retryCount < maxRetries && !hasError) {
      // Tentar novamente após um pequeno delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setHasError(false);
      }, 500);
      return;
    }

    setHasError(true);
    errorLogger.error(`Falha ao carregar imagem após ${maxRetries} tentativas`, { src, alt });
    if (onError) {
      onError();
    }
  }, [src, retryCount, hasError, onError, alt]);

  // Se houver erro e tiver fallback, usar fallback
  if (hasError && fallbackSrc) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        unoptimized={unoptimized}
        sizes={sizes}
        style={style}
        onError={() => {
          // Se o fallback também falhar, mostrar placeholder
          console.error('Fallback também falhou:', fallbackSrc);
        }}
      />
    );
  }

  // Se houver erro sem fallback, mostrar placeholder
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          minHeight: height ? `${height}px` : '100px',
          ...style,
        }}
      >
        <span className="text-xs text-gray-500 dark:text-gray-400" style={{ color: '#E8DCC0', opacity: 0.5 }}>
          {alt}
        </span>
      </div>
    );
  }

  // Tentar carregar a imagem normalmente
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized={unoptimized}
      sizes={sizes}
      style={style}
      onError={handleError}
      onLoad={() => {
        // Resetar contador de retry em caso de sucesso
        if (retryCount > 0) {
          setRetryCount(0);
        }
      }}
    />
  );
}

/**
 * Componente de imagem segura para imagens base64 (usado nos projetos)
 */
interface SafeBase64ImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}

export function SafeBase64Image({
  src,
  alt,
  className = '',
  style,
  onError,
}: SafeBase64ImageProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 1;

  const handleError = useCallback(() => {
    errorLogger.warn(`Erro ao carregar imagem base64`, { alt, retryCount });
    
    if (retryCount < maxRetries && !hasError) {
      // Tentar novamente após um pequeno delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setHasError(false);
      }, 300);
      return;
    }

    setHasError(true);
    errorLogger.error(`Falha ao carregar imagem base64 após ${maxRetries} tentativas`, { alt });
    if (onError) {
      onError();
    }
  }, [alt, retryCount, hasError, onError]);

  // Validar se src é uma string base64 válida
  const isValidBase64 = src && typeof src === 'string' && (
    src.startsWith('data:image/') || 
    src.startsWith('/') ||
    src.startsWith('http://') ||
    src.startsWith('https://')
  );

  if (!isValidBase64 && !hasError) {
    errorLogger.warn('Imagem com formato inválido', { alt, srcLength: src?.length });
    setHasError(true);
  }

  // Se houver erro, mostrar placeholder
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
        style={{
          minHeight: '100px',
          backgroundColor: 'rgba(232, 220, 192, 0.1)',
          ...style,
        }}
      >
        <span 
          className="text-xs text-center px-2" 
          style={{ color: '#E8DCC0', opacity: 0.5 }}
        >
          Imagem não disponível
        </span>
      </div>
    );
  }

  // Tentar carregar a imagem
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      onLoad={() => {
        // Resetar contador de retry em caso de sucesso
        if (retryCount > 0) {
          setRetryCount(0);
        }
      }}
      loading="lazy"
    />
  );
}

