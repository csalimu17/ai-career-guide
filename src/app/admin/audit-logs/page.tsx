"use client"

import { useState } from "react"
import { collection, limit, orderBy, query } from "firebase/firestore"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Database,
  ExternalLink,
  History,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const db = useFirestore()

  const logsQuery = useMemoFirebase(
    () => query(collection(db, "adminAuditLogs"), orderBy("createdAt", "desc"), limit(100)),
    [db]
  )

  const { data: logs, isLoading, error } = useCollection(logsQuery)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Audit Protocol</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Immutable record of all administrative mutations and governance events.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border-none bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="py-5 pl-6 text-[10px] font-black uppercase tracking-widest">Timestamp</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Actor</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Event Action</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Target</TableHead>
              <TableHead className="py-5 pr-6 text-right text-[10px] font-black uppercase tracking-widest">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Retrieving Protocol Logs</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="space-y-4">
                    <p className="text-sm font-bold uppercase tracking-widest text-red-500">Audit records unavailable</p>
                    <p className="text-sm font-medium text-slate-500">The governance event stream could not be loaded from Firestore.</p>
                    <Button asChild variant="outline" className="rounded-xl border-2 font-bold">
                      <Link href="/admin">Back to Governance Hub</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <p className="text-sm font-bold capitalize text-slate-400">No audit records found.</p>
                </TableCell>
              </TableRow>
            ) : logs?.map((log) => (
              <TableRow key={log.id} className="border-slate-50 transition-colors hover:bg-slate-50/50">
                <TableCell className="py-4 pl-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-none text-slate-900">
                      {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString() : "N/A"}
                    </span>
                    <span className="mt-1 text-[10px] font-medium text-slate-400">
                      {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString() : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100">
                      <ShieldCheck className="h-3 w-3 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{log.actorEmail}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-lg border-none bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-600">
                    {log.action?.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 text-slate-300" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{log.targetType}</span>
                      <span className="w-32 truncate text-[10px] font-medium text-slate-400">{log.targetId}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button
                    variant="ghost"
                    className="inline-flex gap-1 p-0 text-[10px] font-black uppercase text-primary hover:bg-transparent hover:underline"
                    onClick={() => setSelectedLog(log)}
                  >
                    View Payload
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl rounded-3xl border-none p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
              <History className="h-5 w-5 text-primary" />
              Audit Payload
            </DialogTitle>
            <DialogDescription>
              Structured metadata for {selectedLog?.action?.replace(/_/g, " ") || "this event"}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] px-6 py-5">
            <pre className="whitespace-pre-wrap break-words rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
              {selectedLog
                ? JSON.stringify(
                    {
                      actorUid: selectedLog.actorUid,
                      actorEmail: selectedLog.actorEmail,
                      action: selectedLog.action,
                      targetType: selectedLog.targetType,
                      targetId: selectedLog.targetId,
                      oldValue: selectedLog.oldValue ?? null,
                      newValue: selectedLog.newValue ?? null,
                      reason: selectedLog.reason ?? null,
                      metadata: selectedLog.metadata ?? null,
                    },
                    null,
                    2
                  )
                : ""}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
