
export type ToolCategory = 'JPG' | 'PNG' | 'PDF';

export type CompressionLevel = 'none' | 'low' | 'medium' | 'high';

export type PageSize = 'original' | 'A4' | 'letter';

export interface PDFTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  hasCompression: boolean;
}

export type AppStep = 'category' | 'tool' | 'upload' | 'options' | 'processing' | 'done';

export interface ProcessedFile {
  name: string;
  data: Uint8Array | Blob | string;
  type: string;
  size: number;
}
