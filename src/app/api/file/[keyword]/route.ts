import { type NextRequest, NextResponse } from "next/server";
import { uploadedFiles, type StoredFile } from "@/lib/fileStore";

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
    // Return empty array if keyword exists but has no files, or if keyword doesn't exist.
    // Client can differentiate based on whether it expects the keyword to exist.
    // For consistency, let's return 404 if the keyword itself is not in the map.
    if (!uploadedFiles.has(keyword)) {
      return NextResponse.json(
        { error: "Keyword not found or has expired." },
        { status: 404 }
      );
    }
    return NextResponse.json([]); // Empty array if keyword exists but has no files
  }

  return NextResponse.json(filesData, { status: 200 });
}

// This route now deletes ALL files associated with the keyword.
export async function DELETE(
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

  if (uploadedFiles.has(keyword)) {
    uploadedFiles.delete(keyword);
    console.log(`All files for keyword '${keyword}' deleted successfully.`);
    return NextResponse.json(
      { message: `All files for keyword '${keyword}' deleted successfully.` },
      { status: 200 }
    );
  } else {
    return NextResponse.json({ error: "Keyword not found." }, { status: 404 });
  }
}
