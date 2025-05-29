import Link from 'next/link';
import { UploadCloud, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="py-4 px-6 bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Droplets className="h-7 w-7" />
          File Drop Zone
        </Link>
        <nav>
          <Button asChild variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary">
            <Link href="/upload">
              <UploadCloud className="mr-2 h-5 w-5" />
              Upload File
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
