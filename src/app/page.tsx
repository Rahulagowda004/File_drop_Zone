import SearchForm from '@/components/SearchForm';
import { Droplets } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-20">
      <Droplets className="h-24 w-24 text-primary mb-8" data-ai-hint="water drop" />
      <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-primary tracking-tight">
        Welcome to File Drop Zone
      </h1>
      <p className="text-lg md:text-xl text-foreground/80 mb-10 max-w-2xl">
        Easily share files using unique keywords. Upload a file and get a shareable link instantly. Files are automatically deleted after 24 hours.
      </p>
      <SearchForm />
    </div>
  );
}
