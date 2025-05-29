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

    if (uploadedFiles.has(trimmedKeyword)) {
      return NextResponse.json({ error: 'Keyword already in use. Please choose another.' }, { status: 409 });
    }

    const MAX_FILE_SIZE_API = 10 * 1024 * 1024; // 10MB, should match frontend
    if (file.size > MAX_FILE_SIZE_API) {
      return NextResponse.json({ error: `File is too large. Max size is ${MAX_FILE_SIZE_API / (1024*1024)}MB.` }, { status: 413 });
    }

    const fileData: StoredFile = {
      keyword: trimmedKeyword,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date(),
    };
    uploadedFiles.set(trimmedKeyword, fileData);

    // Simulate automatic deletion. In a real app, this would be a cron job or queue worker.
    setTimeout(() => {
      uploadedFiles.delete(trimmedKeyword);
      console.log(`Mock Deletion: Metadata for keyword '${trimmedKeyword}' (file: ${file.name}) automatically deleted after 24 hours.`);
    }, 24 * 60 * 60 * 1000); // 24 hours

    return NextResponse.json({ 
      message: 'File metadata stored successfully. File will be available for 24 hours.', 
      keyword: trimmedKeyword, 
      fileName: file.name 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload API error:', error);
    // Check if it's a known error type or provide a generic message
    let errorMessage = 'Internal server error during upload.';
    if (error instanceof Error) {
      // Potentially more specific errors could be caught here if thrown by formData parsing, etc.
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
