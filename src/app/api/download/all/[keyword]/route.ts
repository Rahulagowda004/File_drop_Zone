// src/app/api/download/all/[keyword]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getFilesByKeyword, getFileDownloadUrl } from "@/lib/fileStore";
import JSZip from "jszip";
import { BlobServiceClient } from "@azure/storage-blob";

export async function GET(
  request: NextRequest,
  { params }: { params: { keyword: string } }
) {
  // Await params to resolve the dynamic params
  const { keyword } = await params;

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is missing." },
      { status: 400 }
    );
  }

  try {
    const filesData = await getFilesByKeyword(keyword);

    if (!filesData || filesData.length === 0) {
      return NextResponse.json(
        { error: "No files found for this keyword or keyword does not exist." },
        { status: 404 }
      );
    }

    const zip = new JSZip();

    // Download each file from Azure Blob Storage and add to the ZIP
    for (const file of filesData) {
      try {
        // Get a download URL for the file
        const fileUrl = await getFileDownloadUrl(keyword, file.fileName);

        if (!fileUrl) {
          console.error(`Could not generate download URL for ${file.fileName}`);
          continue;
        }

        // Fetch the file content from Azure Blob Storage
        const response = await fetch(fileUrl);
        if (!response.ok) {
          console.error(
            `Failed to fetch file ${file.fileName}: ${response.status}`
          );
          continue;
        }

        const fileBuffer = await response.arrayBuffer();
        zip.file(file.fileName, fileBuffer);
      } catch (error) {
        console.error(`Error processing file ${file.fileName}:`, error);
        // Continue with other files if one fails
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    const responseHeaders = {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${keyword}.zip"`,
    };

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Error generating zip for keyword ${keyword}:`, error);
    return NextResponse.json(
      { error: "Failed to generate ZIP file." },
      { status: 500 }
    );
  }
}
