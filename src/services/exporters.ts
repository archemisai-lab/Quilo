import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { RevisionSheet } from '../types/revision';

/**
 * Downloads a Blob as a file in the browser
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize filename
 */
function cleanFilename(title: string, ext: string): string {
  const safe = title
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, '_')
    .slice(0, 40);
  return `quilo_${safe || 'fiche'}.${ext}`;
}

import * as htmlToImage from 'html-to-image';

/**
 * Downloads a data URL as a file in the browser
 */
function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Fallback canvas renderer that draws the revision sheet directly on 2D context
 */
function generateCanvasFromSheet(sheet: RevisionSheet, filename: string) {
  const canvas = document.createElement('canvas');
  const width = 1600;
  const height = 2200;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Top header banner
  ctx.fillStyle = '#5B8DEF';
  ctx.fillRect(80, 80, width - 160, 110);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('QUILO • FICHE DE RÉVISION COMPACTE', 120, 130);

  ctx.font = 'bold 22px sans-serif';
  ctx.fillText((sheet.subject || 'COURS').toUpperCase(), 120, 165);

  let y = 240;

  // Title
  ctx.fillStyle = '#1E2A3A';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(sheet.title, 80, y);
  y += 70;

  // Summary Box
  ctx.fillStyle = '#F4F6FA';
  ctx.fillRect(80, y, width - 160, 140);
  ctx.fillStyle = '#5B8DEF';
  ctx.fillRect(80, y, 12, 140); // left accent

  ctx.fillStyle = '#1E2A3A';
  ctx.font = '24px sans-serif';
  const summaryWords = sheet.summary.split(' ');
  let line = '';
  let lineY = y + 50;
  for (const word of summaryWords) {
    const testLine = line + word + ' ';
    if (ctx.measureText(testLine).width > width - 240) {
      ctx.fillText(line, 120, lineY);
      line = word + ' ';
      lineY += 36;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 120, lineY);
  y += 180;

  // Essential Takeaway
  if (sheet.essentialTakeaway) {
    ctx.fillStyle = '#FFF9EC';
    ctx.fillRect(80, y, width - 160, 100);
    ctx.strokeStyle = '#FFC04D';
    ctx.lineWidth = 3;
    ctx.strokeRect(80, y, width - 160, 100);

    ctx.fillStyle = '#1E2A3A';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('À RETENIR POUR LE CONTRÔLE :', 110, y + 40);
    ctx.font = '22px sans-serif';
    ctx.fillText(sheet.essentialTakeaway, 110, y + 74);
    y += 140;
  }

  // Definitions
  if (sheet.definitions && sheet.definitions.length > 0) {
    ctx.fillStyle = '#4874D6';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Définitions indispensables', 80, y);
    y += 50;

    sheet.definitions.slice(0, 5).forEach((def) => {
      ctx.fillStyle = '#4874D6';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`• ${def.term} :`, 80, y);
      ctx.fillStyle = '#1E2A3A';
      ctx.font = '22px sans-serif';
      ctx.fillText(def.definition, 100, y + 32);
      y += 75;
    });
    y += 30;
  }

  // Key items
  if (sheet.keyItems && sheet.keyItems.length > 0) {
    ctx.fillStyle = '#4874D6';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Repères & Dates clés', 80, y);
    y += 50;

    sheet.keyItems.slice(0, 4).forEach((item) => {
      ctx.fillStyle = '#1E2A3A';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`• ${item.label} :`, 80, y);
      ctx.fillStyle = '#4B5A70';
      ctx.font = '22px sans-serif';
      ctx.fillText(item.detail, 100, y + 32);
      y += 75;
    });
  }

  // Footer note
  ctx.fillStyle = '#4B5A70';
  ctx.font = '20px sans-serif';
  ctx.fillText('Quilo • Fiche de révision compacte pour collégiens et lycéens', 80, height - 60);

  const dataUrl = canvas.toDataURL('image/png');
  downloadDataUrl(dataUrl, filename);
}

