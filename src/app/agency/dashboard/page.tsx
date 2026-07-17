import Link from "next/link";
import { ArrowRight, BarChart3, Building2, FileText, Settings, Users, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Agency Dashboard",
  description: "Manage candidates, ATS integrations, and agency settings.",
});

const candidates = [
  { id: 1, name: "Sarah Jenkins", role: "Senior Frontend Engineer", atsScore: 94, status: "Ready to Sync", date: "2 hours ago" },
  { id: 2, name: "Michael Chen", role: "Product Manager", atsScore: 88, status: "Synced to Bullhorn", date: "5 hours ago" },
  { id: 3, name: "Emma Watson", role: "UX Designer", atsScore: 91, status: "Ready to Sync", date: "1 day ago" },
];

export default function AgencyDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/20">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold text-primary">TekSystems Agency Portal</h1>
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/agency/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">1,248</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. ATS Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">89%</div>
              <p className="text-xs text-muted-foreground">Across all parsed CVs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active ATS Integration</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Bullhorn</div>
              <p className="text-xs text-emerald-500">Connected via Merge.dev</p>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Candidates</CardTitle>
              <CardDescription>Review and push tailored candidate profiles directly into your ATS.</CardDescription>
            </div>
            <Button size="sm">Sync All to ATS <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-5 border-b bg-muted/50 p-4 text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Candidate</div>
                <div>ATS Score</div>
                <div>Status</div>
                <div className="text-right">Action</div>
              </div>
              <div className="divide-y">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="grid grid-cols-5 items-center p-4 text-sm">
                    <div className="col-span-2">
                      <p className="font-medium text-primary">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.role}</p>
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                        {candidate.atsScore}% Match
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{candidate.status}</span>
                    </div>
                    <div className="text-right">
                      <Button variant={candidate.status === "Ready to Sync" ? "default" : "secondary"} size="sm">
                        {candidate.status === "Ready to Sync" ? "Push to ATS" : "View Record"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
