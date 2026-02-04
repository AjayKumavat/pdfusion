
import { PDFDocument } from 'pdf-lib';
import { CompressionLevel } from '../types';

export const pdfService = {
  async getPageCount(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  },

  async jpgToPdf(files: File[], compression: CompressionLevel): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const quality = compression === 'low' ? 0.8 : compression === 'medium' ? 0.4 : 0.1;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const compressedBuffer = await this.compressImage(arrayBuffer, file.type, quality);
      const image = await pdfDoc.embedJpg(compressedBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    return await pdfDoc.save();
  },

  async pngToPdf(files: File[], compression: CompressionLevel): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const quality = compression === 'low' ? 0.8 : compression === 'medium' ? 0.4 : 0.1;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      // PNGs are converted to compressed JPGs for significant PDF size reduction
      const compressedBuffer = await this.compressImage(arrayBuffer, 'image/jpeg', quality);
      const image = await pdfDoc.embedJpg(compressedBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    return await pdfDoc.save();
  },

  async mergePdfs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save();
  },

  async splitPdfSingle(file: File, pages: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(pdfDoc, pages);
    copiedPages.forEach(p => newDoc.addPage(p));
    return await newDoc.save();
  },

  async compressPdf(file: File, compression: CompressionLevel): Promise<Uint8Array> {
    // pdf-lib's "compression" is limited to object stream compression on save.
    // For browser-side PDF-to-PDF compression, we enable the useObjectStreams flag.
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return await pdfDoc.save({ useObjectStreams: true });
  },

  async organizePdf(file: File, pageOrder: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(pdfDoc, pageOrder);
    pages.forEach(p => newDoc.addPage(p));
    return await newDoc.save();
  },

  async compressImage(buffer: ArrayBuffer, mimeType: string, quality: number): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const blob = new Blob([buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // If high compression, downscale resolution slightly too
        const scale = quality < 0.2 ? 0.7 : 1.0;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((result) => {
          if (result) {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(new Uint8Array(reader.result as ArrayBuffer));
            };
            reader.readAsArrayBuffer(result);
          }
        }, 'image/jpeg', quality); // Forced to JPEG for compression benefits
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }
};
