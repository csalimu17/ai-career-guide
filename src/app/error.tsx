'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Home, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error.name === 'ChunkLoadError' ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.message?.includes('Loading CSS chunk');

  useEffect(() => {
    console.error('[Root Error Boundary]', error);

    if (isChunkError) {
      try {
        const reloadCount = parseInt(sessionStorage.getItem('chunk_reload_count') || '0', 10);
        if (reloadCount < 2) {
          sessionStorage.setItem('chunk_reload_count', String(reloadCount + 1));
          console.warn('[Root Error Boundary] ChunkLoadError detected. Reloading page...');
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }, [error, isChunkError]);

  const handleRetry = () => {
    if (isChunkError || typeof window !== 'undefined') {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
          <AlertCircle className="h-10 w-10 text-destructive animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-primary">Something went wrong.</h1>
          <p className="text-muted-foreground font-medium">
            {isChunkError
              ? 'An update was recently deployed. Refreshing your page will load the latest version.'
              : "We encountered an unexpected error. Don't worry, your data is safe."}
          </p>
          <div className="p-4 bg-muted/50 rounded-2xl border border-muted-foreground/10 overflow-hidden">
            <p className="text-[10px] sm:text-xs font-mono font-bold text-muted-foreground break-words truncate">
              {error.message || 'Unknown error occurred'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          <Button 
            onClick={handleRetry} 
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
