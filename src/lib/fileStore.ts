// src/lib/fileStore.ts
export interface StoredFile {
  keyword: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

// Each keyword now maps to an array of StoredFile objects.
export const uploadedFiles: Map<string, StoredFile[]> = new Map();
