"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { UploadCloud, Link2, Loader2 } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  keyword: z.string()
    .min(3, "Keyword must be at least 3 characters.")
    .max(50, "Keyword must be at most 50 characters.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Keyword can only contain letters, numbers, underscores, and hyphens."),
  file: z.custom<FileList>()
    .refine((files) => files && files.length === 1, "File is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is ${MAX_FILE_SIZE / (1024*1024)}MB.`)
});

type FormData = z.infer<typeof formSchema>;

interface UploadFormProps {
  fixedKeyword?: string;
  onUploadSuccess?: (uploadedKeyword: string, uploadedFileName: string) => void;
}

export default function UploadForm({ fixedKeyword, onUploadSuccess }: UploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileLink, setUploadedFileLink] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, setError } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: fixedKeyword || '',
      file: undefined,
    }
  });

  const selectedFile = watch('file');

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

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setUploadedFileLink(null);

    const formDataPayload = new FormData();
    const keywordToSubmit = fixedKeyword || data.keyword;
    formDataPayload.append('keyword', keywordToSubmit);
    formDataPayload.append('file', data.file[0]);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataPayload,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error for duplicate file name for the same keyword
        if (response.status === 409 && result.error && result.error.includes("already exists for this keyword")) {
           setError("file", { type: "manual", message: result.error });
        }
        throw new Error(result.error || 'File upload failed. Please try again.');
      }
      
      if (onUploadSuccess) {
        onUploadSuccess(keywordToSubmit, data.file[0].name);
      } else {
        // This block is less likely to be used now with multi-file, but kept for standalone use
        setUploadedFileLink(`/${keywordToSubmit}`); 
        toast({
            title: "Upload Successful!",
            description: `File '${data.file[0].name}' is now available with keyword '${keywordToSubmit}'.`,
        });
      }
      reset({ keyword: fixedKeyword || '', file: undefined }); // Reset form, keeping fixedKeyword if present
    } catch (error: any) {
      if (!(error.message && error.message.includes("already exists for this keyword"))) {
        toast({
            title: "Upload Failed",
            description: error.message || "An unexpected error occurred. Please check your input and try again.",
            variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Removed outer Card as KeywordPageClientContent now wraps forms in cards
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6"> {/* Replaced CardContent */}
        <div className="space-y-2">
          <Label htmlFor="keyword-uploadform" className="font-semibold">Unique Keyword</Label>
          <Input 
            id="keyword-uploadform" 
            {...register('keyword')} 
            placeholder="e.g., project-alpha-files" 
            readOnly={!!fixedKeyword}
            className={`${errors.keyword ? 'border-destructive focus:ring-destructive' : 'focus:ring-primary'} ${fixedKeyword ? 'bg-muted/50 cursor-not-allowed' : ''}`}
            aria-invalid={errors.keyword ? "true" : "false"}
          />
          {errors.keyword && <p className="text-sm text-destructive">{errors.keyword.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-uploadform" className="font-semibold">File</Label>
          <Input 
            id="file-uploadform" 
            type="file" 
            {...register('file')} 
            className={`pt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${selectedFile && selectedFile.length > 0 ? 'file:bg-accent file:text-accent-foreground' : 'file:bg-primary/10 file:text-primary hover:file:bg-primary/20'} ${errors.file ? 'border-destructive focus:ring-destructive' : 'focus:ring-primary'}`}
            aria-invalid={errors.file ? "true" : "false"}
          />
          {errors.file && <p className="text-sm text-destructive">{errors.file.message}</p>}
        </div>

          {uploadedFileLink && origin && !onUploadSuccess && (
          <div className="p-4 bg-accent/10 border border-accent rounded-md text-accent-foreground flex items-start gap-3">
            <Link2 className="h-5 w-5 text-accent shrink-0 mt-1" />
            <div>
              <p className="font-medium text-accent">File uploaded! Access keyword page:</p>
              <Link href={uploadedFileLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold break-all">
                {`${origin}${uploadedFileLink}`}
              </Link>
            </div>
          </div>
        )}
      </div>
      <div className="mt-6"> {/* Replaced CardFooter */}
        <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-5 w-5" />
          )}
          {isLoading ? 'Uploading...' : (fixedKeyword ? 'Upload File' : 'Upload & Share')}
        </Button>
      </div>
    </form>
  );
}