/**
 * 1. Export as high-res PNG using html-to-image with multi-tiered fallback
 */
export async function exportToPNG(
  elementId: string,
  sheetTitle: string,
  sheetFallback?: RevisionSheet
): Promise<void> {
  const filename = cleanFilename(sheetTitle, 'png');
  const element = document.getElementById(elementId);

  // Strategy 1: html-to-image (handles modern Tailwind CSS v4 & foreignObject cleanly)
  if (element) {
    try {
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
        cacheBust: true,
        skipFonts: true,
      });
      if (dataUrl && dataUrl.startsWith('data:image/png')) {
        downloadDataUrl(dataUrl, filename);
        return;
      }
    } catch (err) {
      console.warn('html-to-image capture issue, attempting canvas fallback:', err);
    }
  }

  // Strategy 2: html2canvas
  if (element) {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl && dataUrl.length > 100) {
        downloadDataUrl(dataUrl, filename);
        return;
      }
    } catch (canvasErr) {
      console.warn('html2canvas capture issue, using direct 2D canvas fallback:', canvasErr);
    }
  }

  // Strategy 3: Direct 2D canvas synthesis (guaranteed to always work)
  if (sheetFallback) {
    generateCanvasFromSheet(sheetFallback, filename);
    return;
  }

  throw new Error('Impossible de générer l’image PNG.');
}

/**
 * 2. Export as cleanly formatted PDF using jsPDF
 */
export async function exportToPDF(sheet: RevisionSheet): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header banner: Quilo blue #5B8DEF
  doc.setFillColor(91, 141, 239);
  doc.rect(margin, y, contentWidth, 22, 'F');

  // Quilo brand mark
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('QUILO - FICHE DE RÉVISION COMPACTE', margin + 6, y + 8);

  // Subject tag
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(sheet.subject.toUpperCase(), margin + 6, y + 16);

  y += 28;

  // Title
  doc.setTextColor(30, 42, 58); // #1E2A3A
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(sheet.title, contentWidth);
  doc.text(splitTitle, margin, y);
  y += splitTitle.length * 7 + 4;

  // Summary box
  doc.setFillColor(244, 246, 250); // #F4F6FA
  doc.setDrawColor(225, 231, 240); // #E1E7F0
  doc.setLineWidth(0.4);
  const splitSummary = doc.splitTextToSize(sheet.summary, contentWidth - 10);
  const summaryBoxHeight = splitSummary.length * 5 + 8;
  doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 2, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(75, 90, 112); // #4B5A70
  doc.text(splitSummary, margin + 5, y + 6);
  y += summaryBoxHeight + 6;

  // Helper function to check page overflow
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 280) {
      doc.addPage();
      y = margin;
    }
  };

  // Essential Takeaway / À retenir absolument
  if (sheet.essentialTakeaway) {
    checkPageBreak(20);
    doc.setFillColor(255, 248, 230); // light yellow
    doc.setDrawColor(255, 192, 77); // #FFC04D
    doc.setLineWidth(0.6);
    const takeawayText = doc.splitTextToSize(
      `À RETENIR POUR LE CONTRÔLE : ${sheet.essentialTakeaway}`,
      contentWidth - 12
    );
    const boxHeight = takeawayText.length * 5 + 8;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 42, 58);
    doc.text(takeawayText, margin + 6, y + 6);
    y += boxHeight + 6;
  }

  // Key Items (Dates / Formules)
  if (sheet.keyItems && sheet.keyItems.length > 0) {
    checkPageBreak(25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(72, 116, 214); // #4874D6
    doc.text('REPÈRES & DATES CLÉS', margin, y);
    y += 6;

    sheet.keyItems.forEach((item) => {
      checkPageBreak(12);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 42, 58);
      doc.text(`• ${item.label} : `, margin + 3, y);

      const labelWidth = doc.getTextWidth(`• ${item.label} : `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 90, 112);
      const detailLines = doc.splitTextToSize(item.detail, contentWidth - labelWidth - 6);
      doc.text(detailLines, margin + 3 + labelWidth, y);
      y += detailLines.length * 5 + 2;
    });
    y += 4;
  }

  // Definitions
  if (sheet.definitions && sheet.definitions.length > 0) {
    checkPageBreak(25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(72, 116, 214);
    doc.text('DÉFINITIONS ESSENTIELLES', margin, y);
    y += 6;

    sheet.definitions.forEach((def) => {
      checkPageBreak(14);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 42, 58);
      doc.text(`• ${def.term} :`, margin + 3, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 90, 112);
      const defLines = doc.splitTextToSize(def.definition, contentWidth - 8);
      doc.text(defLines, margin + 6, y);
      y += defLines.length * 4.8 + 3;
    });
    y += 4;
  }

  // Sections
  if (sheet.sections && sheet.sections.length > 0) {
    sheet.sections.forEach((section) => {
      checkPageBreak(25);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(72, 116, 214);
      doc.text(section.title.toUpperCase(), margin, y);
      y += 6;

      section.points.forEach((point) => {
        checkPageBreak(12);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 42, 58);
        const pointLines = doc.splitTextToSize(`- ${point}`, contentWidth - 6);
        doc.text(pointLines, margin + 3, y);
        y += pointLines.length * 5 + 1.5;
      });
      y += 4;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 160, 175);
  doc.text(
    `Fiche générée avec Quilo | Sauvegardée sur cet appareil le ${new Date(sheet.createdAt).toLocaleDateString('fr-FR')}`,
    margin,
    290
  );

  doc.save(cleanFilename(sheet.title, 'pdf'));
}

