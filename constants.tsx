
import { PDFTool } from './types';

export const TOOLS: PDFTool[] = [
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Convert JPG images to PDF documents easily.',
    category: 'JPG',
    icon: 'FileImage',
    hasCompression: true,
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Extract images from your PDF or save pages as JPG.',
    category: 'JPG',
    icon: 'ImageIcon',
    hasCompression: true,
  },
  {
    id: 'png-to-pdf',
    name: 'PNG to PDF',
    description: 'Convert PNG images to PDF documents with high quality.',
    category: 'PNG',
    icon: 'FileImage',
    hasCompression: true,
  },
  {
    id: 'pdf-to-png',
    name: 'PDF to PNG',
    description: 'Turn your PDF pages into high-quality PNG images.',
    category: 'PNG',
    icon: 'ImageIcon',
    hasCompression: true,
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    category: 'PDF',
    icon: 'Merge',
    hasCompression: true,
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    description: 'Separate one page or a whole set for easy conversion.',
    category: 'PDF',
    icon: 'Split',
    hasCompression: true,
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce file size while optimizing for maximal quality.',
    category: 'PDF',
    icon: 'Minimize2',
    hasCompression: true,
  },
  {
    id: 'organize-pdf',
    name: 'Organize PDF',
    description: 'Sort, add and delete PDF pages of your document.',
    category: 'PDF',
    icon: 'Layout',
    hasCompression: false,
  },
];
