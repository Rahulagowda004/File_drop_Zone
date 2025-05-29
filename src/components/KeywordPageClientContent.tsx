"use client";

import { useState, useEffect } from 'react';
import type { StoredFile } from '@/lib/fileStore';
import UploadForm from '@/components/UploadForm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadCloud, AlertTriangle, FileText, CalendarClock, Package, ExternalLink, Home, UploadCloud, Trash2, Loader2 } from 'lucide-react';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface KeywordPageClientContentProps {
  initialFileData: StoredFile | null;
  keyword: string;
}

export default function KeywordPageClientContent({ initialFileData, keyword }: KeywordPageClientContentProps) {
  const [currentFile, setCurrentFile] = useState<StoredFile | null>(initialFileData);
  const [isLoadingPage, setIsLoadingPage] = useState(true); // For initial mount loading state
  const [isActionLoading, setIsActionLoading] = useState(false); // For actions like delete
  const [showUploadForm, setShowUploadForm] = useState(!initialFileData);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentFile(initialFileData);
    setShowUploadForm(!initialFileData);
    setIsLoadingPage(false); // Done with initial setup
  }, [initialFileData, keyword]);

  const handleFetchFileData = async () => {
    setIsActionLoading(true);
    try {
      // Using relative path for client-side fetch
      const res = await fetch(`/api/file/${keyword}`, { cache: 'no-store' });
      if (res.status === 404) {
        setCurrentFile(null);
        setShowUploadForm(true); 
      } else if (!res.ok) {
        const errorData = await res.json();
        toast({ title: "Error", description: errorData.error || `Failed to fetch file: ${res.statusText}`, variant: "destructive" });
        setCurrentFile(null); 
        setShowUploadForm(true);
      } else {
        const data: StoredFile = await res.json();
        setCurrentFile(data);
        setShowUploadForm(false);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || 'Failed to fetch file data.', variant: "destructive" });
      setCurrentFile(null);
      setShowUploadForm(true);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteAndPrepareUpload = async () => {
    if (!currentFile) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/file/${keyword}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to delete file: ${res.statusText}`);
      }
      toast({ title: "File Deleted", description: `"${currentFile.fileName}" removed. You can now upload a new file for keyword "${keyword}".` });
      setCurrentFile(null);
      setShowUploadForm(true);
    } catch (e: any) {
      toast({ title: "Deletion Failed", description: e.message || 'Could not delete file.', variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoadingPage) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading file information...</p>
        </div>
    );
  }

  if (showUploadForm || !currentFile) {
    return (
      <div className="max-w-2xl mx-auto py-8 md:py-12">
        <div className="text-center mb-10">
          <UploadCloud className="h-16 w-16 text-primary mx-auto mb-6" data-ai-hint="cloud upload icon"/>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
            {initialFileData && !currentFile ? `Replace File for "${keyword}"` : `Upload File for "${keyword}"`}
          </h1>
          <p className="text-lg text-foreground/80">
            {initialFileData && !currentFile ? `The previous file has been removed.` : `No file is currently associated with keyword "${keyword}".`}
            {' '}Choose a file to make it accessible.
          </p>
        </div>
        <UploadForm
          fixedKeyword={keyword}
          onUploadSuccess={() => {
            // Toast is handled by UploadForm itself
            handleFetchFileData(); 
          }}
        />
         <Button variant="outline" asChild className="w-full mt-8">
            <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Go to Homepage
            </Link>
        </Button>
      </div>
    );
  }

  const publicAccessUrl = `https://www.project.com/${currentFile.keyword}`;
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="w-full shadow-xl border-primary/20">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl text-center text-primary break-all">{currentFile.fileName}</CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80">
            Keyword: <span className="font-semibold text-primary">{currentFile.keyword}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
            <div className="flex items-center text-foreground/90 p-3 bg-muted/30 rounded-md">
                <Package className="mr-3 h-5 w-5 text-primary/80 shrink-0" />
                <span>Size: <strong>{(currentFile.size / (1024 * 1024)).toFixed(2)} MB</strong> ({currentFile.size.toLocaleString()} bytes)</span>
            </div>
            <div className="flex items-center text-foreground/90 p-3 bg-muted/30 rounded-md">
                <CalendarClock className="mr-3 h-5 w-5 text-primary/80 shrink-0" />
                <span>Uploaded: <strong>{new Date(currentFile.uploadedAt).toLocaleString()}</strong></span>
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
          <Button onClick={handleDeleteAndPrepareUpload} variant="destructive" className="w-full py-3 text-base font-semibold" disabled={isActionLoading}>
            {isActionLoading && currentFile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trash2 className="mr-2 h-5 w-5" />}
            {isActionLoading && currentFile ? 'Deleting...' : 'Delete and Replace File'}
          </Button>
           <p className="text-xs text-muted-foreground text-center mt-2">
            File access and download are handled by the backend service at the public URL.
          </p>
          <Button asChild variant="outline" className="w-full mt-2">
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
