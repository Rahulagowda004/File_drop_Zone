import SearchForm from '@/components/SearchForm';
import { Droplets } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-20 min-h-[calc(100vh-250px)]"> {/* Adjusted min-height */}
      <Droplets className="h-20 w-20 text-primary mb-6" data-ai-hint="water drop" />
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-primary tracking-tight">
        File Drop Zone
      </h1>
      <div className="w-full max-w-xl p-4">
        <SearchForm />
      </div>
      <p className="text-md text-muted-foreground mt-8 max-w-lg px-4">
        Enter a keyword to find a shared file or upload a new one. Files are publicly accessible and automatically deleted after 24 hours.
      </p>
    </div>
  );
}
