import { type NextRequest, NextResponse } from "next/server";
import {
  getFilesByKeyword,
  deleteAllFiles,
  type StoredFile,
} from "@/lib/fileStore";

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
        { error: "Keyword not found or has expired." },
        { status: 404 }
      );
    }

    return NextResponse.json(filesData, { status: 200 });
  } catch (error) {
    console.error(`Error fetching files for keyword ${keyword}:`, error);
    return NextResponse.json(
      { error: "Failed to retrieve files data." },
      { status: 500 }
    );
  }
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

  try {
    const deletedCount = await deleteAllFiles(keyword);

    if (deletedCount > 0) {
      console.log(
        `All files (${deletedCount}) for keyword '${keyword}' deleted successfully.`
      );
      return NextResponse.json(
        {
          message: `All files for keyword '${keyword}' deleted successfully.`,
          count: deletedCount,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Keyword not found or has no files." },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error(`Error deleting files for keyword ${keyword}:`, error);
    return NextResponse.json(
      { error: "Failed to delete files." },
      { status: 500 }
    );
  }
}
