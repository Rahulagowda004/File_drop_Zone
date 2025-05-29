// src/app/api/file/[keyword]/delete/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { uploadedFiles } from '@/lib/fileStore';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyword: string } }
) {
  const keyword = params.keyword;
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!keyword) {
    return NextResponse.json({ error: 'Keyword parameter is missing.' }, { status: 400 });
  }
  if (!fileName) {
    return NextResponse.json({ error: 'fileName query parameter is missing.' }, { status: 400 });
  }

  const filesForKeyword = uploadedFiles.get(keyword);

  if (!filesForKeyword) {
    return NextResponse.json({ error: 'Keyword not found.' }, { status: 404 });
  }

  const initialLength = filesForKeyword.length;
  const updatedFiles = filesForKeyword.filter(file => file.fileName !== fileName);

  if (updatedFiles.length === initialLength) {
    return NextResponse.json({ error: `File '${fileName}' not found under keyword '${keyword}'.` }, { status: 404 });
  }

  if (updatedFiles.length === 0) {
    // If last file is deleted, remove the keyword entry entirely
    // uploadedFiles.delete(keyword); 
    // console.log(`File '${fileName}' deleted. Keyword '${keyword}' is now empty and removed.`);
    // OR keep the keyword with an empty array:
    uploadedFiles.set(keyword, updatedFiles);
    console.log(`File '${fileName}' deleted from keyword '${keyword}'. Keyword now has no files.`);
  } else {
    uploadedFiles.set(keyword, updatedFiles);
    console.log(`File '${fileName}' deleted from keyword '${keyword}'.`);
  }

  return NextResponse.json({ message: `File '${fileName}' deleted successfully from keyword '${keyword}'.` }, { status: 200 });
}
