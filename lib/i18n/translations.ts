export type Language = 'pt-BR' | 'en-US';

export interface Translations {
  // Homepage
  home: {
    heroTitle: string;
    heroSubtitle: string;
    slogan: string;
    heroSloganShort?: string;
    createAccount: string;
    login: string;
    usedByTitle?: string;
    usedBySubtitle?: string;
    whatIsCard1Title?: string;
    whatIsCard2Title?: string;
    whatIsCard3Title?: string;
    whatIsRevela: string;
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
    howItWorksSupport: string;
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
    trustLine: string;
    faqTitle: string;
    faq1Question: string;
    faq1Answer: string;
    faq2Question: string;
    faq2Answer: string;
    faq3Question: string;
    faq3Answer: string;
    faq4Question: string;
    faq4Answer: string;
    faq5Question: string;
    faq5Answer: string;
    plansTitle?: string;
    plansSubtitle?: string;
    planFreeName?: string;
    planProName?: string;
    planPremiumName?: string;
    planFreeDescription?: string;
    planProDescription?: string;
    planPremiumDescription?: string;
    planFreeBullets?: string[];
    planProBullets?: string[];
    planPremiumBullets?: string[];
    viewPlans?: string;
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
    clinicLogoTitle?: string;
    clinicLogoDescription?: string;
    clinicLogoSaved?: string;
    clinicLogoRemove?: string;
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
    /** Rótulo curto do plano no header (mobile) */
    navPlanShortFree: string;
    navPlanShortPro: string;
    navPlanShortPremium: string;
    /** Acessibilidade: link do badge → página de planos */
    navPlanBadgeAria: string;
  };
  // Footer
  footer: {
    copyright: string;
    faq: string;
    about: string;
    contact: string;
  };
}

