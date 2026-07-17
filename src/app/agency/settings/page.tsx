import Link from "next/link";
import { ArrowLeft, Plug, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Agency Settings",
  description: "Configure your ATS integrations and white-label settings.",
});

export default function AgencySettingsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/20">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/agency/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-lg font-bold text-primary">Settings</h1>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6 md:p-8">
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-secondary" />
              <CardTitle>Unified ATS Integration</CardTitle>
            </div>
            <CardDescription>
              Connect your agency&apos;s ATS (Bullhorn, Greenhouse, Workable) using our Unified API partner.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">ATS Provider</Label>
              <Select defaultValue="bullhorn">
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullhorn">Bullhorn</SelectItem>
                  <SelectItem value="greenhouse">Greenhouse</SelectItem>
                  <SelectItem value="workable">Workable</SelectItem>
                  <SelectItem value="lever">Lever</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">Unified API Key (Merge.dev)</Label>
              <Input id="api-key" type="password" defaultValue="merge_sk_••••••••••••••••••••••••" />
              <p className="text-xs text-muted-foreground">Keep this key secure. It allows us to push candidates to your ATS.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input id="webhook-url" defaultValue="https://api.aicareerguide.com/webhooks/merge/teksystems" readOnly />
              <p className="text-xs text-muted-foreground">Add this URL to your ATS to sync status changes back to our platform.</p>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-4">
            <Button><Save className="mr-2 h-4 w-4" /> Save Connection</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agency Template Enforcer</CardTitle>
            <CardDescription>
              Force all candidates to use your standardized agency CV template when exporting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">House Template</Label>
              <Select defaultValue="executive-blue">
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive-blue">Executive Blue (Default)</SelectItem>
                  <SelectItem value="modern-minimal">Modern Minimal</SelectItem>
                  <SelectItem value="tech-focused">Tech Focused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Agency Logo URL</Label>
              <Input id="logo" defaultValue="https://example.com/teksystems-logo.png" />
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-4">
            <Button variant="secondary">Preview Template</Button>
            <Button className="ml-auto"><Save className="mr-2 h-4 w-4" /> Save Settings</Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
