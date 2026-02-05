
import { PDFDocument, PageSizes } from 'pdf-lib';
import { CompressionLevel, PageSize } from '../types';
import * as pdfjs from 'pdfjs-dist';

// Configure worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

export const pdfService = {
  async getPageCount(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  },

  async getPageThumbnails(file: File): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const thumbnails: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 }); // Low scale for thumbnails
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        // Fix: Add 'canvas' property to RenderParameters as required by the types
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
      }
    }
    return thumbnails;
  },

  async jpgToPdf(files: File[], compression: CompressionLevel, pageSize: PageSize = 'original'): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const quality = compression === 'none' ? 1.0 : compression === 'low' ? 0.8 : compression === 'medium' ? 0.4 : 0.1;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const compressedBuffer = await this.compressImage(arrayBuffer, file.type, quality);
      const image = await pdfDoc.embedJpg(compressedBuffer);
      
      let width = image.width;
      let height = image.height;
      let pageWidth = width;
      let pageHeight = height;

      if (pageSize !== 'original') {
        const standardSize = pageSize === 'A4' ? PageSizes.A4 : PageSizes.Letter;
        pageWidth = standardSize[0];
        pageHeight = standardSize[1];

        // Fit image into page maintaining aspect ratio
        const scale = Math.min(pageWidth / width, pageHeight / height);
        width = width * scale;
        height = height * scale;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2;
      
      page.drawImage(image, { x, y, width, height });
    }
    return await pdfDoc.save();
  },

  async pngToPdf(files: File[], compression: CompressionLevel, pageSize: PageSize = 'original'): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const quality = compression === 'none' ? 1.0 : compression === 'low' ? 0.8 : compression === 'medium' ? 0.4 : 0.1;

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      // PNGs are converted to JPG for embedding. Quality 1.0 for 'none' to maintain fidelity.
      const compressedBuffer = await this.compressImage(arrayBuffer, 'image/jpeg', quality);
      const image = await pdfDoc.embedJpg(compressedBuffer);
      
      let width = image.width;
      let height = image.height;
      let pageWidth = width;
      let pageHeight = height;

      if (pageSize !== 'original') {
        const standardSize = pageSize === 'A4' ? PageSizes.A4 : PageSizes.Letter;
        pageWidth = standardSize[0];
        pageHeight = standardSize[1];

        const scale = Math.min(pageWidth / width, pageHeight / height);
        width = width * scale;
        height = height * scale;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2;

      page.drawImage(image, { x, y, width, height });
    }
    return await pdfDoc.save();
  },

  async pdfToImages(file: File, format: 'jpeg' | 'png', compression: CompressionLevel): Promise<{ name: string, data: Uint8Array }[]> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const results: { name: string, data: Uint8Array }[] = [];

    const scaleMap = { none: 2.0, low: 2.0, medium: 1.5, high: 1.0 };
    const qualityMap = { none: 1.0, low: 0.9, medium: 0.7, high: 0.4 };
    const scale = scaleMap[compression];
    const quality = qualityMap[compression];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        // Fix: Add 'canvas' property to RenderParameters as required by the types
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        const imgData = canvas.toDataURL(`image/${format}`, quality);
        const bytes = this.decodeBase64(imgData.split(',')[1]);
        results.push({
          name: `page_${i}.${format === 'jpeg' ? 'jpg' : 'png'}`,
          data: bytes
        });
      }
    }
    return results;
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
    const arrayBuffer = await file.arrayBuffer();
    
    // To guarantee compression works for every kind of PDF, 
    // we use a "flattening" approach by re-encoding pages as optimized images.
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const newDoc = await PDFDocument.create();
    
    // Scale and quality mapping including 'none'
    const scaleMap = { none: 2.0, low: 1.5, medium: 1.0, high: 0.75 };
    const qualityMap = { none: 1.0, low: 0.8, medium: 0.5, high: 0.2 };
    
    const scale = scaleMap[compression];
    const quality = qualityMap[compression];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        // Fix: Add 'canvas' property to RenderParameters as required by the types
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        // JPEGs are significantly smaller for PDF compression
        const imgData = canvas.toDataURL('image/jpeg', quality);
        const imgBytes = this.decodeBase64(imgData.split(',')[1]);
        const image = await newDoc.embedJpg(imgBytes);
        const newPage = newDoc.addPage([image.width, image.height]);
        newPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
    }
    // Final structural optimization
    return await newDoc.save({ useObjectStreams: true });
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
        // For 'none' quality (1.0), we skip downscaling
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
        }, 'image/jpeg', quality);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  },

  decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
};
