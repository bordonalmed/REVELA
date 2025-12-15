export type Language = 'pt-BR' | 'en-US';

export interface Translations {
  // Homepage
  home: {
    slogan: string;
    createAccount: string;
    login: string;
    description1: string;
    description2: string;
    description3: string;
    whyRevela: string;
    whyRevelaSubtitle: string;
    comparison: string;
    comparisonDesc: string;
    privacy: string;
    privacyDesc: string;
    fast: string;
    fastDesc: string;
    professionals: string;
    professionalsDesc: string;
    devices: string;
    devicesDesc: string;
    howItWorks: string;
    step1: string;
    step1Desc: string;
    step2: string;
    step2Desc: string;
    step3: string;
    step3Desc: string;
    ready: string;
    readySubtitle: string;
    createFreeAccount: string;
    alreadyHaveAccount: string;
  };
  // Common
  common: {
    loading: string;
    back: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
  };
}

export const translations: Record<Language, Translations> = {
  'pt-BR': {
    home: {
      slogan: 'Cada imagem Revela uma Evolução',
      createAccount: 'Criar conta',
      login: 'Entrar',
      description1: 'O Revela é um programa de fotos desenvolvido para qualquer profissional que precise visualizar transformações — seja na saúde, estética, design, arquitetura, moda ou arte.',
      description2: 'Compare imagens antes e depois lado a lado, ou deslize entre elas em um carrossel interativo. Tudo na mesma tela, com leveza e precisão.',
      description3: 'Compatível com smartphones, tablets e notebooks, o Revela funciona sem depender da nuvem — suas fotos ficam armazenadas com segurança no seu dispositivo, garantindo privacidade total e acesso exclusivo.',
      whyRevela: 'Por que Revela?',
      whyRevelaSubtitle: 'Tudo que você precisa para comparar e mostrar transformações',
      comparison: 'Comparação Simultânea',
      comparisonDesc: 'Veja antes e depois na mesma tela, lado a lado ou em carrossel interativo. Sem abas, sem complicação.',
      privacy: 'Privacidade Total',
      privacyDesc: 'Suas fotos ficam salvas apenas no dispositivo. Sem nuvem, sem compartilhamento. Acesso exclusivo para você.',
      fast: 'Rápido e Intuitivo',
      fastDesc: 'Interface fluida e responsiva, feita para o seu ritmo. Comparações instantâneas, resultados claros.',
      professionals: 'Para Todos os Profissionais',
      professionalsDesc: 'Ideal para médicos, dentistas, fisioterapeutas, designers, maquiadores, restauradores e muito mais.',
      devices: 'Funciona em Qualquer Dispositivo',
      devicesDesc: 'Mobile, tablet ou notebook. Tudo sincronizado localmente, sempre acessível onde você estiver.',
      howItWorks: 'Como Funciona?',
      step1: 'Tire ou envie suas fotos',
      step1Desc: 'Adicione as imagens diretamente do seu dispositivo',
      step2: 'Compare em carrossel',
      step2Desc: 'Visualize lado a lado ou navegue de forma interativa',
      step3: 'Mostre evolução real',
      step3Desc: 'Apresente resultados de forma clara e profissional',
      ready: 'Pronto para Revelar Resultados?',
      readySubtitle: 'Comece agora - Cada imagem Revela uma Evolução',
      createFreeAccount: 'Criar conta grátis',
      alreadyHaveAccount: 'Já tenho conta',
    },
    common: {
      loading: 'Carregando...',
      back: 'Voltar',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar',
    },
  },
  'en-US': {
    home: {
      slogan: 'Each Image Reveals an Evolution',
      createAccount: 'Create Account',
      login: 'Login',
      description1: 'Revela is a photo application developed for any professional who needs to visualize transformations — whether in health, aesthetics, design, architecture, fashion, or art.',
      description2: 'Compare before and after images side by side, or slide between them in an interactive carousel. Everything on the same screen, with lightness and precision.',
      description3: 'Compatible with smartphones, tablets, and notebooks, Revela works without depending on the cloud — your photos are securely stored on your device, ensuring total privacy and exclusive access.',
      whyRevela: 'Why Revela?',
      whyRevelaSubtitle: 'Everything you need to compare and showcase transformations',
      comparison: 'Simultaneous Comparison',
      comparisonDesc: 'See before and after on the same screen, side by side or in an interactive carousel. No tabs, no complications.',
      privacy: 'Total Privacy',
      privacyDesc: 'Your photos are saved only on the device. No cloud, no sharing. Exclusive access for you.',
      fast: 'Fast and Intuitive',
      fastDesc: 'Fluid and responsive interface, made for your pace. Instant comparisons, clear results.',
      professionals: 'For All Professionals',
      professionalsDesc: 'Ideal for doctors, dentists, physiotherapists, designers, makeup artists, restorers, and much more.',
      devices: 'Works on Any Device',
      devicesDesc: 'Mobile, tablet, or notebook. Everything synced locally, always accessible wherever you are.',
      howItWorks: 'How It Works?',
      step1: 'Take or upload your photos',
      step1Desc: 'Add images directly from your device',
      step2: 'Compare in carousel',
      step2Desc: 'View side by side or navigate interactively',
      step3: 'Show real evolution',
      step3Desc: 'Present results clearly and professionally',
      ready: 'Ready to Reveal Results?',
      readySubtitle: 'Start now - Each Image Reveals an Evolution',
      createFreeAccount: 'Create free account',
      alreadyHaveAccount: 'I already have an account',
    },
    common: {
      loading: 'Loading...',
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
    },
  },
};

export const defaultLanguage: Language = 'pt-BR';

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations[defaultLanguage];
}

