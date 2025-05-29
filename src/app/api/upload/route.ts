import { type NextRequest, NextResponse } from "next/server";
import {
  uploadFile,
  getFilesByKeyword,
  type StoredFile,
} from "@/lib/fileStore";
import { ensureContainer } from "@/lib/azure-storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const keyword = formData.get("keyword") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!keyword || keyword.trim() === "") {
      return NextResponse.json(
        { error: "No keyword provided." },
        { status: 400 }
      );
    }

    const trimmedKeyword = keyword.trim().toLowerCase();

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKeyword)) {
      return NextResponse.json(
        {
          error:
            "Invalid keyword format. Use letters, numbers, underscores, and hyphens only.",
        },
        { status: 400 }
      );
    }

    if (trimmedKeyword.length < 3 || trimmedKeyword.length > 50) {
      return NextResponse.json(
        { error: "Keyword must be between 3 and 50 characters." },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE_API = 10 * 1024 * 1024; // 10MB, should match frontend
    if (file.size > MAX_FILE_SIZE_API) {
      return NextResponse.json(
        {
          error: `File is too large. Max size is ${
            MAX_FILE_SIZE_API / (1024 * 1024)
          }MB.`,
        },
        { status: 413 }
      );
    }

    // Ensure Azure Storage container exists
    await ensureContainer();

    // Check if a file with the same name already exists for this keyword
    const existingFiles = await getFilesByKeyword(trimmedKeyword);
    if (existingFiles.some((f) => f.fileName === file.name)) {
      return NextResponse.json(
        {
          error: `A file named "${file.name}" already exists for this keyword. Please use a different file name or keyword.`,
        },
        { status: 409 }
      );
    }

    // Get file buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to Azure Blob Storage and save metadata to MongoDB
    const newFileData = await uploadFile(
      trimmedKeyword,
      file.name,
      file.type,
      buffer,
      file.size
    ); // Files will be auto-deleted by the cleanup function that runs on a schedule
    // The expiresAt field is already set in the uploadFile function

    return NextResponse.json(
      {
        message: `File '${newFileData.fileName}' added to keyword '${trimmedKeyword}'. Files expire after 24 hours.`,
        keyword: trimmedKeyword,
        fileName: newFileData.fileName,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Upload API error:", error);
    let errorMessage = "Internal server error during upload.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
