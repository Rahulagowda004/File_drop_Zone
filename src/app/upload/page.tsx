import UploadForm from '@/components/UploadForm';
import { UploadCloud } from 'lucide-react';

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 md:py-12">
      <div className="text-center mb-10">
        <UploadCloud className="h-16 w-16 text-primary mx-auto mb-6" data-ai-hint="cloud upload" />
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">Upload Your File</h1>
        <p className="text-lg text-foreground/80">
          Choose a unique keyword and upload your file. It will be accessible via a public link for 24 hours before automatic deletion.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
