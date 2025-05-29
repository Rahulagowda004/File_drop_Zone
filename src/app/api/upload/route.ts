import { type NextRequest, NextResponse } from 'next/server';
import { uploadedFiles, type StoredFile } from '@/lib/fileStore';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const keyword = formData.get('keyword') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!keyword || keyword.trim() === '') {
      return NextResponse.json({ error: 'No keyword provided.' }, { status: 400 });
    }
    
    const trimmedKeyword = keyword.trim();

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKeyword)) {
        return NextResponse.json({ error: 'Invalid keyword format. Use letters, numbers, underscores, and hyphens only.' }, { status: 400 });
    }
    
    if (trimmedKeyword.length < 3 || trimmedKeyword.length > 50) {
        return NextResponse.json({ error: 'Keyword must be between 3 and 50 characters.' }, { status: 400 });
    }

    const MAX_FILE_SIZE_API = 10 * 1024 * 1024; // 10MB, should match frontend
    if (file.size > MAX_FILE_SIZE_API) {
      return NextResponse.json({ error: `File is too large. Max size is ${MAX_FILE_SIZE_API / (1024*1024)}MB.` }, { status: 413 });
    }

    const newFileData: StoredFile = {
      keyword: trimmedKeyword,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date(),
    };

    let keywordExisted = uploadedFiles.has(trimmedKeyword);
    let filesForKeyword = uploadedFiles.get(trimmedKeyword) || [];

    // Check if a file with the same name already exists for this keyword
    if (filesForKeyword.some(f => f.fileName === newFileData.fileName)) {
      return NextResponse.json({ error: `A file named "${newFileData.fileName}" already exists for this keyword. Please use a different file name or keyword.` }, { status: 409 });
    }

    filesForKeyword.push(newFileData);
    uploadedFiles.set(trimmedKeyword, filesForKeyword);

    // Set timeout for keyword deletion only if it's a new keyword
    if (!keywordExisted) {
      setTimeout(() => {
        uploadedFiles.delete(trimmedKeyword);
        console.log(`Mock Deletion: All files for keyword '${trimmedKeyword}' automatically deleted after 24 hours.`);
      }, 24 * 60 * 60 * 1000); // 24 hours
    }

    return NextResponse.json({ 
      message: `File '${newFileData.fileName}' added to keyword '${trimmedKeyword}'. Keyword active for 24 hours from first upload.`, 
      keyword: trimmedKeyword, 
      fileName: newFileData.fileName 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload API error:', error);
    let errorMessage = 'Internal server error during upload.';
    if (error instanceof Error) {
       errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
