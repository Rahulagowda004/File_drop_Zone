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
import { UploadCloud, Link2 } from 'lucide-react';

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
  onUploadSuccess?: (uploadedKeyword: string) => void;
}

export default function UploadForm({ fixedKeyword, onUploadSuccess }: UploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileLink, setUploadedFileLink] = useState<string | null>(null); // Only used if onUploadSuccess is not provided
  const [origin, setOrigin] = useState('');
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: fixedKeyword || '',
      file: undefined,
    }
  });

  // Watch the file input to update its styling if a file is selected
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
    // Use fixedKeyword if provided, otherwise use data.keyword from form
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
        throw new Error(result.error || 'File upload failed. Please try again.');
      }

      toast({
        title: "Upload Successful!",
        description: `File '${data.file[0].name}' is now available with keyword '${keywordToSubmit}'.`,
        variant: "default",
      });
      
      if (onUploadSuccess) {
        onUploadSuccess(keywordToSubmit);
      } else {
        setUploadedFileLink(`/${keywordToSubmit}`);
      }
      reset();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "An unexpected error occurred. Please check your input and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">
          {fixedKeyword ? `Upload for "${fixedKeyword}"` : "Share a File"}
        </CardTitle>
        <CardDescription>
          {fixedKeyword ? `Select your file to associate with "${fixedKeyword}".` : "Enter a keyword and select your file to upload."}
          {' '}Max file size: ${MAX_FILE_SIZE / (1024*1024)}MB.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="keyword" className="font-semibold">Unique Keyword</Label>
            <Input 
              id="keyword" 
              {...register('keyword')} 
              placeholder="e.g., project-alpha-files" 
              readOnly={!!fixedKeyword}
              className={`${errors.keyword ? 'border-destructive focus:ring-destructive' : 'focus:ring-primary'} ${fixedKeyword ? 'bg-muted/50 cursor-not-allowed' : ''}`}
              aria-invalid={errors.keyword ? "true" : "false"}
            />
            {errors.keyword && <p className="text-sm text-destructive">{errors.keyword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="font-semibold">File</Label>
            <Input 
              id="file" 
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
                <p className="font-medium text-accent">File uploaded successfully! Access it here:</p>
                <Link href={uploadedFileLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold break-all">
                  {`${origin}${uploadedFileLink}`}
                </Link>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-semibold">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </div>
            ) : (
              <>
                <UploadCloud className="mr-2 h-5 w-5" />
                Upload & Share
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
