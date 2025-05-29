import type { StoredFile } from '@/lib/fileStore';
import type { Metadata } from 'next';
import KeywordPageClientContent from '@/components/KeywordPageClientContent';

// Helper function to get base URL for server-side fetch
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // For Vercel deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Default for local development
  return 'http://localhost:9002'; // Ensure this matches your dev port
}

async function getFileData(keyword: string): Promise<StoredFile | null> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/file/${keyword}`, {
      cache: 'no-store', 
    });
    if (!res.ok) {
      if (res.status === 404) console.log(`File data not found for keyword: ${keyword}`);
      else console.error(`Error fetching file data for ${keyword}: ${res.status} ${res.statusText}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`Network or other error fetching file data for ${keyword}:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { keyword: string } }): Promise<Metadata> {
  const fileData = await getFileData(params.keyword);
  if (!fileData) {
    return {
      title: `Upload for "${params.keyword}" | File Drop Zone`,
      description: `No file found for keyword '${params.keyword}'. You can upload a file for this keyword.`,
    };
  }
  return {
    title: `Access "${fileData.fileName}" for keyword "${params.keyword}" | File Drop Zone`,
    description: `Details for file "${fileData.fileName}" associated with keyword '${fileData.keyword}'. This file is available for a limited time.`,
  };
}

export default async function KeywordPage({ params }: { params: { keyword: string } }) {
  const fileData = await getFileData(params.keyword);
  const keyword = params.keyword;

  return <KeywordPageClientContent initialFileData={fileData} keyword={keyword} />;
}
