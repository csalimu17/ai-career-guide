import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Shield, UploadCloud, History } from "lucide-react";

export default function AdminStorageSettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit bg-emerald-50 text-emerald-700 border-none">Storage oversight</Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Asset Storage</h1>
          <p className="text-sm font-medium text-slate-500">
            Review how uploads are stored and where to continue when you need to validate rules, retention, or user files.
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-xl border-2 font-bold">
          <Link href="/admin/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Governance
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-none shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <UploadCloud className="h-4 w-4 text-primary" />
              User Upload Paths
            </CardTitle>
            <CardDescription>
              Resume uploads are stored in user-scoped storage paths and should always line up with the user document that owns them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-xl font-bold">
              <Link href="/onboarding/upload">Review Upload Flow</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <Shield className="h-4 w-4 text-primary" />
              Security Rules
            </CardTitle>
            <CardDescription>
              Storage access should stay aligned with Firestore ownership rules so users cannot read each other&apos;s files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full rounded-xl border-2 font-bold">
              <Link href="/admin/audit-logs">View Governance Logs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <Database className="h-4 w-4 text-cyan-400" />
              Operational Path
            </CardTitle>
            <CardDescription className="text-slate-300">
              Bucket configuration still lives in Firebase and deployment settings, but this screen gives operators a clear route back into the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild className="w-full rounded-xl font-bold">
              <Link href="/admin/settings">
                <History className="mr-2 h-4 w-4" />
                Return to Governance Center
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
