// src/lib/azure-storage.ts
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

// Initialize Azure Blob Storage connection
if (!process.env.AZURE_CONNECTION_STRING) {
  throw new Error(
    "Please add your Azure Storage Connection String to .env.local"
  );
}

const connectionString = process.env.AZURE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME || "files";

// Create the BlobServiceClient
const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Ensure the container exists
export async function ensureContainer() {
  try {
    await containerClient.createIfNotExists({
      access: "blob", // Allow public read access to blobs
    });
    console.log(`Container "${containerName}" is ready.`);
  } catch (error) {
    console.error(`Error creating container "${containerName}":`, error);
    throw error;
  }
}

// Upload a file to Azure Blob Storage
export async function uploadFileToBlob(
  fileName: string,
  contentType: string,
  buffer: Buffer,
  keyword: string
): Promise<string> {
  // Create a unique blob name using the keyword and filename
  const blobName = `${keyword}/${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload the file
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });

  // Return the URL of the uploaded blob
  return blockBlobClient.url;
}

// Delete a file from Azure Blob Storage
export async function deleteFileFromBlob(
  keyword: string,
  fileName: string
): Promise<void> {
  const blobName = `${keyword}/${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.delete();
}

// Delete all files for a keyword from Azure Blob Storage
export async function deleteAllFilesForKeyword(keyword: string): Promise<void> {
  // List all blobs in the virtual directory for this keyword
  for await (const blob of containerClient.listBlobsFlat({
    prefix: `${keyword}/`,
  })) {
    const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
    await blockBlobClient.delete();
  }
}

// Get a SAS URL for a file that expires after a certain time
export async function getFileSasUrl(
  keyword: string,
  fileName: string,
  expiryMinutes: number = 60
): Promise<string> {
  const blobName = `${keyword}/${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Get blob SAS URL that expires in expiryMinutes
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);

  const sasOptions = {
    expiresOn: expiryTime,
    permissions: "r", // read permission only
  };

  return await blockBlobClient.generateSasUrl(sasOptions);
}
