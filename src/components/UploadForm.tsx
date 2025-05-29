
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { UploadCloud, Link2, Loader2, AlertTriangle, FileText, Paperclip } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  keyword: z.string()
    .min(3, "Keyword must be at least 3 characters.")
    .max(50, "Keyword must be at most 50 characters.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Keyword can only contain letters, numbers, underscores, and hyphens."),
  file: z.custom<FileList>(
      (val) => typeof FileList !== 'undefined' && val instanceof FileList,
      "Input must be a FileList."
    )
    .refine((files) => files && files.length > 0, "At least one file is required.")
    .refine(
      (files) => files && Array.from(files).every(file => file.size <= MAX_FILE_SIZE),
      `Max file size for each file is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
    ),
});

type FormData = z.infer<typeof formSchema>;

interface UploadFormProps {
  fixedKeyword?: string;
  onUploadSuccess?: (uploadedKeyword: string, uploadedFileNamesSummary: string) => void;
}

export default function UploadForm({ fixedKeyword, onUploadSuccess }: UploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileLink, setUploadedFileLink] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<{success: string[], failed: {name: string, error: string}[] } | null>(null);
  const [origin, setOrigin] = useState('');
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: fixedKeyword || '',
      // Initialize 'file' with an empty FileList on the client-side, undefined on SSR
      file: typeof window !== 'undefined' ? new DataTransfer().files : undefined,
    }
  });

  const selectedFileList = watch('file');
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setValue('file', files, { shouldValidate: true }); // RHF updates and validates
      // setSelectedFileNames will be updated by the useEffect watching selectedFileList
    } else {
      // Set to an empty FileList if no files are selected or selection is cleared
      setValue('file', new DataTransfer().files, { shouldValidate: true }); // RHF updates and validates
      // setSelectedFileNames will be updated by the useEffect watching selectedFileList
    }
    // Explicit trigger('file') removed as shouldValidate:true in setValue should handle it
  };
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (fixedKeyword) {
      setValue('keyword', fixedKeyword, { shouldValidate: true });
    }
  }, [fixedKeyword, setValue]);

  // Update selectedFileNames display when the 'file' field in react-hook-form changes
  useEffect(() => {
    if (selectedFileList) {
      setSelectedFileNames(Array.from(selectedFileList).map(f => f.name));
    } else {
      setSelectedFileNames([]);
    }
  }, [selectedFileList]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setUploadedFileLink(null);
    setUploadSummary(null);

    if (!data.file || data.file.length === 0) {
      // This check is redundant if Zod validation is working, but good as a fallback.
      toast({ title: "No Files Selected", description: "Please select one or more files to upload.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const filesToUpload = Array.from(data.file);
    const keywordToSubmit = fixedKeyword || data.keyword;
    
    let successfulUploads: string[] = [];
    let failedUploads: {name: string, error: string}[] = [];

    for (const fileItem of filesToUpload) {
      const formDataPayload = new FormData();
      formDataPayload.append('keyword', keywordToSubmit);
      formDataPayload.append('file', fileItem);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataPayload,
        });
        const result = await response.json();

        if (!response.ok) {
          failedUploads.push({ name: fileItem.name, error: result.error || `Upload failed for ${fileItem.name}. Status: ${response.status}` });
        } else {
          successfulUploads.push(fileItem.name);
        }
      } catch (error: any) {
        failedUploads.push({ name: fileItem.name, error: error.message || `An unexpected error occurred for ${fileItem.name}.` });
      }
    }
    
    setIsLoading(false);
    // Reset form: also reset the 'file' field to an empty FileList for client consistency
    reset({ keyword: fixedKeyword || '', file: typeof window !== 'undefined' ? new DataTransfer().files : undefined }); 
    // selectedFileNames will be cleared by the useEffect watching selectedFileList after reset

    if (onUploadSuccess) {
      if (successfulUploads.length > 0) {
        onUploadSuccess(keywordToSubmit, `${successfulUploads.length} file(s) including "${successfulUploads[0]}" processed.`);
      } else if (filesToUpload.length > 0 && failedUploads.length === filesToUpload.length) {
        toast({
            title: "All Uploads Failed",
            description: `Could not upload any files. First failure: ${failedUploads[0]?.name} - ${failedUploads[0]?.error || 'Unknown error'}`,
            variant: "destructive",
        });
      } else if (failedUploads.length > 0) { // Partial failure
         toast({
              title: "Partial Upload Success",
              description: `${successfulUploads.length} file(s) uploaded. ${failedUploads.length} file(s) failed. First failure: ${failedUploads[0].name} - ${failedUploads[0].error}`,
              variant: "default", 
          });
      }
    } else { // Standalone upload page logic
      setUploadSummary({ success: successfulUploads, failed: failedUploads });
      if (successfulUploads.length > 0) {
        setUploadedFileLink(`/${keywordToSubmit}`);
         toast({
          title: successfulUploads.length === filesToUpload.length ? "All Uploads Successful!" : "Uploads Processed",
          description: `${successfulUploads.length} file(s) uploaded to keyword '${keywordToSubmit}'. ${failedUploads.length > 0 ? `${failedUploads.length} file(s) failed.` : ''}`,
          variant: failedUploads.length > 0 ? "default" : "default",
        });
      } else if (filesToUpload.length > 0) { 
         toast({
          title: "All Uploads Failed",
          description: `Could not upload any files. First failure: ${failedUploads[0]?.name} - ${failedUploads[0]?.error || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        {!fixedKeyword && (
          <div className="space-y-2">
            <Label htmlFor="keyword-uploadform" className="font-semibold">Unique Keyword</Label>
            <Input 
              id="keyword-uploadform" 
              {...register('keyword')} 
              placeholder="e.g., project-alpha-files"
              className={`${errors.keyword ? 'border-destructive focus:ring-destructive' : 'focus:ring-primary'}`}
              aria-invalid={errors.keyword ? "true" : "false"}
            />
            {errors.keyword && <p className="text-sm text-destructive">{errors.keyword.message}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="file-uploadform-trigger" className="font-semibold">Files</Label>
          <Label 
            htmlFor="file-uploadform-trigger" 
            className={`
              flex flex-col items-center justify-center w-full h-32 px-4 
              border-2 border-dashed rounded-lg cursor-pointer 
              bg-card hover:bg-muted/75 transition-colors
              ${errors.file ? 'border-destructive hover:border-destructive/75' : 'border-input hover:border-primary/50'}
            `}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className={`w-8 h-8 mb-3 ${errors.file ? 'text-destructive' : 'text-primary'}`} />
              <p className={`mb-2 text-sm ${errors.file ? 'text-destructive' : 'text-muted-foreground'}`}>
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground/80">Max 10MB per file</p>
            </div>
            {/* We use register for RHF to be aware of the field, but handle change manually for UI updates */}
            <Input 
              id="file-uploadform-trigger" 
              type="file"
              multiple
              className="sr-only" 
              {...register('file')} // Register the field with RHF
              onChange={handleFileChange} // Use custom onChange to call setValue and update UI state
              aria-invalid={errors.file ? "true" : "false"}
            />
          </Label>
          {errors.file && <p className="text-sm text-destructive">{errors.file.message}</p>}
          
          {selectedFileNames.length > 0 && (
            <div className="mt-3 p-3 bg-muted/20 border border-border rounded-md text-sm">
              <p className="font-medium mb-2 text-foreground">Selected files ({selectedFileNames.length}):</p>
              <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto text-muted-foreground">
                {selectedFileNames.map((name, index) => (
                  <li key={index} className="truncate flex items-center">
                    <Paperclip className="h-4 w-4 mr-2 shrink-0 text-primary/80" /> 
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Display summary for standalone upload page */}
        {!onUploadSuccess && uploadSummary && (uploadSummary.success.length > 0 || uploadSummary.failed.length > 0) && origin && (
          <div className={`p-4 border rounded-md space-y-3 ${uploadSummary.failed.length > 0 && uploadSummary.success.length === 0 ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-accent/10 border-accent text-accent-foreground'}`}>
            <div className="flex items-start gap-3">
              {uploadSummary.success.length > 0 && <Link2 className={`h-5 w-5 ${uploadSummary.failed.length > 0 ? 'text-accent' : 'text-accent'} shrink-0 mt-1`} />}
              {uploadSummary.failed.length > 0 && uploadSummary.success.length === 0 && <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-1" />}
              <div>
                <p className={`font-medium ${uploadSummary.failed.length > 0 && uploadSummary.success.length === 0 ? 'text-destructive' : 'text-accent'}`}>
                  {uploadSummary.success.length > 0 ? 
                    `${uploadSummary.success.length} file(s) processed for keyword! ${uploadSummary.failed.length > 0 ? `(${uploadSummary.failed.length} failed)` : ''} Access keyword page:` :
                    "Uploads Processed"}
                </p>
                {uploadSummary.success.length > 0 && uploadedFileLink && (
                  <Link href={uploadedFileLink} target="_blank" rel="noopener noreferrer" className={`${uploadSummary.failed.length > 0 ? 'text-accent hover:underline' : 'text-accent hover:underline'} font-semibold break-all`}>
                    {`${origin}${uploadedFileLink}`}
                  </Link>
                )}
              </div>
            </div>
            {uploadSummary.failed.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive mt-2">
                <div className="flex items-center gap-2 font-semibold mb-1">
                   <AlertTriangle size={16} /> 
                   <p>{uploadSummary.failed.length} file(s) failed to upload:</p>
                </div>
                <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                  {uploadSummary.failed.map(f => <li key={f.name}><strong>{f.name}:</strong> {f.error}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-8">
        <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-5 w-5" />
          )}
          {isLoading ? 'Uploading...' : (fixedKeyword ? 'Upload File(s)' : 'Upload & Share File(s)')}
        </Button>
      </div>
    </form>
  );
}
    

    