import { type NextRequest, NextResponse } from 'next/server';
import { uploadedFiles } from '@/lib/fileStore';

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
