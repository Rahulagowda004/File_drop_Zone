
import Link from 'next/link';
import { Droplets } from 'lucide-react';

export default function Header() {
  return (
    <header className="py-4 px-6 bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Droplets className="h-7 w-7" />
          File Drop Zone
        </Link>
        <nav>
          {/* Navigation items can be added here if needed in the future */}
        </nav>
      </div>
    </header>
  );
}
