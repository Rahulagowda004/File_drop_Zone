// src/app/api/download/[keyword]/[fileName]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getFileDownloadUrl } from "@/lib/fileStore";

export async function GET(
  request: NextRequest,
  { params }: { params: { keyword: string; fileName: string } }
) {
  // Await params to resolve the dynamic params
  const { keyword, fileName } = await params;

  if (!keyword || !fileName) {
    return NextResponse.json(
      { error: "Keyword and fileName parameters are required." },
      { status: 400 }
    );
  }

  try {
    // Get a temporary download URL for the file
    const downloadUrl = await getFileDownloadUrl(keyword, fileName);

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "File not found or has expired." },
        { status: 404 }
      );
    }

    // Redirect to the download URL
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error(
      `Error generating download URL for ${keyword}/${fileName}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to generate download URL." },
      { status: 500 }
    );
  }
}
