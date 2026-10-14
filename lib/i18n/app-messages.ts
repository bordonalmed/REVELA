// Textos dos avisos (toasts), confirmações e da Ferramenta de Medição, em PT e EN.

export interface AppMessages {
  viewPlans: string;
  closeNotice: string;
  confirm: string;
  // Projeto
  notesSaved: string;
  notesSaveError: string;
  saveBeforeMeasuring: string;
  measurementsSaveError: string;
  evolutionPremiumOnly: string;
  evolutionUseTimeline: string;
  addImagesError: string;
  editedPhotoSaveError: string;
  exportNeedsBothImages: string;
  exportImageError: string;
  projectUpdated: string;
  saveChangesError: string;
  imageProcessError: string;
  // Lista de projetos / pastas / backup
  confirmDeleteProject: string;
  projectDeleted: string;
  deleteProjectError: string;
  backupExported: (n: number) => string;
  exportBackupError: string;
  confirmImport: (n: number) => string;
  importLabel: string;
  importSummary: (success: number, failed: number, errors: string[]) => string;
  importBackupError: (msg: string) => string;
  autoBackupEnabled: string;
  autoBackupInitialError: string;
  autoBackupDisabled: string;
  folderNameRequired: string;
  folderCreated: string;
  createFolderError: (msg: string) => string;
  folderUpdated: string;
  updateFolderError: (msg: string) => string;
  confirmDeleteFolder: string;
  folderDeleted: string;
  deleteFolderError: (msg: string) => string;
  projectMoved: string;
  moveProjectError: (msg: string) => string;
  // Configurações / backup seguro e nuvem
  enableSecureBackupFirst: string;
  backupPasswordMin: string;
  userNotLoaded: string;
  secureBackupCreated: string;
  secureBackupError: string;
  enterBackupPassword: string;
  confirmRestore: string;
  restoreLabel: string;
  restoreDone: (success: number, failed: number) => string;
  restoreError: string;
  enableCloudFirst: string;
  noLocalProjects: string;
  selectAtLeastOneProject: string;
  confirmDeleteUnencrypted: (n: number) => string;
  unencryptedDeleted: (n: number) => string;
  unencryptedDeleteError: string;
  // Novo projeto
  freeLimitBefore: (n: number) => string;
  freeLimitAfter: (n: number) => string;
  freeLimitProjects: (n: number) => string;
  freeLimitPerProject: (before: number, after: number) => string;
  projectSavedLocal: string;
  saveProjectError: string;
  evolutionPremiumUpgrade: string;
  // Evolução
  onlyImageFiles: string;
  addAtLeastOneMilestone: string;
  photoForEachMilestone: string;
}

export interface MeasureTexts {
  title: string;
  calibrated: (ref: string) => string;
  notCalibrated: string;
  calibrate: string;
  recalibrate: string;
  measure: string;
  measuring: string;
  hintCalibrate: string;
  hintMeasure: string;
  lengthLive: (v: string) => string;
  listTitle: (n: number) => string;
  calibrationItem: (ref: string) => string;
  refLabel: (ref: string) => string;
  legacy: string;
  removeCalibration: string;
  removeMeasurement: string;
  askRealSize: string;
  realSizePlaceholder: string;
  realSizeError: string;
  newMeasurement: string;
  labelPlaceholder: string;
  saveCalibration: string;
  imageAlt: string;
  before: string;
  after: string;
}

