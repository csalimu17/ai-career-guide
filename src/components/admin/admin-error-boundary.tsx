'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Hub Crash:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center p-6">
          <div className="surface-card w-full max-w-lg overflow-hidden border-none bg-white p-0 shadow-2xl sm:rounded-[2rem]">
            <div className="bg-red-50 p-8 text-center sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-sm">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="mt-6 text-2xl font-black uppercase tracking-tight text-slate-900">
                Governance Interface Failure
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                A critical rendering error occurred. This is often caused by unexpected data formats in the document record.
              </p>
              
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="h-11 rounded-xl px-6 font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Hard Refresh
                </Button>
                <Button 
                  variant="outline" 
                  asChild
                  className="h-11 rounded-xl px-6 border-2 font-bold uppercase tracking-widest"
                >
                  <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Hub Home
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="border-t border-slate-100 bg-slate-50 p-6 px-8 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Technical Details</p>
              <code className="mt-2 block max-h-32 overflow-auto break-all rounded-lg bg-slate-100 p-3 text-[11px] font-mono text-slate-600">
                {this.state.error?.message || 'Unknown render exception'}
              </code>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
