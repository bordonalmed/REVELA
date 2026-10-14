// Tradução fora de componentes React (geração de PDF, imagens exportadas etc.).
// Usa o idioma que o LanguageProvider grava em <html lang>.
export function currentLanguage(): 'pt-BR' | 'en-US' {
  if (typeof document !== 'undefined' && document.documentElement.lang === 'en-US') return 'en-US';
  return 'pt-BR';
}

export function trNow(pt: string, en: string): string {
  return currentLanguage() === 'en-US' ? en : pt;
}
