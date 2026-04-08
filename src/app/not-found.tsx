import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
            <span className="text-[200px] font-black">404</span>
          </div>
          <div className="h-24 w-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-6">
            <FileQuestion className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <h1 className="text-4xl font-black tracking-tight text-primary">Page Lost in Space.</h1>
          <p className="text-muted-foreground font-medium">
            We couldn't find the page you were looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="grid gap-3 pt-4">
          <Button asChild size="lg" className="rounded-2xl font-bold h-14 shadow-lg shadow-primary/20">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
             <Button variant="outline" asChild className="rounded-xl font-bold">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl font-bold">
              <Link href="/signup">
                Sign Up
              </Link>
            </Button>
          </div>
        </div>

        <div className="pt-12 border-t">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Popular Destinations</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard" className="text-xs font-bold hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/editor" className="text-xs font-bold hover:text-primary transition-colors">CV Editor</Link>
            <Link href="/jobs" className="text-xs font-bold hover:text-primary transition-colors">Jobs</Link>
            <Link href="/chat" className="text-xs font-bold hover:text-primary transition-colors">AI Assistant</Link>
            <Link href="/ats" className="text-xs font-bold hover:text-primary transition-colors">ATS Fit</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
