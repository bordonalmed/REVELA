'use client';

import jsPDF from 'jspdf';
import type { Project } from './storage';

/** Opções para geração do relatório PDF */
export interface PdfReportOptions {
  /** Título do relatório */
  reportTitle: string;
  /** Nome do paciente */
  patientName?: string;
  /** Nome do projeto/tratamento (default: project.name) */
  projectName?: string;
  /** Data inicial (default: project.date) */
  dateStart: string;
  /** Data final (default: última evolução ou hoje) */
  dateEnd: string;
  /** Nome da clínica */
  clinicName?: string;
  /** Endereço da clínica */
  clinicAddress?: string;
  /** Telefone da clínica */
  clinicPhone?: string;
  /** Logo da clínica em base64 (data URL) */
  clinicLogoBase64?: string | null;
  /** Incluir comparação antes/depois */
  includeBeforeAfter?: boolean;
  /** Incluir timeline de evolução */
  includeTimeline?: boolean;
  /** Incluir observações */
  includeNotes?: boolean;

  /** Quando true, o PDF usa o modelo “Revela Evolução” (Premium). */
  evolutionMode?: boolean;

  /** Seleção da timeline no modo Revela Evolução. */
  evolutionSelection?: { leftId: string | null; rightId: string | null };

  /** No modo Revela Evolução, controla se desenha comparação A/B abaixo do grid. */
  includeEvolutionABComparison?: boolean;

}

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = A4_WIDTH_PT - MARGIN * 2;
const CONTENT_HEIGHT = A4_HEIGHT_PT - MARGIN * 2;
const LINE_HEIGHT = 14;
const SECTION_GAP = 20;
const LABEL_FONT_SIZE = 10;
const BODY_FONT_SIZE = 11;
const TITLE_FONT_SIZE = 16;
const HEADER_FONT_SIZE = 12;
const REVELA_TEAL_RGB: [number, number, number] = [0, 168, 143];
const HEADER_DARK_RGB: [number, number, number] = [15, 23, 42];
const LIGHT_TEXT_RGB: [number, number, number] = [229, 231, 235];
const CONTRAST_LIGHT_RGB: [number, number, number] = [241, 245, 249];
const CONTRAST_DARK_RGB: [number, number, number] = [15, 23, 42];
type ContrastTone = 'light' | 'dark';

function drawSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...HEADER_DARK_RGB);
  doc.text(title, MARGIN, y);
  const lineY = y + 6;
  doc.setDrawColor(0, 168, 143);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, lineY, A4_WIDTH_PT - MARGIN, lineY);
  doc.setTextColor(0, 0, 0);
  return y + LINE_HEIGHT + 4;
}

function loadImageDimensions(base64: string): Promise<{ w: number; h: number; format: 'JPEG' | 'PNG' }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const format = base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/jpg')
        ? 'JPEG'
        : 'PNG';
      resolve({ w: img.naturalWidth, h: img.naturalHeight, format });
    };
    img.onerror = reject;
    img.src = base64;
  });
}

function getImageDataFormat(base64: string): 'JPEG' | 'PNG' {
  return base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/jpg')
    ? 'JPEG'
    : 'PNG';
}

async function resolveImageSourceForPdf(source: string): Promise<string | null> {
  if (!source) return null;
  if (source.startsWith('data:image/')) return source;
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = source;
  });
}

async function estimateImageLuminance(base64: string): Promise<number | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const sampleW = 24;
        const sampleH = 24;
        const canvas = document.createElement('canvas');
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] / 255;
          if (alpha < 0.08) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          sum += luminance;
          count += 1;
        }
        if (!count) {
          resolve(null);
          return;
        }
        resolve(sum / count);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = base64;
  });
}

function getContrastToneFromLuminance(luminance: number | null): ContrastTone {
  // Luminância alta => logo claro => fundo escuro.
  if (luminance === null) return 'dark';
  return luminance >= 160 ? 'dark' : 'light';
}

function drawLogoContrastBase(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  tone: ContrastTone,
): void {
  const padX = 8;
  const padY = 4;
  const boxX = x - padX;
  const boxY = y - padY;
  const boxW = width + padX * 2;
  const boxH = height + padY * 2;
  const radius = 6;

  if (tone === 'dark') {
    doc.setFillColor(...CONTRAST_DARK_RGB);
    doc.setDrawColor(51, 65, 85);
  } else {
    doc.setFillColor(...CONTRAST_LIGHT_RGB);
    doc.setDrawColor(203, 213, 225);
  }
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, boxY, boxW, boxH, radius, radius, 'FD');
}

