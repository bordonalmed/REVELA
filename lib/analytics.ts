// Sistema de Tracking do Google Analytics
// Configuração e funções para rastreamento de eventos

import { 
  trackConversionSync, 
  mapRevelaEventToConversion,
  type ConversionEvent,
  type ConversionData 
} from './conversion-tracking';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// ID de medição do Google Analytics (deve ser configurado via variável de ambiente)
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Verificar se o Google Analytics está disponível
export const isGAEnabled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_MEASUREMENT_ID !== '';
};

// Inicializar Google Analytics
export const initGA = (): void => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    console.warn('Google Analytics não configurado. Defina NEXT_PUBLIC_GA_MEASUREMENT_ID');
    return;
  }

  // Carregar script do Google Analytics
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Inicializar dataLayer e gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args: any[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
};

// Trackear visualização de página
export const trackPageView = (path: string, title?: string): void => {
  if (!isGAEnabled()) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title || document.title,
  });
};

// Trackear evento genérico
export const trackEvent = (
  eventName: string,
  eventParams?: {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
  }
): void => {
  if (!isGAEnabled()) return;

  window.gtag('event', eventName, {
    ...eventParams,
  });
};

// Eventos específicos do Revela

// Autenticação
export const trackLogin = (method: string = 'email'): void => {
  trackEvent('login', {
    event_category: 'Authentication',
    event_label: method,
    method: method,
  });
  
  // Trackear conversão
  const { event, data } = mapRevelaEventToConversion('login', { content_name: 'Login' });
  trackConversionSync(event, data);
};

export const trackLogout = (): void => {
  trackEvent('logout', {
    event_category: 'Authentication',
  });
};

export const trackSignup = (method: string = 'email'): void => {
  trackEvent('sign_up', {
    event_category: 'Authentication',
    event_label: method,
    method: method,
  });
  
  // Trackear conversão
  const { event, data } = mapRevelaEventToConversion('signup', { content_name: 'Signup' });
  trackConversionSync(event, data);
};

// Projetos
export const trackCreateProject = (projectName: string, beforeCount: number, afterCount: number): void => {
  trackEvent('create_project', {
    event_category: 'Projects',
    event_label: projectName,
    project_name: projectName,
    before_images_count: beforeCount,
    after_images_count: afterCount,
    total_images: beforeCount + afterCount,
  });
  
  // Trackear conversão
  const { event, data } = mapRevelaEventToConversion('create_project', {
    content_name: projectName,
    value: 1,
    currency: 'BRL',
  });
  trackConversionSync(event, data);
};

export const trackViewProject = (projectId: string, projectName: string): void => {
  trackEvent('view_project', {
    event_category: 'Projects',
    event_label: projectName,
    project_id: projectId,
    project_name: projectName,
  });
};

export const trackUpdateProject = (projectId: string, projectName: string, changes: {
  beforeImagesCount?: number;
  afterImagesCount?: number;
  notesUpdated?: boolean;
}): void => {
  trackEvent('update_project', {
    event_category: 'Projects',
    event_label: projectName,
    project_id: projectId,
    project_name: projectName,
    ...changes,
  });
};

export const trackDeleteProject = (projectId: string, projectName: string): void => {
  trackEvent('delete_project', {
    event_category: 'Projects',
    event_label: projectName,
    project_id: projectId,
    project_name: projectName,
  });
};

// Edição de Imagens
export const trackEditImage = (
  projectId: string,
  projectName: string,
  imageType: 'before' | 'after',
  imageIndex: number,
  editType: 'crop' | 'rotate' | 'zoom' | 'all'
): void => {
  trackEvent('edit_image', {
    event_category: 'Image Editing',
    event_label: `${projectName} - ${imageType} #${imageIndex + 1}`,
    project_id: projectId,
    project_name: projectName,
    image_type: imageType,
    image_index: imageIndex,
    edit_type: editType,
  });
};

// Exportação
export const trackExportImage = (
  projectId: string,
  projectName: string,
  format: string,
  layout: string
): void => {
  trackEvent('export_image', {
    event_category: 'Export',
    event_label: projectName,
    project_id: projectId,
    project_name: projectName,
    export_format: format,
    export_layout: layout,
  });
  
  // Trackear conversão
  const { event, data } = mapRevelaEventToConversion('export_image', {
    content_name: projectName,
    content_ids: [projectId],
    value: 1,
    currency: 'BRL',
  });
  trackConversionSync(event, data);
};

