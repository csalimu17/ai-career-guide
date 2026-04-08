"use client"

import Link from "next/link"
import { useState } from "react"
import { collection, limit, orderBy, query } from "firebase/firestore"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  ExternalLink,
  Filter,
  Loader2,
  Search,
  TriangleAlert,
  Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function toCsvValue(value: unknown) {
  const text = String(value ?? "")
  return `"${text.replace(/"/g, '""')}"`
}

export default function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const db = useFirestore()
  const { toast } = useToast()

  const subsQuery = useMemoFirebase(
    () =>
      query(
        collection(db, "users"),
        orderBy("updatedAt", "desc"),
        limit(200)
      ),
    [db]
  )

  const { data: allUsers, isLoading, error } = useCollection(subsQuery)

  const filteredSubs = allUsers?.filter((sub) => {
    const isPremium = sub.plan === "pro" || sub.plan === "master"
    if (!isPremium) return false
    return (
      !searchTerm ||
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })
  const masterSubscribers = filteredSubs?.filter((sub) => sub.plan === "master").length || 0

  const handleExportCsv = () => {
    if (!filteredSubs?.length) return

    const header = ["Email", "First Name", "Last Name", "Plan", "Access State", "Last Plan Update"]
    const rows = filteredSubs.map((sub) => [
      sub.email,
      sub.firstName,
      sub.lastName,
      sub.plan,
      "premium_enabled",
      sub.updatedAt?.toDate ? sub.updatedAt.toDate().toISOString() : "",
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => toCsvValue(cell)).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "subscriptions-export.csv"
    anchor.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Subscription export ready",
      description: `${filteredSubs.length} premium access records were prepared for download.`,
    })
  }

  return (
    <div className="space-y-5 md:space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">Premium Access Ledger</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Review users holding paid-plan access and the latest plan update synced to Firestore.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search subscribers..."
              className="h-11 w-full rounded-xl border-none pl-10 font-medium shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="h-11 rounded-xl border-2 px-4 font-bold"
            onClick={handleExportCsv}
            disabled={!filteredSubs?.length}
          >
            <Filter className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-none bg-red-50 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 text-sm font-medium text-red-700">
            <TriangleAlert className="h-4 w-4" />
            Failed to load subscription data. Please refresh and try again.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="rounded-[1.4rem] bg-white px-5 py-14 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Synchronizing Ledger</p>
          </div>
        ) : filteredSubs?.length === 0 ? (
          <div className="rounded-[1.4rem] bg-white px-5 py-14 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-900">No premium access records found</p>
            <p className="mt-2 text-xs font-medium text-slate-500">Try a different search term or wait for a paid-plan assignment to sync.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" className="rounded-xl border-2 text-[10px] font-black uppercase tracking-widest">
                <Link href="/admin/pricing">Review plans</Link>
              </Button>
              <Button asChild className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                <Link href="/admin/users">Open user management</Link>
              </Button>
            </div>
          </div>
        ) : filteredSubs?.map((sub) => (
          <div key={sub.id} className="rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                  <AvatarImage src={sub.photoURL} />
                  <AvatarFallback className="bg-slate-100 text-[10px] font-black uppercase text-slate-400">
                    {sub.firstName?.charAt(0)}{sub.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{sub.firstName} {sub.lastName}</p>
                  <p className="truncate text-[11px] font-medium text-slate-500">{sub.email}</p>
                </div>
              </div>
              <Badge className={`border-none px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                sub.plan === "master" ? "bg-indigo-50 text-indigo-600" : "bg-primary/10 text-primary"
              }`}>
                {sub.plan}
              </Badge>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Premium enabled</span>
              <span>{sub.updatedAt?.toDate ? sub.updatedAt.toDate().toLocaleDateString() : "N/A"}</span>
            </div>

            <Button asChild variant="outline" className="mt-4 h-10 w-full rounded-xl border-2 text-[10px] font-black uppercase tracking-widest">
              <Link href={`/admin/users/${sub.id}`}>Open Subscriber</Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border-none bg-white shadow-sm md:block">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="py-5 pl-8 text-[10px] font-black uppercase tracking-widest">Subscriber</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Plan Level</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Access State</TableHead>
              <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Last Plan Update</TableHead>
              <TableHead className="py-5 pr-8 text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Synchronizing Ledger</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSubs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="space-y-4">
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">No premium access records found.</p>
                    <div className="flex justify-center gap-3">
                      <Button asChild variant="outline" className="rounded-xl border-2 text-[10px] font-black uppercase tracking-widest">
                        <Link href="/admin/pricing">Review plans</Link>
                      </Button>
                      <Button asChild className="rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <Link href="/admin/users">Open user management</Link>
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSubs?.map((sub) => (
              <TableRow key={sub.id} className="group border-slate-50 transition-colors hover:bg-slate-50/50">
                <TableCell className="py-4 pl-8">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                      <AvatarImage src={sub.photoURL} />
                      <AvatarFallback className="bg-slate-100 text-[10px] font-black uppercase text-slate-400">
                        {sub.firstName?.charAt(0)}{sub.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-black leading-none text-slate-900">
                        {sub.firstName} {sub.lastName}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400">{sub.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`rounded-md border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                    sub.plan === "master" ? "bg-indigo-50 text-indigo-600" : "bg-primary/10 text-primary"
                  }`}>
                    {sub.plan}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Premium Enabled</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {sub.updatedAt?.toDate ? sub.updatedAt.toDate().toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="pr-8 text-right">
                  <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl opacity-0 transition-opacity hover:bg-slate-100 group-hover:opacity-100">
                    <Link href={`/admin/users/${sub.id}`}>
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Card className="relative overflow-hidden rounded-[1.5rem] border-none bg-indigo-900 text-white shadow-xl shadow-indigo-900/20 sm:rounded-3xl">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Zap className="h-32 w-32 rotate-12" />
        </div>
        <CardContent className="relative z-10 flex flex-col gap-5 p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="text-xl font-black uppercase tracking-tight">Access Summary</h4>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-indigo-200">Current paid-plan mix based on synced user records.</p>
            <div className="mt-5 flex flex-wrap gap-6 sm:mt-6 sm:gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Premium Access Records</p>
                <p className="mt-1 text-2xl font-black">{filteredSubs?.length || 0}</p>
              </div>
              <div className="h-12 w-[1px] bg-indigo-800" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Master Subscribers</p>
                <p className="mt-1 text-2xl font-black text-emerald-400">{masterSubscribers}</p>
              </div>
            </div>
          </div>
          <Button asChild variant="secondary" className="h-11 w-full rounded-2xl bg-white px-6 text-[10px] font-black uppercase tracking-widest text-indigo-900 hover:bg-indigo-50 hover:text-indigo-950 [background-image:none] sm:h-12 sm:w-auto sm:px-8">
            <a href="https://dashboard.stripe.com/subscriptions" target="_blank" rel="noreferrer">
              Launch Stripe Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