export const translations: Record<Language, Translations> = {
  'pt-BR': {
    home: {
      heroTitle: 'Compare fotos antes e depois com privacidade total',
      heroSubtitle: 'Desenvolvido por médicos para médicos e outros profissionais da saúde que trabalham com antes e depois',
      slogan: 'Cada imagem Revela uma Evolução',
      heroSloganShort: 'Mostre resultados. Revele evolução.',
      createAccount: 'Criar conta',
      login: 'Entrar',
      usedByTitle: 'Usado por profissionais da saúde',
      usedBySubtitle: 'Perfeito para quem precisa documentar e apresentar resultados com fotos de antes e depois.',
      whatIsCard1Title: 'Feito para profissionais da saúde',
      whatIsCard2Title: 'Compare resultados em segundos',
      whatIsCard3Title: 'Privacidade total',
      whatIsRevela: 'O que é o Revela?',
      description1: 'O Revela é uma ferramenta profissional desenvolvida por médicos para documentar e apresentar resultados com fotos de antes e depois — pensada para a rotina de consultórios, clínicas e outros profissionais da saúde.',
      description2: 'Compare imagens lado a lado ou arraste o slider para ver a evolução em segundos. Tudo na mesma tela, com leveza e precisão.',
      description3: 'Compatível com smartphones, tablets e notebooks, o Revela funciona sem depender da nuvem: suas fotos ficam armazenadas com segurança no seu dispositivo, garantindo privacidade total.',
      whyRevela: 'Por que Revela?',
      whyRevelaSubtitle: 'Tudo que você precisa para comparar e mostrar transformações',
      comparison: 'Comparação Simultânea',
      comparisonDesc: 'Veja antes e depois na mesma tela, lado a lado ou em carrossel interativo. Sem abas, sem complicação.',
      privacy: 'Privacidade Total',
      privacyDesc: 'Suas fotos ficam salvas apenas no dispositivo. Sem nuvem, sem compartilhamento. Acesso exclusivo para você.',
      fast: 'Rápido e Intuitivo',
      fastDesc: 'Interface fluida e responsiva, feita para o seu ritmo. Comparações instantâneas, resultados claros.',
      professionals: 'Para Profissionais da Saúde',
      professionalsDesc: 'Desenvolvido por médicos para médicos, dentistas, fisioterapeutas e outros profissionais da saúde que documentam resultados com fotos de antes e depois.',
      devices: 'Funciona em Qualquer Dispositivo',
      devicesDesc: 'Mobile, tablet ou notebook. Armazenamento local seguro, sem nuvem. Cada dispositivo mantém seus próprios dados.',
      howItWorks: 'Como Funciona?',
      howItWorksSupport: 'Em três passos você organiza e apresenta seus resultados.',
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
      trustLine: 'Dados no seu dispositivo. Sem nuvem obrigatória.',
      faqTitle: 'Perguntas frequentes',
      faq1Question: 'O que é o Revela?',
      faq1Answer: 'O Revela é uma plataforma profissional desenvolvida por médicos para comparar fotos antes e depois. Ideal para médicos, dentistas, esteticistas e outros profissionais da saúde que precisam documentar e apresentar resultados de transformações.',
      faq2Question: 'Como funciona a privacidade no Revela?',
      faq2Answer: 'Todas as fotos são armazenadas apenas no seu dispositivo, sem uso de nuvem. Isso garante privacidade total e acesso exclusivo para você.',
      faq3Question: 'Quanto custa usar o Revela?',
      faq3Answer: 'O Revela tem um plano Free para começar sem custos e planos pagos para quem quer recursos avançados como marca d’água personalizada e exportação otimizada para redes sociais.',
      faq4Question: 'O Revela funciona em quais dispositivos?',
      faq4Answer: 'O Revela funciona em smartphones, tablets e notebooks. É uma aplicação web responsiva que se adapta a qualquer tamanho de tela.',
      faq5Question: 'Para quais profissionais o Revela é indicado?',
      faq5Answer: 'O Revela é ideal para médicos, dentistas, esteticistas, fisioterapeutas, designers, maquiadores, restauradores e qualquer profissional que precise comparar transformações visuais.',
      plansTitle: 'Planos pensados para a rotina da clínica',
      plansSubtitle:
        'Free no aparelho · Pro: ilimitado, sua marca e export para redes · Premium: tudo do Pro + evolução, PDF, marcações e backup opcional na nuvem.',
      planFreeName: 'Plano Free',
      planProName: 'Revela Pro',
      planPremiumName: 'Revela Premium',
      planFreeDescription:
        'Até 3 projetos, slider, dados locais, export com marca Revela; sem export para redes.',
      planProDescription:
        'Projetos ilimitados, export completo + redes, logo e marca d’água da clínica.',
      planPremiumDescription:
        'Tudo do Pro + evolução, PDF, marcações, modo apresentação e backup na nuvem opcional.',
      planFreeBullets: [
        'Até 3 projetos.',
        'Comparativo antes/depois com slider.',
        'Dados só no aparelho.',
        'Exporta imagem com marca d’água Revela.',
        'Sem exportação para redes (no Pro).',
      ],
      planProBullets: [
        'Projetos ilimitados.',
        'Exportações completas do app, inclusive para redes.',
        'Logo e marca d’água da clínica (ou sem marca Revela).',
      ],
      planPremiumBullets: [
        'Tudo do Revela Pro.',
        'Timeline de evolução do tratamento.',
        'Relatório visual em PDF.',
        'Marcações clínicas no editor.',
        'Modo apresentação ao paciente.',
        'Backup opcional na nuvem.',
      ],
      viewPlans: 'Ver detalhes dos planos',
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
      clinicLogoTitle: 'Logo da clínica (Revela Pro)',
      clinicLogoDescription: 'Envie o logo da sua clínica ou consultório para usar nas apresentações e comparações. A imagem fica salva apenas neste dispositivo.',
      clinicLogoSaved: 'Logo atualizado com sucesso neste dispositivo.',
      clinicLogoRemove: 'Remover logo',
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
      navPlanShortFree: 'Grátis',
      navPlanShortPro: 'Pro',
      navPlanShortPremium: 'Premium',
      navPlanBadgeAria: 'Ver planos e opções de assinatura',
    },
    footer: {
      copyright: '© 2025 Revela - Powered by Equipe Revela',
      faq: 'FAQ',
      about: 'Sobre',
      contact: 'Contato',
    },
  },
  'en-US': {
    home: {
      heroTitle: 'Compare before and after photos with total privacy',
      heroSubtitle: 'Developed by doctors for doctors and other health professionals who work with before and after photos',
      slogan: 'Each Image Reveals an Evolution',
      heroSloganShort: 'Show results. Reveal progress.',
      createAccount: 'Create Account',
      login: 'Login',
      usedByTitle: 'Used by health professionals',
      usedBySubtitle: 'Perfect for anyone who needs to document and present results with before-and-after photos.',
      whatIsCard1Title: 'Built for health professionals',
      whatIsCard2Title: 'Compare results in seconds',
      whatIsCard3Title: 'Total privacy',
      whatIsRevela: 'What is Revela?',
      description1: 'Revela is a professional tool developed by doctors to document and present results with before and after photos — designed for the daily routine of clinics, offices, and other health professionals.',
      description2: 'Compare images side by side or drag the slider to see progress in seconds. Everything on the same screen, with precision and ease.',
      description3: 'Compatible with smartphones, tablets, and notebooks, Revela works without relying on the cloud: your photos stay securely stored on your device, ensuring total privacy.',
      whyRevela: 'Why Revela?',
      whyRevelaSubtitle: 'Everything you need to compare and showcase transformations',
      comparison: 'Simultaneous Comparison',
      comparisonDesc: 'See before and after on the same screen, side by side or in an interactive carousel. No tabs, no complications.',
      privacy: 'Total Privacy',
      privacyDesc: 'Your photos are saved only on the device. No cloud, no sharing. Exclusive access for you.',
      fast: 'Fast and Intuitive',
      fastDesc: 'Fluid and responsive interface, made for your pace. Instant comparisons, clear results.',
      professionals: 'For Health Professionals',
      professionalsDesc: 'Developed by doctors for doctors, dentists, physiotherapists, and other health professionals who document results with before and after photos.',
      devices: 'Works on Any Device',
      devicesDesc: 'Mobile, tablet, or notebook. Secure local storage, no cloud. Each device maintains its own data.',
      howItWorks: 'How It Works?',
      howItWorksSupport: 'In three steps you organize and present your results.',
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
      trustLine: 'Data on your device. No cloud required.',
      faqTitle: 'Frequently asked questions',
      faq1Question: 'What is Revela?',
      faq1Answer: 'Revela is a professional platform developed by doctors to compare before and after photos. Ideal for doctors, dentists, estheticians, and other health professionals who need to document and present transformation results.',
      faq2Question: 'How does privacy work in Revela?',
      faq2Answer: 'All photos are stored only on your device, with no cloud use. This ensures total privacy and exclusive access for you.',
      faq3Question: 'How much does Revela cost?',
      faq3Answer: 'Revela offers a Free plan to start at no cost and paid plans for advanced features such as custom watermark and social-media-optimized exports.',
      faq4Question: 'What devices does Revela work on?',
      faq4Answer: 'Revela works on smartphones, tablets, and notebooks. It is a responsive web application that adapts to any screen size.',
      faq5Question: 'Which professionals is Revela for?',
      faq5Answer: 'Revela is ideal for doctors, dentists, estheticians, physiotherapists, designers, makeup artists, restorers, and any professional who needs to compare visual transformations.',
      plansTitle: 'Plans designed for your daily routine',
      plansSubtitle:
        'Free on your device · Pro: unlimited, your brand and social exports · Premium: everything in Pro plus timeline, PDF, clinical markings and optional cloud backup.',
      planFreeName: 'Free plan',
      planProName: 'Revela Pro',
      planPremiumName: 'Revela Premium',
      planFreeDescription:
        'Up to 3 projects, slider, local data, export with Revela watermark; no social export pack.',
      planProDescription: 'Unlimited projects, full exports including social, your logo and watermark.',
      planPremiumDescription:
        'Everything in Pro plus timeline, PDF, clinical markings, presentation mode and optional cloud backup.',
      planFreeBullets: [
        'Up to 3 projects.',
        'Before/after slider.',
        'Data stays on device.',
        'Export image with Revela watermark.',
        'No social export pack (Pro).',
      ],
      planProBullets: [
        'Unlimited projects.',
        'Full app exports, including social formats.',
        'Clinic logo and watermark (or no Revela mark).',
      ],
      planPremiumBullets: [
        'Everything in Revela Pro.',
        'Treatment evolution timeline.',
        'Visual PDF report.',
        'Clinical markings in the editor.',
        'Patient presentation mode.',
        'Optional cloud backup.',
      ],
      viewPlans: 'See plan details',
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
      clinicLogoTitle: 'Clinic logo (Revela Pro)',
      clinicLogoDescription: 'Upload your clinic or office logo to use in presentations and comparisons. The image is stored only on this device.',
      clinicLogoSaved: 'Logo updated successfully on this device.',
      clinicLogoRemove: 'Remove logo',
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
      navPlanShortFree: 'Free',
      navPlanShortPro: 'Pro',
      navPlanShortPremium: 'Premium',
      navPlanBadgeAria: 'View plans and subscription options',
    },
    footer: {
      copyright: '© 2025 Revela - Powered by Revela Team',
      faq: 'FAQ',
      about: 'About',
      contact: 'Contact',
    },
  },
};

export const defaultLanguage: Language = 'pt-BR';

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations[defaultLanguage];
}