/**
 * 3. Export as real editable DOCX file using docx library
 */
export async function exportToDOCX(sheet: RevisionSheet): Promise<void> {
  const docParagraphs: Paragraph[] = [];

  // Header Title
  docParagraphs.push(
    new Paragraph({
      text: sheet.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
    })
  );

  // Subject and date
  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Matière : ${sheet.subject}  |  Généré avec Quilo le ${new Date(sheet.createdAt).toLocaleDateString('fr-FR')}`,
          italics: true,
          color: '4B5A70',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Summary
  if (sheet.summary) {
    docParagraphs.push(
      new Paragraph({
        text: 'Résumé synthétique',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 150, after: 80 },
      })
    );
    docParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: sheet.summary, color: '1E2A3A' })],
        spacing: { after: 200 },
      })
    );
  }

  // Essential Takeaway
  if (sheet.essentialTakeaway) {
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '⭐ À RETENIR POUR LE CONTRÔLE : ',
            bold: true,
            color: '1E2A3A',
          }),
          new TextRun({
            text: sheet.essentialTakeaway,
            color: '1E2A3A',
          }),
        ],
        spacing: { before: 100, after: 200 },
      })
    );
  }

  // Definitions
  if (sheet.definitions && sheet.definitions.length > 0) {
    docParagraphs.push(
      new Paragraph({
        text: 'Définitions essentielles',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );
    sheet.definitions.forEach((def) => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${def.term} : `, bold: true, color: '4874D6' }),
            new TextRun({ text: def.definition, color: '1E2A3A' }),
          ],
          spacing: { after: 80 },
        })
      );
    });
  }

  // Key Items (Dates / Formules)
  if (sheet.keyItems && sheet.keyItems.length > 0) {
    docParagraphs.push(
      new Paragraph({
        text: 'Repères & Dates clés',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );
    sheet.keyItems.forEach((item) => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${item.label} : `, bold: true, color: '1E2A3A' }),
            new TextRun({ text: item.detail, color: '4B5A70' }),
          ],
          spacing: { after: 80 },
        })
      );
    });
  }

  // Sections
  if (sheet.sections && sheet.sections.length > 0) {
    sheet.sections.forEach((sec) => {
      docParagraphs.push(
        new Paragraph({
          text: sec.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      sec.points.forEach((point) => {
        docParagraphs.push(
          new Paragraph({
            text: `– ${point}`,
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      });
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, cleanFilename(sheet.title, 'docx'));
}