export const trackExportProject = (projectId: string, projectName: string): void => {
  trackEvent('export_project', {
    event_category: 'Export',
    event_label: projectName,
    project_id: projectId,
    project_name: projectName,
  });
};

export const trackImportBackup = (projectsCount: number): void => {
  trackEvent('import_backup', {
    event_category: 'Backup',
    projects_count: projectsCount,
  });
};

export const trackExportBackup = (projectsCount: number): void => {
  trackEvent('export_backup', {
    event_category: 'Backup',
    projects_count: projectsCount,
  });
};

// Modos de Visualização
export const trackEnterPresentationMode = (projectId: string, projectName: string): void => {
  trackEvent('enter_presentation_mode', {
    event_category: 'View Modes',
    event_label: projectName,
    project_id: projectId,
    project_name: projectName,
  });
};

export const trackEnterSliderMode = (projectId: string, projectName: string): void => {
  trackEvent('enter_slider_mode', {
    event_category: 'View Modes',
    event_label: projectName,
    project_id: projectId,
    project_name: projectName,
  });
};

// Notas
export const trackSaveNotes = (projectId: string, projectName: string, notesLength: number): void => {
  trackEvent('save_notes', {
    event_category: 'Projects',
    event_label: projectName,
    project_id: projectId,
    project_name: projectName,
    notes_length: notesLength,
  });
};

// Pastas
export const trackCreateFolder = (folderName: string): void => {
  trackEvent('create_folder', {
    event_category: 'Folders',
    event_label: folderName,
    folder_name: folderName,
  });
};

export const trackUpdateFolder = (folderId: string, folderName: string): void => {
  trackEvent('update_folder', {
    event_category: 'Folders',
    event_label: folderName,
    folder_id: folderId,
    folder_name: folderName,
  });
};

export const trackDeleteFolder = (folderId: string, folderName: string): void => {
  trackEvent('delete_folder', {
    event_category: 'Folders',
    event_label: folderName,
    folder_id: folderId,
    folder_name: folderName,
  });
};

// Configurações
export const trackChangePassword = (): void => {
  trackEvent('change_password', {
    event_category: 'Settings',
  });
};

export const trackUpdateSettings = (settings: Record<string, any>): void => {
  trackEvent('update_settings', {
    event_category: 'Settings',
    ...settings,
  });
};

// Navegação
export const trackNavigation = (from: string, to: string): void => {
  trackEvent('navigation', {
    event_category: 'Navigation',
    from_page: from,
    to_page: to,
  });
};

// Erros
export const trackError = (errorType: string, errorMessage: string, location?: string): void => {
  trackEvent('exception', {
    event_category: 'Errors',
    event_label: errorType,
    error_type: errorType,
    error_message: errorMessage,
    error_location: location || window.location.pathname,
    fatal: false,
  });
};

// Engajamento
export const trackTimeOnPage = (page: string, timeInSeconds: number): void => {
  trackEvent('time_on_page', {
    event_category: 'Engagement',
    event_label: page,
    page: page,
    time_seconds: timeInSeconds,
  });
};

// Busca e Filtros
export const trackSearch = (query: string, resultsCount: number): void => {
  trackEvent('search', {
    event_category: 'Search',
    search_term: query,
    results_count: resultsCount,
  });
};

export const trackFilter = (filterType: string, filterValue: string): void => {
  trackEvent('filter', {
    event_category: 'Filters',
    filter_type: filterType,
    filter_value: filterValue,
  });
};

// Compartilhamento
export const trackShare = (projectId: string, projectName: string, platform: string): void => {
  trackEvent('share', {
    event_category: 'Social',
    event_label: platform,
    project_id: projectId,
    project_name: projectName,
    share_platform: platform,
  });
  
  // Trackear conversão
  const { event, data } = mapRevelaEventToConversion('share_social', {
    content_name: projectName,
    content_ids: [projectId],
    share_platform: platform,
  });
  trackConversionSync(event, data);
};

// Medições
export const trackMeasurement = (projectId: string, projectName: string, measurementType: string): void => {
  trackEvent('add_measurement', {
    event_category: 'Measurements',
    event_label: measurementType,
    project_id: projectId,
    project_name: projectName,
    measurement_type: measurementType,
  });
};

