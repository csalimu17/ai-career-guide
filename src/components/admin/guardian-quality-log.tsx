import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Zap } from "lucide-react"

interface CorrectionEntry {
  id: string;
  timestamp: string;
  user: string;
  field: string;
  original: string;
  refined: string;
  confidence: number;
  sourceLanguage?: string;
  isTranslated?: boolean;
}

const mockCorrections: CorrectionEntry[] = [
  {
    id: '1',
    timestamp: '2 mins ago',
    user: 'csali@example.com',
    field: 'Work Experience Title',
    original: '• Senior Developer • React Expert',
    refined: 'Senior Developer',
    confidence: 0.98,
    sourceLanguage: 'English'
  },
  {
    id: '2',
    timestamp: '15 mins ago',
    user: 'jdoe@test.com',
    field: 'CV Content',
    original: 'Source: Spanish CV',
    refined: 'Institutional Standard (English)',
    confidence: 0.96,
    sourceLanguage: 'Spanish',
    isTranslated: true
  },
  {
    id: '3',
    timestamp: '45 mins ago',
    user: 'm.schmidt@berlin.de',
    field: 'Location',
    original: 'Berlin, Deutschland',
    refined: 'Berlin, Germany',
    confidence: 0.94,
    sourceLanguage: 'German',
    isTranslated: true
  }
];

export function GuardianQualityLog() {
  return (
    <Card className="col-span-1 lg:col-span-2 border-indigo-100 shadow-sm bg-gradient-to-br from-white to-indigo-50/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-900">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Guardian Refinement Logs
          </CardTitle>
          <p className="text-sm text-muted-foreground">Real-time institutional accuracy & translation audits</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Industrial Ready
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCorrections.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg bg-white border border-indigo-50 shadow-sm transition-hover hover:border-indigo-200">
              <div className="mt-1 p-2 bg-indigo-100 rounded-full">
                {log.isTranslated ? <Zap className="h-4 w-4 text-indigo-600" /> : <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-indigo-950">{log.field}</p>
                    {log.isTranslated && (
                      <Badge variant="secondary" className="text-[9px] h-4 bg-indigo-100 text-indigo-700 border-none">
                        Translated from {log.sourceLanguage}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 truncate max-w-[150px] line-through">{log.original}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">{log.refined}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">User: {log.user}</span>
                  <span className="text-[10px] font-bold text-indigo-600">Confidence: {(log.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
