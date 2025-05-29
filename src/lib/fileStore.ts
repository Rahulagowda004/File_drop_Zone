// src/lib/fileStore.ts
import { getCollection } from "./db";
import {
  uploadFileToBlob,
  deleteFileFromBlob,
  deleteAllFilesForKeyword,
  getFileSasUrl,
} from "./azure-storage";
import { ObjectId } from "mongodb";

export interface StoredFile {
  _id?: ObjectId | string;
  keyword: string;
  fileName: string;
  contentType: string;
  size: number;
  blobUrl?: string;
  sasUrl?: string;
  uploadedAt: Date;
  expiresAt: Date;
}

// Constants
const FILES_COLLECTION = "files";
const EXPIRY_HOURS = 24;

// Helper to calculate expiration date
const calculateExpiryDate = (date: Date = new Date()): Date => {
  const expiryDate = new Date(date);
  expiryDate.setHours(expiryDate.getHours() + EXPIRY_HOURS);
  return expiryDate;
};

// Save file metadata to MongoDB
export async function saveFileMetadata(
  fileData: StoredFile
): Promise<ObjectId> {
  const collection = await getCollection(FILES_COLLECTION);

  // Set expiration date if not provided
  if (!fileData.expiresAt) {
    fileData.expiresAt = calculateExpiryDate(fileData.uploadedAt);
  }

  const result = await collection.insertOne(fileData);
  return result.insertedId;
}

// Upload file to Azure and save metadata to MongoDB
export async function uploadFile(
  keyword: string,
  fileName: string,
  contentType: string,
  fileBuffer: Buffer,
  size: number
): Promise<StoredFile> {
  // Upload to Azure blob storage
  const blobUrl = await uploadFileToBlob(
    fileName,
    contentType,
    fileBuffer,
    keyword
  );

  // Create metadata record
  const now = new Date();
  const fileData: StoredFile = {
    keyword: keyword.toLowerCase(),
    fileName,
    contentType,
    size,
    blobUrl,
    uploadedAt: now,
    expiresAt: calculateExpiryDate(now),
  };

  // Save to MongoDB
  const id = await saveFileMetadata(fileData);
  fileData._id = id;

  return fileData;
}

// Get files by keyword from MongoDB
export async function getFilesByKeyword(
  keyword: string
): Promise<StoredFile[]> {
  const collection = await getCollection(FILES_COLLECTION);

  // Find files with the given keyword that haven't expired
  const files = await collection
    .find({
      keyword: keyword.toLowerCase(),
      expiresAt: { $gt: new Date() },
    })
    .sort({ uploadedAt: -1 })
    .toArray();

  // Convert MongoDB objects to plain objects for client components
  // This ensures MongoDB-specific objects like ObjectId are properly serialized
  return files.map((file) => {
    // Create a plain JS object with string ID
    const plainFile = {
      ...file,
      _id: file._id ? file._id.toString() : undefined,
      // Ensure dates are serialized properly
      uploadedAt: new Date(file.uploadedAt),
      expiresAt: new Date(file.expiresAt),
    };

    return plainFile;
  }) as StoredFile[];
}

// Delete a file by keyword and filename
export async function deleteFile(
  keyword: string,
  fileName: string
): Promise<boolean> {
  const collection = await getCollection(FILES_COLLECTION);

  // Delete from Azure Blob Storage
  await deleteFileFromBlob(keyword, fileName);

  // Delete from MongoDB
  const result = await collection.deleteOne({
    keyword: keyword.toLowerCase(),
    fileName,
  });

  return result.deletedCount > 0;
}

// Delete all files for a keyword
export async function deleteAllFiles(keyword: string): Promise<number> {
  const collection = await getCollection(FILES_COLLECTION);

  // First get all files to delete from blob storage
  const files = await getFilesByKeyword(keyword);

  // Delete from Azure Blob Storage
  await deleteAllFilesForKeyword(keyword);

  // Delete from MongoDB
  const result = await collection.deleteMany({
    keyword: keyword.toLowerCase(),
  });

  return result.deletedCount;
}

// Clean up expired files (can be run as a cron job)
export async function cleanupExpiredFiles(): Promise<number> {
  const collection = await getCollection(FILES_COLLECTION);

  // Find expired files
  const expiredFiles = (await collection
    .find({ expiresAt: { $lt: new Date() } })
    .toArray()) as StoredFile[];

  let deletedCount = 0;

  // Delete each file from blob storage and MongoDB
  for (const file of expiredFiles) {
    try {
      await deleteFileFromBlob(file.keyword, file.fileName);
      deletedCount++;
    } catch (error) {
      console.error(
        `Error deleting blob for ${file.keyword}/${file.fileName}:`,
        error
      );
    }
  }

  // Delete all expired records from MongoDB
  await collection.deleteMany({ expiresAt: { $lt: new Date() } });

  return deletedCount;
}

// Generate a download URL for a file
export async function getFileDownloadUrl(
  keyword: string,
  fileName: string
): Promise<string | null> {
  const collection = await getCollection(FILES_COLLECTION);

  const file = (await collection.findOne({
    keyword: keyword.toLowerCase(),
    fileName,
    expiresAt: { $gt: new Date() },
  })) as StoredFile | null;

  if (!file) {
    return null;
  }

  // Generate a SAS URL for the blob that expires in 15 minutes
  return await getFileSasUrl(keyword, fileName, 15);
}