export const appMessages: Record<'pt-BR' | 'en-US', AppMessages> = {
  'pt-BR': {
    viewPlans: 'Ver planos',
    closeNotice: 'Fechar aviso',
    confirm: 'Confirmar',
    notesSaved: 'Notas salvas com sucesso!',
    notesSaveError: 'Erro ao salvar notas. Tente novamente.',
    saveBeforeMeasuring: 'Salve ou cancele a edição do projeto antes de medir.',
    measurementsSaveError: 'Erro ao salvar medidas. Tente novamente.',
    evolutionPremiumOnly: 'O modo Revela Evolução é exclusivo do plano Premium.',
    evolutionUseTimeline: 'No modo Revela Evolução, use a timeline para selecionar Revela A/B.',
    addImagesError: 'Não foi possível adicionar algumas imagens. Tente novamente.',
    editedPhotoSaveError: 'Erro ao salvar foto editada. Tente novamente.',
    exportNeedsBothImages: 'É necessário ter pelo menos uma imagem antes e uma depois para exportar.',
    exportImageError: 'Erro ao exportar imagem. Tente novamente.',
    projectUpdated: 'Projeto atualizado com sucesso!',
    saveChangesError: 'Erro ao salvar alterações. Tente novamente.',
    imageProcessError: 'Erro ao processar imagem. Tente novamente.',
    confirmDeleteProject: 'Tem certeza que deseja excluir este projeto? Essa ação não pode ser desfeita.',
    projectDeleted: 'Projeto excluído com sucesso!',
    deleteProjectError: 'Erro ao excluir projeto. Tente novamente.',
    backupExported: (n) => `Backup exportado com sucesso! ${n} projeto(s) exportado(s).`,
    exportBackupError: 'Erro ao exportar backup. Tente novamente.',
    confirmImport: (n) =>
      `Deseja importar ${n} projeto(s) do backup?\n\nAtenção: projetos com o mesmo ID serão substituídos.`,
    importLabel: 'Importar',
    importSummary: (success, failed, errors) => {
      let m = `Importação concluída!\n\n✓ ${success} projeto(s) importado(s) com sucesso`;
      if (failed > 0) {
        m += `\n✗ ${failed} projeto(s) falharam`;
        if (errors.length > 0) {
          m += `\n\nErros:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) m += `\n... e mais ${errors.length - 5} erro(s)`;
        }
      }
      return m;
    },
    importBackupError: (msg) => `Erro ao importar backup: ${msg}`,
    autoBackupEnabled: 'Backup automático ativado! Um backup foi criado automaticamente.',
    autoBackupInitialError: 'Erro ao criar backup automático inicial.',
    autoBackupDisabled: 'Backup automático desativado.',
    folderNameRequired: 'Digite um nome para a pasta',
    folderCreated: 'Pasta criada com sucesso!',
    createFolderError: (msg) => `Erro ao criar pasta: ${msg}`,
    folderUpdated: 'Pasta atualizada com sucesso!',
    updateFolderError: (msg) => `Erro ao atualizar pasta: ${msg}`,
    confirmDeleteFolder: 'Tem certeza que deseja excluir esta pasta? Os projetos serão movidos para "Sem Pasta".',
    folderDeleted: 'Pasta excluída com sucesso!',
    deleteFolderError: (msg) => `Erro ao excluir pasta: ${msg}`,
    projectMoved: 'Projeto movido com sucesso!',
    moveProjectError: (msg) => `Erro ao mover projeto: ${msg}`,
    enableSecureBackupFirst: 'Ative o backup seguro antes de criar um backup.',
    backupPasswordMin: 'Defina uma senha de backup com pelo menos 8 caracteres.',
    userNotLoaded: 'Usuário não carregado. Tente novamente.',
    secureBackupCreated: 'Backup seguro criado com sucesso. Armazenamento local continua sendo o padrão.',
    secureBackupError: 'Erro ao criar backup seguro. Tente novamente.',
    enterBackupPassword: 'Digite a senha usada para criar o backup seguro.',
    confirmRestore:
      'Isso vai restaurar os projetos do backup seguro no armazenamento local deste dispositivo. Continuar?',
    restoreLabel: 'Restaurar',
    restoreDone: (success, failed) =>
      `Restauração concluída: ${success} projeto(s) restaurado(s)` + (failed > 0 ? `, ${failed} com falha.` : '.'),
    restoreError: 'Erro ao restaurar backup seguro. Verifique a senha e tente novamente.',
    enableCloudFirst: 'Ative o backup em nuvem antes de sincronizar.',
    noLocalProjects: 'Não há projetos locais para sincronizar.',
    selectAtLeastOneProject: 'Selecione ao menos 1 projeto para sincronizar.',
    confirmDeleteUnencrypted: (n) =>
      `Apagar da nuvem ${n} projeto(s) enviados sem criptografia? Os projetos neste aparelho não são afetados.`,
    unencryptedDeleted: (n) => `${n} cópia(s) antigas apagadas da nuvem.`,
    unencryptedDeleteError: 'Erro ao apagar as cópias antigas da nuvem. Tente novamente.',
    freeLimitBefore: (n) =>
      `Limite de ${n} fotos ANTES no plano Free. Para adicionar mais fotos, faça upgrade para o Revela Pro ou Premium.`,
    freeLimitAfter: (n) =>
      `Limite de ${n} fotos DEPOIS no plano Free. Para adicionar mais fotos, faça upgrade para o Revela Pro ou Premium.`,
    freeLimitProjects: (n) =>
      `Limite de ${n} projetos no plano Free. Para criar novos projetos, faça upgrade para o Revela Pro ou Premium.`,
    freeLimitPerProject: (b, a) =>
      `No plano Free cada projeto pode ter no máximo ${b} fotos ANTES e ${a} fotos DEPOIS. Reduza a quantidade de imagens ou faça upgrade para o Revela Pro ou Premium.`,
    projectSavedLocal: 'Projeto salvo com sucesso no seu dispositivo!',
    saveProjectError: 'Erro ao salvar projeto. Tente novamente ou reduza o número de imagens.',
    evolutionPremiumUpgrade:
      'O modo Revela Evolução é exclusivo para usuários do plano Premium. Faça upgrade para ativar este recurso.',
    onlyImageFiles: 'Envie apenas arquivos de imagem.',
    addAtLeastOneMilestone: 'Adicione pelo menos um marco.',
    photoForEachMilestone: 'Envie uma foto para cada marco antes de salvar.',
  },
  'en-US': {
    viewPlans: 'View plans',
    closeNotice: 'Close notice',
    confirm: 'Confirm',
    notesSaved: 'Notes saved!',
    notesSaveError: 'Could not save notes. Please try again.',
    saveBeforeMeasuring: 'Save or cancel your project edits before measuring.',
    measurementsSaveError: 'Could not save measurements. Please try again.',
    evolutionPremiumOnly: 'Revela Evolution mode is available on the Premium plan only.',
    evolutionUseTimeline: 'In Revela Evolution mode, use the timeline to pick Revela A/B.',
    addImagesError: 'Some images could not be added. Please try again.',
    editedPhotoSaveError: 'Could not save the edited photo. Please try again.',
    exportNeedsBothImages: 'You need at least one before and one after image to export.',
    exportImageError: 'Could not export the image. Please try again.',
    projectUpdated: 'Project updated!',
    saveChangesError: 'Could not save changes. Please try again.',
    imageProcessError: 'Could not process the image. Please try again.',
    confirmDeleteProject: 'Are you sure you want to delete this project? This cannot be undone.',
    projectDeleted: 'Project deleted.',
    deleteProjectError: 'Could not delete the project. Please try again.',
    backupExported: (n) => `Backup exported! ${n} project(s) exported.`,
    exportBackupError: 'Could not export the backup. Please try again.',
    confirmImport: (n) =>
      `Import ${n} project(s) from this backup?\n\nNote: projects with the same ID will be replaced.`,
    importLabel: 'Import',
    importSummary: (success, failed, errors) => {
      let m = `Import complete!\n\n✓ ${success} project(s) imported`;
      if (failed > 0) {
        m += `\n✗ ${failed} project(s) failed`;
        if (errors.length > 0) {
          m += `\n\nErrors:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) m += `\n... and ${errors.length - 5} more error(s)`;
        }
      }
      return m;
    },
    importBackupError: (msg) => `Could not import backup: ${msg}`,
    autoBackupEnabled: 'Automatic backup enabled! A first backup was created.',
    autoBackupInitialError: 'Could not create the first automatic backup.',
    autoBackupDisabled: 'Automatic backup disabled.',
    folderNameRequired: 'Enter a folder name',
    folderCreated: 'Folder created!',
    createFolderError: (msg) => `Could not create folder: ${msg}`,
    folderUpdated: 'Folder updated!',
    updateFolderError: (msg) => `Could not update folder: ${msg}`,
    confirmDeleteFolder: 'Are you sure you want to delete this folder? Its projects will be moved to "No Folder".',
    folderDeleted: 'Folder deleted.',
    deleteFolderError: (msg) => `Could not delete folder: ${msg}`,
    projectMoved: 'Project moved!',
    moveProjectError: (msg) => `Could not move project: ${msg}`,
    enableSecureBackupFirst: 'Enable secure backup before creating a backup.',
    backupPasswordMin: 'Set a backup password with at least 8 characters.',
    userNotLoaded: 'User not loaded. Please try again.',
    secureBackupCreated: 'Secure backup created. Local storage remains the default.',
    secureBackupError: 'Could not create the secure backup. Please try again.',
    enterBackupPassword: 'Enter the password used to create the secure backup.',
    confirmRestore: 'This will restore the projects from your secure backup into this device’s local storage. Continue?',
    restoreLabel: 'Restore',
    restoreDone: (success, failed) =>
      `Restore complete: ${success} project(s) restored` + (failed > 0 ? `, ${failed} failed.` : '.'),
    restoreError: 'Could not restore the secure backup. Check the password and try again.',
    enableCloudFirst: 'Enable cloud backup before syncing.',
    noLocalProjects: 'There are no local projects to sync.',
    selectAtLeastOneProject: 'Select at least 1 project to sync.',
    confirmDeleteUnencrypted: (n) =>
      `Delete ${n} project(s) sent to the cloud without encryption? Projects on this device are not affected.`,
    unencryptedDeleted: (n) => `${n} old copy(ies) deleted from the cloud.`,
    unencryptedDeleteError: 'Could not delete the old cloud copies. Please try again.',
    freeLimitBefore: (n) =>
      `The Free plan allows up to ${n} BEFORE photos. Upgrade to Revela Pro or Premium to add more.`,
    freeLimitAfter: (n) =>
      `The Free plan allows up to ${n} AFTER photos. Upgrade to Revela Pro or Premium to add more.`,
    freeLimitProjects: (n) =>
      `The Free plan allows up to ${n} projects. Upgrade to Revela Pro or Premium to create more.`,
    freeLimitPerProject: (b, a) =>
      `On the Free plan each project can have at most ${b} BEFORE and ${a} AFTER photos. Remove some images or upgrade to Revela Pro or Premium.`,
    projectSavedLocal: 'Project saved on your device!',
    saveProjectError: 'Could not save the project. Try again or use fewer images.',
    evolutionPremiumUpgrade: 'Revela Evolution mode is available on the Premium plan only. Upgrade to unlock it.',
    onlyImageFiles: 'Please upload image files only.',
    addAtLeastOneMilestone: 'Add at least one milestone.',
    photoForEachMilestone: 'Upload a photo for each milestone before saving.',
  },
};

