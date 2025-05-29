// src/app/api/download/all/[keyword]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { uploadedFiles, type StoredFile } from "@/lib/fileStore";
import JSZip from "jszip";

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

  const filesData = uploadedFiles.get(keyword);

  if (!filesData || filesData.length === 0) {
    return NextResponse.json(
      { error: "No files found for this keyword or keyword does not exist." },
      { status: 404 }
    );
  }

  try {
    const zip = new JSZip();

    for (const file of filesData) {
      // In a real application, you would fetch the actual file content here.
      // For this demonstration, we'll create dummy content.
      const dummyContent = `This is the content for ${
        file.fileName
      }.\nUploaded at: ${file.uploadedAt.toISOString()}\nSize: ${
        file.size
      } bytes.\nContent Type: ${file.contentType}`;
      zip.file(file.fileName, dummyContent);
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
