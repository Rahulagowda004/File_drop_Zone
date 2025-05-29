import type { StoredFile } from "@/lib/fileStore";
import type { Metadata } from "next";
import KeywordPageClientContent from "@/components/KeywordPageClientContent";
import { getFilesByKeyword } from "@/lib/fileStore";

// Helper function to get base URL for server-side fetch
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:9002"; // Ensure this matches your dev port
}

// This function now directly uses our MongoDB database to get files
async function getFilesData(keyword: string): Promise<StoredFile[] | null> {
  try {
    if (!keyword || keyword.trim() === "") {
      return null;
    }

    const keywordLower = keyword.trim().toLowerCase();
    const filesData = await getFilesByKeyword(keywordLower);

    // If no files found, return null to indicate keyword not found or empty
    if (!filesData || filesData.length === 0) {
      console.log(`No files found for keyword: ${keywordLower}`);
      return null;
    }

    return filesData;
  } catch (error) {
    console.error(`Error fetching files data for ${keyword}:`, error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { keyword: string };
}): Promise<Metadata> {
  // Await params to resolve the dynamic params
  const { keyword } = await params;
  const filesData = await getFilesData(keyword);

  if (!filesData || filesData.length === 0) {
    return {
      title: `Upload to "${keyword}" | File Drop Zone`,
      description: `No files found for keyword '${keyword}'. You can upload files for this keyword.`,
    };
  }
  return {
    title: `Files for "${keyword}" (${filesData.length}) | File Drop Zone`,
    description: `Access ${filesData.length} file(s) associated with keyword '${keyword}'. Files are available for a limited time.`,
  };
}

export default async function KeywordPage({
  params,
}: {
  params: { keyword: string };
}) {
  // Await params to resolve the dynamic params
  const { keyword } = await params;
  const filesData = await getFilesData(keyword);

  // If filesData is null, it means the keyword itself wasn't found or an error occurred.
  // If filesData is an empty array, the keyword exists but has no files.
  // KeywordPageClientContent will handle both cases.
  return (
    <KeywordPageClientContent initialFilesData={filesData} keyword={keyword} />
  );
}
