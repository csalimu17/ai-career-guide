import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Cpu, Flag, Sparkles, Settings } from "lucide-react";

export default function AdminAiSettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit bg-accent/10 text-accent border-none">AI configuration checkpoint</Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">AI Models & APIs</h1>
          <p className="text-sm font-medium text-slate-500">
            Keep model selection, feature flags, and cost controls aligned without sending admins into a dead end.
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
              <Cpu className="h-4 w-4 text-primary" />
              Active Runtime
            </CardTitle>
            <CardDescription>
              The default model choice is managed from the System Governance page so it stays close to the rest of the platform config.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-xl font-bold">
              <Link href="/admin/settings">Open System Constants</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <Flag className="h-4 w-4 text-primary" />
              Runtime Feature Flags
            </CardTitle>
            <CardDescription>
              Use feature flags to disable AI capabilities cleanly instead of relying on hidden or dead controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full rounded-xl border-2 font-bold">
              <Link href="/admin/settings/flags">Manage Feature Flags</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Reliability Notes
            </CardTitle>
            <CardDescription className="text-slate-300">
              External API keys still live in environment configuration and deployment secrets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>When support or ops needs context, this page gives them a clear next step instead of a blocked card.</p>
            <Button variant="secondary" asChild className="w-full rounded-xl font-bold">
              <Link href="/admin/diagnostics">
                <Settings className="mr-2 h-4 w-4" />
                Open Diagnostics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