/** Redimensiona mantendo proporção para caber em maxW x maxH */
function fitDimensions(
  w: number,
  h: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  const scale = Math.min(maxW / w, maxH / h, 1);
  return { width: w * scale, height: h * scale };
}

/** Formata data ISO para DD/MM/AAAA */
function formatDate(iso: string): string {
  const d = iso.slice(0, 10).split('-');
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : iso;
}

/**
 * Gera o relatório em PDF e retorna o blob para download.
 * Recurso exclusivo Revela Premium.
 */
export async function generateProjectReportPdf(
  project: Project,
  options: PdfReportOptions
): Promise<Blob> {
  const {
    reportTitle,
    patientName,
    projectName,
    dateStart,
    dateEnd,
    clinicName,
    clinicAddress,
    clinicPhone,
    clinicLogoBase64,
    includeBeforeAfter = true,
    includeTimeline = true,
    includeNotes = true,
    evolutionMode = false,
    evolutionSelection,
    includeEvolutionABComparison = true,
  } = options;

  const effectiveLogoBase64 = clinicLogoBase64
    ? await resolveImageSourceForPdf(clinicLogoBase64)
    : null;
  const logoLuminance = effectiveLogoBase64
    ? await estimateImageLuminance(effectiveLogoBase64)
    : null;
  const logoContrastTone = getContrastToneFromLuminance(logoLuminance);

  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  let y = MARGIN;

  // ---- Cabeçalho ----
  doc.setFillColor(...HEADER_DARK_RGB);
  doc.rect(0, 0, A4_WIDTH_PT, 56, 'F');
  // Linha de acento da marca para manter consistência com a identidade visual.
  doc.setFillColor(...REVELA_TEAL_RGB);
  doc.rect(0, 54, A4_WIDTH_PT, 2, 'F');
  doc.setTextColor(...LIGHT_TEXT_RGB);
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.setFont('helvetica', 'normal');

  if (clinicName) {
    doc.text(clinicName, MARGIN, 22);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (clinicAddress) {
    doc.text(clinicAddress, MARGIN, 34);
  }
  if (clinicPhone) {
    doc.text(clinicPhone, MARGIN, 45);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(TITLE_FONT_SIZE);
  const titleW = doc.getTextWidth(reportTitle);
  doc.text(reportTitle, A4_WIDTH_PT / 2 - titleW / 2, 37);

  // Logo da clínica (canto direito do cabeçalho)
  if (effectiveLogoBase64) {
    try {
      const imgFormat = getImageDataFormat(effectiveLogoBase64);
      const headerLogoW = 60;
      const headerLogoH = 34;
      const headerLogoX = A4_WIDTH_PT - MARGIN - headerLogoW;
      const headerLogoY = 10;
      drawLogoContrastBase(doc, headerLogoX, headerLogoY, headerLogoW, headerLogoH, logoContrastTone);
      doc.addImage(effectiveLogoBase64, imgFormat, headerLogoX, headerLogoY, headerLogoW, headerLogoH);
    } catch {
      // Ignora se falhar
    }
  }

  doc.setTextColor(0, 0, 0);
  y = 74;

  // ---- Identificação do paciente / projeto ----
  y = drawSectionTitle(doc, y, 'Identificação');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_FONT_SIZE);
  if (patientName) {
    doc.text(`Paciente: ${patientName}`, MARGIN, y);
    y += LINE_HEIGHT;
  }
  doc.text(`Projeto/Tratamento: ${projectName ?? project.name}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Data inicial: ${formatDate(dateStart)}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Data final: ${formatDate(dateEnd)}`, MARGIN, y);
  y += SECTION_GAP + LINE_HEIGHT;

  // ---- Comparação Antes / Depois ----
  // No modo “Revela Evolução” este bloco não deve aparecer.
  if (!evolutionMode && includeBeforeAfter && project.beforeImages.length > 0 && project.afterImages.length > 0) {
    const beforeBase64 = project.beforeImages[0];
    const afterBase64 = project.afterImages[0];

    const [beforeDim, afterDim] = await Promise.all([
      loadImageDimensions(beforeBase64),
      loadImageDimensions(afterBase64),
    ]);

    const maxImgHeight = 200;
    const halfGap = 12;
    const availableW = (CONTENT_WIDTH - halfGap) / 2;
    const beforeFit = fitDimensions(beforeDim.w, beforeDim.h, availableW, maxImgHeight);
    const afterFit = fitDimensions(afterDim.w, afterDim.h, availableW, maxImgHeight);
    const blockHeight = Math.max(beforeFit.height, afterFit.height) + 24;

    if (y + blockHeight > A4_HEIGHT_PT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }

    y = drawSectionTitle(doc, y, 'Comparação antes e depois');

    const leftX = MARGIN;
    const rightX = MARGIN + availableW + halfGap;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(LABEL_FONT_SIZE);
    doc.text('Antes', leftX + beforeFit.width / 2 - doc.getTextWidth('Antes') / 2, y);
    doc.text('Depois', rightX + afterFit.width / 2 - doc.getTextWidth('Depois') / 2, y);
    y += 12;

    doc.addImage(
      beforeBase64,
      getImageDataFormat(beforeBase64),
      leftX,
      y,
      beforeFit.width,
      beforeFit.height
    );
    doc.addImage(
      afterBase64,
      getImageDataFormat(afterBase64),
      rightX,
      y,
      afterFit.width,
      afterFit.height
    );
    y += Math.max(beforeFit.height, afterFit.height) + SECTION_GAP;
  }

  // ---- Timeline / Revelas de evolução ----
  const evolutionImagesAll = project.evolutionImages || [];

  type EvolutionLike = { id: string; image: string; date: string; label?: string; momentType?: string };
  const formatEvolutionLabel = (evo: EvolutionLike, indexFallback: number): string => {
    const rawLabel = (evo.label || evo.momentType || '').trim();
    if (!rawLabel) return `Revela ${indexFallback + 1}`;

    const lower = rawLabel.toLowerCase();
    if (lower === 'antes') return 'Início (0)';
    if (lower === 'final') return 'Resultado final';

    const marcoMatch = /^marco\s*(\d+)$/i.exec(rawLabel);
    if (marcoMatch) return `Revela ${marcoMatch[1]}`;

    return rawLabel;
  };

  if (evolutionMode) {
    const evolutionImages = evolutionImagesAll.slice(0, 4) as EvolutionLike[];

    if (includeTimeline) {
      if (evolutionImages.length === 0) {
        y = drawSectionTitle(doc, y, 'Evolução do tratamento');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text('Nenhum registro de evolução disponível neste projeto.', MARGIN, y);
        doc.setTextColor(0, 0, 0);
        y += SECTION_GAP;
      } else {
        const evoPerRow = 4;
        const evoGap = 8;
        const maxEvoHeight = 95;
        const labelBlockHeight = 18;
        const timelineHeaderHeight = LINE_HEIGHT + 8;
        const timelineSectionHeight = timelineHeaderHeight + labelBlockHeight + maxEvoHeight + 16;

        if (y + timelineSectionHeight > A4_HEIGHT_PT - MARGIN) {
          doc.addPage();
          y = MARGIN;
        }

        y = drawSectionTitle(doc, y, 'Evolução do tratamento');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(LABEL_FONT_SIZE);

        const cellW = (CONTENT_WIDTH - evoGap * (evoPerRow - 1)) / evoPerRow;
        const rowY = y;

        for (let i = 0; i < evolutionImages.length; i++) {
          const evo = evolutionImages[i];
          const col = i % evoPerRow;
          const x = MARGIN + col * (cellW + evoGap);
          const label = formatEvolutionLabel(evo, i);
          const dateStr = evo.date ? formatDate(evo.date) : '';

          doc.setFontSize(LABEL_FONT_SIZE);
          doc.text(label, x, rowY);
          if (dateStr) doc.text(dateStr, x, rowY + 10);

          try {
            const dim = await loadImageDimensions(evo.image);
            const fit = fitDimensions(dim.w, dim.h, cellW, maxEvoHeight);
            const imageX = x + (cellW - fit.width) / 2;
            doc.addImage(
              evo.image,
              getImageDataFormat(evo.image),
              imageX,
              rowY + labelBlockHeight,
              fit.width,
              fit.height,
            );
          } catch {
            doc.setFontSize(10);
            doc.text('(imagem não disponível)', x, rowY + labelBlockHeight + 12);
          }
        }

        y = rowY + labelBlockHeight + maxEvoHeight + SECTION_GAP;
      }
    }

    if (includeEvolutionABComparison) {
      const leftId = evolutionSelection?.leftId ?? null;
      const rightId = evolutionSelection?.rightId ?? null;

      const leftEvo = leftId
        ? (evolutionImagesAll.find((e) => e.id === leftId) as EvolutionLike | undefined)
        : undefined;
      const rightEvo = rightId
        ? (evolutionImagesAll.find((e) => e.id === rightId) as EvolutionLike | undefined)
        : undefined;

      const shouldRenderComparison = !!(leftEvo && rightEvo);

      if (!shouldRenderComparison) {
        const hasSomeSelection = !!leftId || !!rightId;
        const instruction = hasSomeSelection
          ? 'Selecione também o outro marco (Revela A e Revela B) para comparar.'
          : 'Selecione Revela A e Revela B na timeline para incluir comparação no PDF.';

        const approxHeight = 60;
        if (y + approxHeight > A4_HEIGHT_PT - MARGIN) {
          doc.addPage();
          y = MARGIN;
        }

        y = drawSectionTitle(doc, y, 'Comparação A/B');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(instruction, MARGIN, y);
        doc.setTextColor(0, 0, 0);
        y += SECTION_GAP;
      } else if (leftEvo && rightEvo) {
        const [leftDim, rightDim] = await Promise.all([
          loadImageDimensions(leftEvo.image),
          loadImageDimensions(rightEvo.image),
        ]);

        const maxImgHeight = 160;
        const halfGap = 12;
        const availableW = (CONTENT_WIDTH - halfGap) / 2;
        const leftFit = fitDimensions(leftDim.w, leftDim.h, availableW, maxImgHeight);
        const rightFit = fitDimensions(rightDim.w, rightDim.h, availableW, maxImgHeight);
        const blockHeight = Math.max(leftFit.height, rightFit.height) + 40;

        if (y + blockHeight > A4_HEIGHT_PT - MARGIN) {
          doc.addPage();
          y = MARGIN;
        }

        y = drawSectionTitle(doc, y, 'Comparação A/B');

        const leftX = MARGIN;
        const rightX = MARGIN + availableW + halfGap;
        const leftIndex = evolutionImagesAll.findIndex((e) => e.id === leftEvo.id);
        const rightIndex = evolutionImagesAll.findIndex((e) => e.id === rightEvo.id);
        const leftLabel = formatEvolutionLabel(leftEvo, Math.max(leftIndex, 0));
        const rightLabel = formatEvolutionLabel(rightEvo, Math.max(rightIndex, 0));
        const leftDateStr = leftEvo.date ? formatDate(leftEvo.date) : '';
        const rightDateStr = rightEvo.date ? formatDate(rightEvo.date) : '';

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(LABEL_FONT_SIZE);
        const labelY = y;

        doc.text(leftLabel, leftX + leftFit.width / 2 - doc.getTextWidth(leftLabel) / 2, labelY);
        doc.text(rightLabel, rightX + rightFit.width / 2 - doc.getTextWidth(rightLabel) / 2, labelY);

        if (leftDateStr) {
          doc.setFontSize(9);
          doc.text(leftDateStr, leftX + leftFit.width / 2 - doc.getTextWidth(leftDateStr) / 2, labelY + 10);
        }
        if (rightDateStr) {
          doc.setFontSize(9);
          doc.text(rightDateStr, rightX + rightFit.width / 2 - doc.getTextWidth(rightDateStr) / 2, labelY + 10);
        }

        const imageY = labelY + 22;
        doc.addImage(
          leftEvo.image,
          getImageDataFormat(leftEvo.image),
          leftX + (availableW - leftFit.width) / 2,
          imageY,
          leftFit.width,
          leftFit.height,
        );
        doc.addImage(
          rightEvo.image,
          getImageDataFormat(rightEvo.image),
          rightX + (availableW - rightFit.width) / 2,
          imageY,
          rightFit.width,
          rightFit.height,
        );

        y = imageY + Math.max(leftFit.height, rightFit.height) + SECTION_GAP;
      }
    }
  } else if (includeTimeline) {
    // 2) Modo clássico (grid até 4 revelas em linha)
    const evolutionImages = evolutionImagesAll.slice(0, 4);
    if (evolutionImages.length > 0) {
        const evoPerRow = 4;
        const evoGap = 8;
        const maxEvoHeight = 95;
        const labelBlockHeight = 18;
        const timelineHeaderHeight = LINE_HEIGHT + 8;
        const timelineSectionHeight = timelineHeaderHeight + labelBlockHeight + maxEvoHeight + 16;

        if (y + timelineSectionHeight > A4_HEIGHT_PT - MARGIN) {
          doc.addPage();
          y = MARGIN;
        }

        y = drawSectionTitle(doc, y, 'Evolução do tratamento');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(LABEL_FONT_SIZE);

        const cellW = (CONTENT_WIDTH - evoGap * (evoPerRow - 1)) / evoPerRow;
        const rowY = y;

        for (let i = 0; i < evolutionImages.length; i++) {
          const evo = evolutionImages[i] as EvolutionLike;
          const col = i % evoPerRow;
          const x = MARGIN + col * (cellW + evoGap);

          const label = formatEvolutionLabel(evo, i);
          const dateStr = evo.date ? formatDate(evo.date) : '';
          doc.setFontSize(LABEL_FONT_SIZE);
          doc.text(label, x, rowY);
          if (dateStr) {
            doc.text(dateStr, x, rowY + 10);
          }

          try {
            const dim = await loadImageDimensions(evo.image);
            const fit = fitDimensions(dim.w, dim.h, cellW, maxEvoHeight);
            const imageX = x + (cellW - fit.width) / 2;
            doc.addImage(
              evo.image,
              getImageDataFormat(evo.image),
              imageX,
              rowY + labelBlockHeight,
              fit.width,
              fit.height,
            );
          } catch {
            doc.setFontSize(10);
            doc.text('(imagem não disponível)', x, rowY + labelBlockHeight + 12);
          }
        }
      y = rowY + labelBlockHeight + maxEvoHeight + SECTION_GAP;
    }
  }

  // ---- Observações ----
  if (includeNotes && project.notes && project.notes.trim()) {
    if (y > A4_HEIGHT_PT - MARGIN - 80) {
      doc.addPage();
      y = MARGIN;
    }

    y = drawSectionTitle(doc, y, 'Observações');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_FONT_SIZE);
    const lines = doc.splitTextToSize(project.notes.trim(), CONTENT_WIDTH);
    for (const line of lines) {
      if (y > A4_HEIGHT_PT - MARGIN - 20) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(line, MARGIN, y);
      y += LINE_HEIGHT;
    }
    y += SECTION_GAP;
  }

  // ---- Rodapé em todas as páginas ----
  const totalPages = doc.getNumberOfPages();
  let footerLogoDims: { width: number; height: number } | null = null;
  if (effectiveLogoBase64) {
    try {
      const dim = await loadImageDimensions(effectiveLogoBase64);
      footerLogoDims = fitDimensions(dim.w, dim.h, 90, 20);
    } catch {
      footerLogoDims = null;
    }
  }

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (effectiveLogoBase64 && footerLogoDims) {
      try {
        const logoX = A4_WIDTH_PT / 2 - footerLogoDims.width / 2;
        const logoY = A4_HEIGHT_PT - 56;
        drawLogoContrastBase(doc, logoX, logoY, footerLogoDims.width, footerLogoDims.height, logoContrastTone);
        doc.addImage(
          effectiveLogoBase64,
          getImageDataFormat(effectiveLogoBase64),
          logoX,
          logoY,
          footerLogoDims.width,
          footerLogoDims.height,
        );
      } catch {
        // Se falhar, continua sem logo no rodapé.
      }
    }
    doc.setDrawColor(...REVELA_TEAL_RGB);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, A4_HEIGHT_PT - 30, A4_WIDTH_PT - MARGIN, A4_HEIGHT_PT - 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Página ${p} de ${totalPages}`,
      A4_WIDTH_PT / 2 - doc.getTextWidth(`Página ${p} de ${totalPages}`) / 2,
      A4_HEIGHT_PT - 18
    );
    doc.setFontSize(8);
    doc.setTextColor(0, 168, 143);
    doc.text('Gerado por Revela Premium', MARGIN, A4_HEIGHT_PT - 18);
    doc.setTextColor(0, 0, 0);
  }

  return doc.output('blob');
}
