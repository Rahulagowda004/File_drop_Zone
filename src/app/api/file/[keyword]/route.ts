import { type NextRequest, NextResponse } from 'next/server';
import { uploadedFiles, type StoredFile } from '@/lib/fileStore';

export async function GET(
  request: NextRequest,
  { params }: { params: { keyword: string } }
) {
  const keyword = params.keyword;

  if (!keyword) {
    return NextResponse.json({ error: 'Keyword parameter is missing.' }, { status: 400 });
  }

  const fileData = uploadedFiles.get(keyword);

  if (!fileData) {
    return NextResponse.json({ error: 'File not found or has expired.' }, { status: 404 });
  }

  // Return only the metadata. Actual file serving is responsibility of FastAPI backend.
  return NextResponse.json(fileData, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyword: string } }
) {
  const keyword = params.keyword;

  if (!keyword) {
    return NextResponse.json({ error: 'Keyword parameter is missing.' }, { status: 400 });
  }

  if (uploadedFiles.has(keyword)) {
    uploadedFiles.delete(keyword);
    // In a real app, also delete from actual storage (e.g., S3, Firebase Storage)
    console.log(`File metadata for keyword '${keyword}' (and mock file) deleted successfully.`);
    return NextResponse.json({ message: 'File deleted successfully.' }, { status: 200 });
  } else {
    // It's okay if the file is already gone (e.g. due to timeout or previous delete)
    // but for a direct delete action, client might expect it to exist.
    // However, to make "Delete and Replace" robust, we can return 200 even if not found.
    // Or return 404 to indicate it wasn't there to begin with. Let's stick with 404 for clarity.
    return NextResponse.json({ error: 'File not found for the given keyword.' }, { status: 404 });
  }
}
