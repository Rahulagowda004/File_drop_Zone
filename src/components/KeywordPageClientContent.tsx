
"use client";

import { useState, useEffect } from 'react';
import type { StoredFile } from '@/lib/fileStore';
import UploadForm from '@/components/UploadForm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DownloadCloud, AlertTriangle, FileText, CalendarClock, Package, Home, UploadCloud, Trash2, Loader2, Files, ShieldAlert } from 'lucide-react';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface KeywordPageClientContentProps {
  initialFilesData: StoredFile[] | null;
  keyword: string;
}

export default function KeywordPageClientContent({ initialFilesData, keyword }: KeywordPageClientContentProps) {
  const [currentFiles, setCurrentFiles] = useState<StoredFile[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);
  
  useEffect(() => {
    if (initialFilesData === null || initialFilesData.length === 0) {
      const mockDemoFile: StoredFile = {
        keyword: keyword,
        fileName: 'sample-demonstration-file.pdf',
        contentType: 'application/pdf',
        size: 780 * 1024, // 780KB
        uploadedAt: new Date(),
      };
      setCurrentFiles([mockDemoFile]);
    } else {
      setCurrentFiles(initialFilesData);
    }
    setIsLoadingPage(false);
  }, [initialFilesData, keyword]);

  const handleFetchFilesData = async () => {
    setIsActionLoading(prev => ({ ...prev, pageRefresh: true }));
    try {
      const res = await fetch(`/api/file/${keyword}`, { cache: 'no-store' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Failed to fetch files: ${res.statusText}` }));
        if (res.status === 404) {
             setCurrentFiles([]); 
        } else {
            toast({ title: "Error", description: errorData.error || `Failed to fetch files: ${res.statusText}`, variant: "destructive" });
            setCurrentFiles([]); 
        }
      } else {
        const data: StoredFile[] = await res.json();
        setCurrentFiles(data);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || 'Failed to fetch files data.', variant: "destructive" });
      setCurrentFiles([]); 
    } finally {
      setIsActionLoading(prev => ({ ...prev, pageRefresh: false }));
    }
  };

  const handleDeleteSingleFile = async (fileNameToDelete: string) => {
    setIsActionLoading(prev => ({ ...prev, [fileNameToDelete]: true }));
    try {
      // If it's the mock file, just remove it from the local state
      if (fileNameToDelete === 'sample-demonstration-file.pdf' && (initialFilesData === null || initialFilesData.length === 0)) {
        setCurrentFiles([]);
        toast({ title: "Sample Cleared", description: "Sample demonstration file removed from view." });
        return;
      }

      const res = await fetch(`/api/file/${keyword}/delete?fileName=${encodeURIComponent(fileNameToDelete)}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || `Failed to delete file: ${res.statusText}`);
      }
      toast({ title: "File Deleted", description: `"${fileNameToDelete}" removed from keyword "${keyword}".` });
      await handleFetchFilesData(); 
    } catch (e: any) {
      toast({ title: "Deletion Failed", description: e.message || 'Could not delete file.', variant: "destructive" });
    } finally {
      setIsActionLoading(prev => ({ ...prev, [fileNameToDelete]: false }));
    }
  };

  const handleDeleteAllFiles = async () => {
    setIsActionLoading(prev => ({ ...prev, deleteAll: true }));
    try {
      const res = await fetch(`/api/file/${keyword}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || `Failed to delete all files: ${res.statusText}`);
      }
      toast({ title: "All Files Deleted", description: `All files for keyword "${keyword}" have been removed.` });
      setCurrentFiles([]);
    } catch (e: any) {
      toast({ title: "Deletion Failed", description: e.message || 'Could not delete all files.', variant: "destructive" });
    } finally {
      setIsActionLoading(prev => ({ ...prev, deleteAll: false }));
    }
  };

  const handleDownloadAllFiles = () => {
    toast({
      title: "Conceptual Download",
      description: "Downloading all files as a single archive is a conceptual feature. Actual implementation would require backend support for zipping files.",
    });
  };

  if (isLoadingPage || isActionLoading['pageRefresh']) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading files information...</p>
      </div>
    );
  }

  const getConceptualDownloadUrl = (fileName: string) => `${baseUrl}/api/download/${keyword}/${encodeURIComponent(fileName)}`;
  const isMockFileDisplayed = currentFiles.length === 1 && currentFiles[0].fileName === 'sample-demonstration-file.pdf' && (initialFilesData === null || initialFilesData.length === 0);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-10">
          <Files className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            Files for Keyword: <span className="text-accent">{keyword}</span>
          </h1>
          <p className="text-md text-muted-foreground">
            Manage and upload files associated with this keyword. Files are auto-deleted after 24 hours from the keyword's first upload.
          </p>
      </div>

      {currentFiles && currentFiles.length > 0 ? (
        <Card className="mb-8 shadow-xl border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl text-primary">
                Stored Files ({currentFiles.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadAllFiles}
                  disabled={isActionLoading['downloadAll'] || currentFiles.length === 0 || isMockFileDisplayed}
                >
                  {isActionLoading['downloadAll'] ? <Loader2 className="animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                  Download All
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      disabled={isActionLoading['deleteAll'] || currentFiles.length === 0 || isMockFileDisplayed }
                    >
                      {isActionLoading['deleteAll'] ? <Loader2 className="animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete all {currentFiles.length} file(s) for keyword "{keyword}". This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllFiles} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete all
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <CardDescription className="mt-2">
              Below are the files currently associated with the keyword "{keyword}".
              {isMockFileDisplayed && (
                <span className="block text-xs text-amber-600 mt-1"> (This is a sample file for demonstration purposes as no real files were found for this keyword.)</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentFiles.map((file) => (
              <Card key={file.fileName} className="p-4 border-border hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-semibold text-primary break-all flex items-center">
                      <FileText className="h-5 w-5 mr-2 shrink-0" /> {file.fileName}
                    </h3>
                    <div className="text-xs text-muted-foreground space-x-3 mt-1">
                      <span><Package size={14} className="inline mr-1" /> {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span><CalendarClock size={14} className="inline mr-1" /> {new Date(file.uploadedAt).toLocaleString()}</span>
                    </div>
                     <p className="text-xs text-muted-foreground mt-1 break-all">
                        Conceptual Download: <Link href={getConceptualDownloadUrl(file.fileName)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{getConceptualDownloadUrl(file.fileName)}</Link>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 sm:flex-col md:flex-row items-stretch">
                    <Button asChild variant="outline" size="sm" className="flex-grow sm:flex-grow-0">
                      <Link href={getConceptualDownloadUrl(file.fileName)} target="_blank" rel="noopener noreferrer">
                        <DownloadCloud className="h-4 w-4" /> <span className="ml-2 hidden sm:inline">Download</span>
                      </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm" disabled={isActionLoading[file.fileName]} className="flex-grow sm:flex-grow-0">
                                {isActionLoading[file.fileName] ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                <span className="ml-2 hidden sm:inline">Delete</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{file.fileName}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action will permanently delete the file "{file.fileName}" for keyword "{keyword}".
                            {file.fileName === 'sample-demonstration-file.pdf' && isMockFileDisplayed && " This is a sample file; deleting it here will remove it from the view. Real files require backend deletion."}
                            This cannot be undone for real files.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSingleFile(file.fileName)} className="bg-destructive hover:bg-destructive/90">
                                Yes, delete file
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
             <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-md text-sm text-primary flex items-start">
                <ShieldAlert className="inline h-4 w-4 mr-2 shrink-0 mt-0.5" />
                <span>File access and download are notionally handled by a backend service at the conceptual URLs. Files under this keyword are auto-deleted after 24 hours from the keyword's first upload.</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full shadow-lg border-primary/20 mb-8">
            <CardHeader>
                <CardTitle className="text-center text-xl text-primary">No Files for "{keyword}"</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">
                    There are currently no files associated with this keyword.
                    You can upload files using the form below.
                </p>
            </CardContent>
         </Card>
      )}

      <Card className="shadow-xl border-accent/20">
        <CardHeader>
            <CardTitle className="text-2xl text-accent flex items-center">
                <UploadCloud className="mr-3 h-7 w-7" /> Add File(s) to "{keyword}"
            </CardTitle>
            <CardDescription>
                Upload new files to associate with this keyword. Ensure file names are unique for this keyword.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <UploadForm
              fixedKeyword={keyword}
              onUploadSuccess={async (uploadedKeyword, uploadedFileNamesSummary) => {
                  toast({ title: "Upload Processed", description: `${uploadedFileNamesSummary} for keyword '${uploadedKeyword}'. Refreshing list...` });
                  await handleFetchFilesData(); 
              }}
            />
        </CardContent>
      </Card>

      <Button variant="outline" asChild className="w-full mt-8">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" /> Go to Homepage
        </Link>
      </Button>
    </div>
  );
}
