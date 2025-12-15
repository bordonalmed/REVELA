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
  // Login
  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    noAccount: string;
    createAccount: string;
    backToHome: string;
    error: string;
  };
  // Signup
  signup: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    confirmPassword: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    submit: string;
    submitting: string;
    hasAccount: string;
    login: string;
    backToHome: string;
    passwordMismatch: string;
    passwordTooShort: string;
    error: string;
  };
  // Dashboard
  dashboard: {
    welcome: string;
    slogan: string;
    newProject: string;
    storedProjects: string;
    loading: string;
  };
  // Settings
    settings: {
      title: string;
      accountInfo: string;
      changePassword: string;
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
      emailCannotChange: string;
      update: string;
      updating: string;
      success: string;
      passwordMismatch: string;
      passwordTooShort: string;
      error: string;
      loading: string;
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
    email: string;
    password: string;
    name: string;
    date: string;
    notes: string;
    before: string;
    after: string;
    logout: string;
    logoutError: string;
    settings: string;
    dashboard: string;
  };
  // Footer
  footer: {
    copyright: string;
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
    login: {
      title: 'Entrar',
      subtitle: 'Entre com seu email e senha',
      email: 'Email',
      password: 'Senha',
      emailPlaceholder: 'seu@email.com',
      passwordPlaceholder: '••••••••',
      submit: 'Entrar',
      submitting: 'Entrando...',
      noAccount: 'Não tem uma conta?',
      createAccount: 'Criar conta',
      backToHome: '← Voltar para início',
      error: 'Erro ao fazer login',
    },
    signup: {
      title: 'Criar Conta',
      subtitle: 'Crie sua conta profissional',
      email: 'Email',
      password: 'Senha',
      confirmPassword: 'Confirmar Senha',
      emailPlaceholder: 'seu@email.com',
      passwordPlaceholder: '••••••••',
      confirmPasswordPlaceholder: '••••••••',
      submit: 'Criar Conta',
      submitting: 'Criando conta...',
      hasAccount: 'Já tem uma conta?',
      login: 'Entrar',
      backToHome: '← Voltar para início',
      passwordMismatch: 'As senhas não coincidem',
      passwordTooShort: 'A senha deve ter pelo menos 6 caracteres',
      error: 'Erro ao criar conta',
    },
    dashboard: {
      welcome: 'Bem-vindo ao Revela',
      slogan: 'Cada imagem Revela uma Evolução',
      newProject: 'Novo projeto',
      storedProjects: 'Armazenados',
      loading: 'Carregando...',
    },
    settings: {
      title: 'Configurações da Conta',
      accountInfo: 'Informações da Conta',
      changePassword: 'Alterar Senha',
      currentPassword: 'Senha Atual',
      newPassword: 'Nova Senha',
      confirmPassword: 'Confirmar Nova Senha',
      emailCannotChange: 'O email não pode ser alterado',
      update: 'Atualizar Senha',
      updating: 'Atualizando...',
      success: 'Senha atualizada com sucesso!',
      passwordMismatch: 'As senhas não coincidem',
      passwordTooShort: 'A senha deve ter pelo menos 6 caracteres',
      error: 'Erro ao atualizar senha',
      loading: 'Carregando...',
    },
    common: {
      loading: 'Carregando...',
      back: 'Voltar',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar',
      email: 'Email',
      password: 'Senha',
      name: 'Nome',
      date: 'Data',
      notes: 'Anotações',
      before: 'Antes',
      after: 'Depois',
      logout: 'Sair',
      logoutError: 'Erro ao sair. Tente novamente.',
      settings: 'Configurações',
      dashboard: 'Dashboard',
    },
    footer: {
      copyright: '© 2025 Revela - Powered by Equipe Revela',
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
    login: {
      title: 'Login',
      subtitle: 'Enter your email and password',
      email: 'Email',
      password: 'Password',
      emailPlaceholder: 'your@email.com',
      passwordPlaceholder: '••••••••',
      submit: 'Login',
      submitting: 'Logging in...',
      noAccount: "Don't have an account?",
      createAccount: 'Create account',
      backToHome: '← Back to home',
      error: 'Error logging in',
    },
    signup: {
      title: 'Create Account',
      subtitle: 'Create your professional account',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      emailPlaceholder: 'your@email.com',
      passwordPlaceholder: '••••••••',
      confirmPasswordPlaceholder: '••••••••',
      submit: 'Create Account',
      submitting: 'Creating account...',
      hasAccount: 'Already have an account?',
      login: 'Login',
      backToHome: '← Back to home',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      error: 'Error creating account',
    },
    dashboard: {
      welcome: 'Welcome to Revela',
      slogan: 'Each Image Reveals an Evolution',
      newProject: 'New project',
      storedProjects: 'Stored',
      loading: 'Loading...',
    },
    settings: {
      title: 'Account Settings',
      accountInfo: 'Account Information',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      emailCannotChange: 'Email cannot be changed',
      update: 'Update Password',
      updating: 'Updating...',
      success: 'Password updated successfully!',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      error: 'Error updating password',
      loading: 'Loading...',
    },
    common: {
      loading: 'Loading...',
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      date: 'Date',
      notes: 'Notes',
      before: 'Before',
      after: 'After',
      logout: 'Logout',
      logoutError: 'Error logging out. Please try again.',
      settings: 'Settings',
      dashboard: 'Dashboard',
    },
    footer: {
      copyright: '© 2025 Revela - Powered by Revela Team',
    },
  },
};

export const defaultLanguage: Language = 'pt-BR';

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations[defaultLanguage];
}

