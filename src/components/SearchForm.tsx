"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function SearchForm() {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/${keyword.trim()}`);
    }
  };

return (
  <form onSubmit={handleSubmit} className="w-full max-w-lg flex gap-2 items-center animate-fadeIn">
    <Input
      type="text"
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
      placeholder="Enter keyword to find a file..."
      className="flex-grow text-base h-12 px-4 rounded-md shadow-sm focus:ring-2 focus:ring-primary"
      aria-label="Search by keyword"
      required
    />
    <Button 
      type="submit" 
      className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition-colors"
    >
      <Search className="mr-2 h-5 w-5" />
      Search
    </Button>
  </form>
);

// Simple fadeIn animation for the form
// Adding CSS directly in JS for simplicity here; ideally in a CSS module or global CSS.
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out forwards;
    }
  `;
  document.head.appendChild(styleSheet);
}
