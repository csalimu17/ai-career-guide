'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Home, HomeIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
          <AlertCircle className="h-10 w-10 text-destructive animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-primary">Something went wrong.</h1>
          <p className="text-muted-foreground font-medium">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>
          <div className="p-4 bg-muted/50 rounded-2xl border border-muted-foreground/10 overflow-hidden">
            <p className="text-[10px] sm:text-xs font-mono font-bold text-muted-foreground break-words truncate">
              {error.message || 'Unknown error occurred'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          <Button 
            onClick={() => reset()} 
            size="lg" 
            className="rounded-2xl font-bold h-14 bg-primary shadow-lg shadow-primary/20"
          >
            <RefreshCcw className="mr-2 h-5 w-5" />
            Try Again
          </Button>

          <Button 
            variant="outline" 
            size="lg" 
            asChild 
            className="rounded-2xl font-bold h-14 border-2 hover:bg-muted/50"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
        </div>

        <div className="pt-8 border-t">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Error Hash: {error.digest || 'no-digest-available'}
          </p>
        </div>
      </div>
    </div>
  );
}
