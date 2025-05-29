// src/lib/fileStore.ts
export interface StoredFile {
  keyword: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

// This Map will persist across API route calls in a single Node.js process (e.g. during `npm run dev`).
// In serverless environments (like Vercel deployment), this in-memory store will not work as a persistent global store
// as each request might be handled by a different instance. This is suitable for mocking/demo purposes.
export const uploadedFiles: Map<string, StoredFile> = new Map();
