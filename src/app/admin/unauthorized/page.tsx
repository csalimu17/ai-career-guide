"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminUnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center ring-1 ring-black/5 animate-bounce">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Access Forbidden</h1>
          <p className="text-slate-500 font-medium">Your account does not have the required administrative permissions to view this resource.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border-none ring-1 ring-black/5 text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Protocol Violation Detected</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
              <p className="text-xs font-bold text-slate-600">The administrative sector requires Level 4 Governance Clearance.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
              <p className="text-xs font-bold text-slate-600">This event has been logged and reported to the system overseer.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
             <Link href="/dashboard">
               Return to Safe Zone
             </Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-2xl h-14 font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-900 border-none">
             <Link href="/login" className="flex items-center gap-2">
               <ArrowLeft className="h-4 w-4" /> Re-authenticate
             </Link>
          </Button>
        </div>
        
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest pt-8 italic">
          AI Career Guide - Governance Protocol Alpha-7
        </p>
      </div>
    </div>
  )
}
