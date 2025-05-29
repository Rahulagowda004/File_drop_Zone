"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import type { StoredFile } from "@/lib/fileStore";
import UploadForm from "@/components/UploadForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DownloadCloud,
  FileText,
  Trash2,
  Loader2,
  Files,
  CalendarClock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";

interface KeywordPageClientContentProps {
  initialFilesData: StoredFile[] | null;
  keyword: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function KeywordPageClientContent({
  initialFilesData,
  keyword,
}: KeywordPageClientContentProps) {
  const [currentFiles, setCurrentFiles] = useState<StoredFile[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const isMockFileDisplayed =
    currentFiles.length === 1 &&
    currentFiles[0].fileName === "sample-demonstration-file.pdf" &&
    (!initialFilesData || initialFilesData.length === 0);

  useEffect(() => {
    if (initialFilesData === null || initialFilesData.length === 0) {
      const mockDemoFile: StoredFile = {
        keyword: keyword,
        fileName: "sample-demonstration-file.pdf",
        contentType: "application/pdf",
        size: 780 * 1024,
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      };
      setCurrentFiles([mockDemoFile]);
    } else {
      setCurrentFiles(
        initialFilesData.map((file) => ({
          ...file,
          uploadedAt: new Date(file.uploadedAt),
        }))
      );
    }
    setIsLoadingPage(false);
  }, [initialFilesData, keyword]);

  const handleFetchFilesData = async () => {
    setIsActionLoading((prev) => ({ ...prev, pageRefresh: true }));
    try {
      const res = await fetch("/api/file/" + keyword, { cache: "no-store" });
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Failed to fetch files: " + res.statusText }));
        if (res.status === 404) {
          setCurrentFiles([]);
        } else {
          toast({
            title: "Error",
            description:
              errorData.error || "Failed to fetch files: " + res.statusText,
            variant: "destructive",
          });
          setCurrentFiles([]);
        }
      } else {
        const data: StoredFile[] = await res.json();
        setCurrentFiles(
          data.map((file) => ({
            ...file,
            uploadedAt: new Date(file.uploadedAt),
          }))
        );
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to fetch files data.",
        variant: "destructive",
      });
      setCurrentFiles([]);
    } finally {
      setIsActionLoading((prev) => ({ ...prev, pageRefresh: false }));
    }
  };
  const handleDeleteSingleFile = async (fileNameToDelete: string) => {
    setIsActionLoading((prev) => ({ ...prev, [fileNameToDelete]: true }));
    try {
      if (
        fileNameToDelete === "sample-demonstration-file.pdf" &&
        isMockFileDisplayed
      ) {
        setCurrentFiles([]);
        toast({
          title: "Sample Cleared",
          description: "Sample demonstration file removed from view.",
        });
        return;
      }

      console.log(`Deleting file: ${keyword}/${fileNameToDelete}`);
      const deleteUrl = `/api/file/${keyword}/delete?fileName=${encodeURIComponent(
        fileNameToDelete
      )}`;
      console.log(`Delete URL: ${deleteUrl}`);

      const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(
          result.error ||
            `Failed to delete file: ${res.status} ${res.statusText}`
        );
      }

      toast({
        title: "File Deleted",
        description: `"${fileNameToDelete}" removed from keyword "${keyword}".`,
      });
      await handleFetchFilesData();
    } catch (e: any) {
      console.error("Delete file error:", e);
      toast({
        title: "Deletion Failed",
        description: e.message || "Could not delete file.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [fileNameToDelete]: false }));
    }
  };

  const handleDeleteAllFiles = async () => {
    setIsActionLoading((prev) => ({ ...prev, deleteAll: true }));
    try {
      if (
        isMockFileDisplayed &&
        (!initialFilesData || initialFilesData.length === 0)
      ) {
        setCurrentFiles([]);
        toast({
          title: "Sample Cleared",
          description: "Sample demonstration file(s) removed from view.",
        });
        return;
      }

      const res = await fetch(`/api/file/${keyword}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(
          result.error || "Failed to delete all files: " + res.statusText
        );
      }
      toast({
        title: "All Files Deleted",
        description: `All files for keyword "${keyword}" have been removed.`,
      });
      setCurrentFiles([]);
    } catch (e: any) {
      toast({
        title: "Deletion Failed",
        description: e.message || "Could not delete all files.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading((prev) => ({ ...prev, deleteAll: false }));
    }
  };

  const handleDownloadAllFiles = () => {
    if (
      isMockFileDisplayed &&
      (!initialFilesData || initialFilesData.length === 0)
    ) {
      toast({
        title: "Sample Files",
        description:
          "This is a sample demonstration. For actual files, a ZIP download would be initiated.",
        variant: "default",
      });
      return;
    }
    if (currentFiles.length === 0) {
      toast({
        title: "No Files",
        description: "There are no files to download for this keyword.",
        variant: "default",
      });
      return;
    }
    setIsActionLoading((prev) => ({ ...prev, downloadAll: true }));

    window.open(`/api/download/all/${keyword}`, "_blank");
    setTimeout(() => {
      setIsActionLoading((prev) => ({ ...prev, downloadAll: false }));
      toast({
        title: "Download Initiated",
        description: `Preparing a ZIP archive for all files under keyword "${keyword}". Your browser will prompt you shortly.`,
      });
    }, 1500);
  };
  const getDownloadUrl = (fileName: string) => {
    if (fileName === "sample-demonstration-file.pdf" && isMockFileDisplayed) {
      return "#";
    }
    return `/api/download/${keyword}/${encodeURIComponent(fileName)}`;
  };

  return (
    <TooltipProvider>
      <div className="py-6 md:py-8 px-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3 sm:gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            Folder: {keyword}
          </h1>
          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAllFiles}
              disabled={
                isActionLoading["downloadAll"] ||
                currentFiles.length === 0 ||
                (isMockFileDisplayed &&
                  (!initialFilesData || initialFilesData.length === 0))
              }
              className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/10"
            >
              {isActionLoading["downloadAll"] ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DownloadCloud className="mr-2 h-4 w-4" />
              )}
              Download All
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    isActionLoading["deleteAll"] ||
                    currentFiles.length === 0 ||
                    (isMockFileDisplayed &&
                      (!initialFilesData || initialFilesData.length === 0))
                  }
                  className="flex-1 sm:flex-none border-destructive text-destructive hover:bg-destructive/10"
                >
                  {isActionLoading["deleteAll"] ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete all{" "}
                    {currentFiles.length} file(s) for keyword "{keyword}".
                    {isMockFileDisplayed &&
                    currentFiles[0]?.fileName ===
                      "sample-demonstration-file.pdf"
                      ? " This will clear the sample file from view."
                      : " This cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllFiles}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, delete all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row gap-6 md:gap-8">
          <div className="md:w-1/2 lg:w-2/5">
            <Card className="shadow-md border-primary/10 rounded-lg bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl font-semibold text-primary">
                  Upload File(s)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-4 sm:p-6">
                <UploadForm
                  fixedKeyword={keyword}
                  onUploadSuccess={async (uploadedKeyword, summary) => {
                    toast({
                      title: "Upload Processed",
                      description: `${summary}. Refreshing list...`,
                    });
                    await handleFetchFilesData();
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="md:w-1/2 lg:w-3/5">
            {isLoadingPage || isActionLoading["pageRefresh"] ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-3 shadow-sm bg-card rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3 flex-grow min-w-0">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Skeleton className="h-8 w-20 rounded-md" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : currentFiles && currentFiles.length > 0 ? (
              <div className="space-y-2 max-h-[calc(100vh-320px)] md:max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {currentFiles.map((file) => (
                  <Card
                    key={file.fileName}
                    className="shadow-sm hover:shadow-md transition-shadow duration-150 bg-card rounded-lg"
                  >
                    <CardContent className="p-2 sm:p-3 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
                      <div className="flex-grow min-w-0 mr-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 sm:mr-3 text-primary shrink-0" />
                              <p className="text-sm font-medium text-foreground truncate">
                                {file.fileName}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start">
                            <p>{file.fileName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0 flex-shrink-0 w-full sm:w-auto">
                        <Tooltip>
                          {" "}
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              onClick={() => {
                                if (
                                  file.fileName ===
                                    "sample-demonstration-file.pdf" &&
                                  isMockFileDisplayed
                                ) {
                                  toast({
                                    title: "Sample File",
                                    description:
                                      "This is a sample file. Actual download occurs for real files.",
                                  });
                                } else {
                                  console.log(
                                    `Downloading file: ${file.fileName}`
                                  );
                                  const downloadUrl = getDownloadUrl(
                                    file.fileName
                                  );
                                  console.log(`Download URL: ${downloadUrl}`);
                                  window.open(downloadUrl, "_blank");
                                  toast({
                                    title: "Download Started",
                                    description: `Downloading "${file.fileName}"`,
                                  });
                                }
                              }}
                            >
                              <div className="flex items-center">
                                <DownloadCloud className="h-4 w-4 sm:mr-1.5" />
                                <span className="hidden sm:inline">
                                  Download
                                </span>
                              </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Download {file.fileName}
                          </TooltipContent>
                        </Tooltip>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isActionLoading[file.fileName]}
                                  className="flex-1 sm:flex-none text-destructive border-destructive hover:bg-destructive/10"
                                >
                                  {isActionLoading[file.fileName] ? (
                                    <Loader2 className="h-4 w-4 animate-spin sm:mr-1.5" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 sm:mr-1.5" />
                                  )}
                                  <span className="hidden sm:inline">
                                    Delete
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                Delete {file.fileName}
                              </TooltipContent>
                            </Tooltip>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete "{file.fileName}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will permanently delete the file "
                                {file.fileName}" for keyword "{keyword}".
                                {file.fileName ===
                                  "sample-demonstration-file.pdf" &&
                                  isMockFileDisplayed &&
                                  " This is a sample file; deleting it here will remove it from the view. Real files require backend deletion."}
                                This cannot be undone for real files.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteSingleFile(file.fileName)
                                }
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Yes, delete file
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm bg-card rounded-lg">
                <CardContent className="p-6 text-center">
                  <Files className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No files found in this folder.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the upload section to add files.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
