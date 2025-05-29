// src/app/api/file/[keyword]/delete/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { deleteFile, getFilesByKeyword } from "@/lib/fileStore";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyword: string } }
) {
  // Await params to resolve the dynamic params
  const { keyword } = await params;
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is missing." },
      { status: 400 }
    );
  }
  if (!fileName) {
    return NextResponse.json(
      { error: "fileName query parameter is missing." },
      { status: 400 }
    );
  }

  try {
    const isDeleted = await deleteFile(keyword, fileName);

    if (!isDeleted) {
      return NextResponse.json(
        { error: `File '${fileName}' not found under keyword '${keyword}'.` },
        { status: 404 }
      );
    }

    // Get remaining files count
    const remainingFiles = await getFilesByKeyword(keyword);
    const remainingCount = remainingFiles ? remainingFiles.length : 0;
    
    if (remainingCount === 0) {
      console.log(`Last file removed from keyword '${keyword}'`);
    }

    return NextResponse.json(
      {
        message: `File '${fileName}' deleted successfully from keyword '${keyword}'.`,
        remainingFiles: remainingCount,
      },
      { status: 200 }
    );
}
