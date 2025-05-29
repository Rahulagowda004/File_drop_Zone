import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadCloud, AlertTriangle, FileText, CalendarClock, Package, ExternalLink, Home } from 'lucide-react';
import Link from "next/link";
import type { StoredFile } from '@/lib/fileStore';
import type { Metadata } from 'next';

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
  return 'http://localhost:9002';
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
      title: `File Not Found | File Drop Zone`,
      description: `The file for keyword '${params.keyword}' was not found or has expired.`,
    };
  }
  return {
    title: `Access "${fileData.fileName}" | File Drop Zone`,
    description: `Details for file "${fileData.fileName}" associated with keyword '${fileData.keyword}'. This file is available for a limited time.`,
  };
}

export default async function FilePage({ params }: { params: { keyword: string } }) {
  const fileData = await getFileData(params.keyword);

  if (!fileData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Card className="w-full max-w-md shadow-xl border-destructive/30">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-3xl text-destructive">File Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground/80">
              The file linked to keyword "<strong>{params.keyword}</strong>" could not be retrieved.
            </p>
            <p className="text-md text-muted-foreground mt-2">
              This could be because the keyword is incorrect, or the file has expired and been automatically deleted (after 24 hours).
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/">
                <Home className="mr-2 h-4 w-4"/>
                Go to Homepage
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/upload">Upload a New File</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Construct the public URL as described in the requirements.
  // This assumes `www.project.com` is the domain. In dev, this would be localhost.
  // For the UI, we'll show the conceptual public URL.
  const publicAccessUrl = `https://www.project.com/${fileData.keyword}`; 
  // The actual download would be handled by FastAPI at this URL, so this Next.js page only displays info.

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="w-full shadow-xl border-primary/20">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl text-center text-primary break-all">{fileData.fileName}</CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80">
            Keyword: <span className="font-semibold text-primary">{fileData.keyword}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
            <div className="flex items-center text-foreground/90 p-3 bg-muted/30 rounded-md">
                <Package className="mr-3 h-5 w-5 text-primary/80 shrink-0" />
                <span>Size: <strong>{(fileData.size / (1024 * 1024)).toFixed(2)} MB</strong> ({fileData.size.toLocaleString()} bytes)</span>
            </div>
            <div className="flex items-center text-foreground/90 p-3 bg-muted/30 rounded-md">
                <CalendarClock className="mr-3 h-5 w-5 text-primary/80 shrink-0" />
                <span>Uploaded: <strong>{new Date(fileData.uploadedAt).toLocaleString()}</strong></span>
            </div>
             <div className="flex items-center text-foreground/90 p-3 bg-muted/30 rounded-md">
                <ExternalLink className="mr-3 h-5 w-5 text-primary/80 shrink-0" />
                <span>Public Access URL: <Link href={publicAccessUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline break-all">{publicAccessUrl}</Link></span>
            </div>
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-md text-sm text-primary">
                <AlertTriangle className="inline h-4 w-4 mr-2 " />
                This file is available for 24 hours from its upload time and will be automatically deleted afterwards.
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-8">
          <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base font-semibold">
            <Link href={publicAccessUrl} target="_blank" rel="noopener noreferrer">
                <DownloadCloud className="mr-2 h-5 w-5" />
                Access File via Public URL
            </Link>
          </Button>
           <p className="text-xs text-muted-foreground text-center">
            File access and download are handled by the backend service at the public URL.
          </p>
          <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4"/>
                Back to Homepage
              </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
