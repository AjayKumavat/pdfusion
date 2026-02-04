
import { PDFDocument } from 'pdf-lib';
import { CompressionLevel } from '../types';

export const pdfService = {
  async jpgToPdf(files: File[], compression: CompressionLevel): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    
    // Compression quality mapping
    const quality = compression === 'low' ? 0.9 : compression === 'medium' ? 0.6 : 0.3;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      // Since native browser image manipulation is needed for quality adjustment:
      const compressedBuffer = await this.compressImage(arrayBuffer, file.type, quality);
      const image = await pdfDoc.embedJpg(compressedBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }
    
    return await pdfDoc.save();
  },

  async pngToPdf(files: File[], compression: CompressionLevel): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const quality = compression === 'low' ? 0.9 : compression === 'medium' ? 0.6 : 0.3;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const compressedBuffer = await this.compressImage(arrayBuffer, file.type, quality);
      const image = await pdfDoc.embedPng(compressedBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }
    
    return await pdfDoc.save();
  },

  async mergePdfs(files: File[], compression: CompressionLevel): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save();
  },

  async splitPdf(file: File): Promise<Uint8Array[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const splitPdfs: Uint8Array[] = [];
    
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const newDoc = await PDFDocument.create();
      const [page] = await newDoc.copyPages(pdfDoc, [i]);
      newDoc.addPage(page);
      splitPdfs.push(await newDoc.save());
    }
    
    return splitPdfs;
  },

  async compressPdf(file: File, compression: CompressionLevel): Promise<Uint8Array> {
    // Basic compression by loading and re-saving (pdf-lib doesn't have deep compression natively)
    // Real compression would involve image downscaling within the PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return await pdfDoc.save();
  },

  async organizePdf(file: File, pageOrder: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(pdfDoc, pageOrder);
    pages.forEach(p => newDoc.addPage(p));
    return await newDoc.save();
  },

  // Helper for image compression using Canvas
  async compressImage(buffer: ArrayBuffer, mimeType: string, quality: number): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const blob = new Blob([buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        
        const format = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob((result) => {
          if (result) {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(new Uint8Array(reader.result as ArrayBuffer));
            };
            reader.readAsArrayBuffer(result);
          }
        }, format, quality);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }
};
