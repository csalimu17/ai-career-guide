import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, ShieldCheck, Users, History } from "lucide-react";

export default function AdminSecuritySettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit bg-primary/10 text-primary border-none">Read-only governance view</Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Security & RBAC</h1>
          <p className="text-sm font-medium text-slate-500">
            Review how admin access is enforced and jump to the live tools that manage people, roles, and audit history.
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
              <Shield className="h-4 w-4 text-primary" />
              Route Protection
            </CardTitle>
            <CardDescription>
              Admin screens are protected by role checks in the app and by Firestore rules at the data layer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Use the user management console to review account state, suspension flags, and current plan entitlements.</p>
            <Button asChild className="w-full rounded-xl font-bold">
              <Link href="/admin/users">Open User Management</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <Users className="h-4 w-4 text-primary" />
              Admin Role Source
            </CardTitle>
            <CardDescription>
              Elevated access is granted from the protected admin user records, not from client-only state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Promotions, suspensions, and plan adjustments are logged so permission changes have an audit trail.</p>
            <Button variant="outline" asChild className="w-full rounded-xl border-2 font-bold">
              <Link href="/admin/audit-logs">Review Audit Trail</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Operational Guidance
            </CardTitle>
            <CardDescription className="text-slate-300">
              Global auth-provider setup still lives in Firebase Console and deployment config.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>Use this page as the safe hand-off point instead of a dead-end card. The actionable in-app paths are linked here.</p>
            <Button variant="secondary" asChild className="w-full rounded-xl font-bold">
              <Link href="/admin/users">
                <History className="mr-2 h-4 w-4" />
                Continue to User Operations
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