export const measureTexts: Record<'pt-BR' | 'en-US', MeasureTexts> = {
  'pt-BR': {
    title: 'Ferramenta de Medição',
    calibrated: (ref) => `Calibrada: a linha amarela vale ${ref}. Medidas em cm reais.`,
    notCalibrated:
      'Sem calibração: as medidas saem em pixels. Para medir em cm, fotografe com uma régua ou objeto de tamanho conhecido ao lado e toque em "Calibrar".',
    calibrate: 'Calibrar',
    recalibrate: 'Recalibrar',
    measure: 'Medir',
    measuring: 'Medindo…',
    hintCalibrate: 'Arraste sobre um objeto de tamanho conhecido na foto (ex.: 1 cm de uma régua).',
    hintMeasure: 'Arraste sobre a foto para medir.',
    lengthLive: (v) => `Comprimento: ${v}`,
    listTitle: (n) => `Medidas desta foto (${n})`,
    calibrationItem: (ref) => `Calibração: ${ref}`,
    refLabel: (ref) => `ref. ${ref}`,
    legacy: 'antiga',
    removeCalibration: 'Remover calibração',
    removeMeasurement: 'Remover medida',
    askRealSize: 'Qual o tamanho real dessa linha, em centímetros?',
    realSizePlaceholder: 'Ex.: 1 ou 2,5',
    realSizeError: 'Digite um tamanho maior que zero (ex.: 1 ou 2,5).',
    newMeasurement: 'Nova medida:',
    labelPlaceholder: 'Rótulo (opcional, ex.: Lesão A)',
    saveCalibration: 'Salvar calibração',
    imageAlt: 'Imagem para medição',
    before: 'Antes',
    after: 'Depois',
  },
  'en-US': {
    title: 'Measurement Tool',
    calibrated: (ref) => `Calibrated: the yellow line equals ${ref}. Measurements in real cm.`,
    notCalibrated:
      'Not calibrated: measurements are shown in pixels. To measure in cm, take the photo with a ruler or an object of known size next to it and tap "Calibrate".',
    calibrate: 'Calibrate',
    recalibrate: 'Recalibrate',
    measure: 'Measure',
    measuring: 'Measuring…',
    hintCalibrate: 'Drag over an object of known size in the photo (e.g. 1 cm on a ruler).',
    hintMeasure: 'Drag over the photo to measure.',
    lengthLive: (v) => `Length: ${v}`,
    listTitle: (n) => `Measurements on this photo (${n})`,
    calibrationItem: (ref) => `Calibration: ${ref}`,
    refLabel: (ref) => `ref. ${ref}`,
    legacy: 'old',
    removeCalibration: 'Remove calibration',
    removeMeasurement: 'Remove measurement',
    askRealSize: 'What is the real length of this line, in centimeters?',
    realSizePlaceholder: 'e.g. 1 or 2.5',
    realSizeError: 'Enter a size greater than zero (e.g. 1 or 2.5).',
    newMeasurement: 'New measurement:',
    labelPlaceholder: 'Label (optional, e.g. Lesion A)',
    saveCalibration: 'Save calibration',
    imageAlt: 'Image to measure',
    before: 'Before',
    after: 'After',
  },
};
