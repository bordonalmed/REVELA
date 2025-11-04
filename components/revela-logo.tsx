export function RevelaLogoSVG() {
  return (
    <svg width="140" height="80" viewBox="0 0 140 80" className="mb-6">
      <defs>
        {/* Gradiente do círculo: teal claro/mint para bege/creme */}
        <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" style={{ stopColor: '#7FD3C1' }} />
          <stop offset="100%" style={{ stopColor: '#E8DCC0' }} />
        </linearGradient>
        {/* Gradiente do triângulo: marrom/cobre para bege/creme */}
        <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" style={{ stopColor: '#C9A57F' }} />
          <stop offset="100%" style={{ stopColor: '#E8DCC0' }} />
        </linearGradient>
      </defs>
      
      {/* Círculo à esquerda - gradiente diagonal */}
      <circle cx="35" cy="40" r="28" fill="url(#circleGradient)" />
      
      {/* Triângulo à direita - apontando para direita */}
      <path d="M 80 18 L 80 62 L 115 40 Z" fill="url(#triangleGradient)" />
    </svg>
  );
}

