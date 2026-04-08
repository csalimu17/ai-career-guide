"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useFirestore, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Save,
  Send,
  History,
  Eye,
  Loader2,
  AlertCircle,
  Layout,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { ContentService } from "@/lib/admin/content-service"
import { logAdminAction } from "@/lib/admin/audit-logger"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useToast } from "@/hooks/use-toast"

function getLivePreviewHref(slug: string) {
  const previewMap: Record<string, string> = {
    landing: "/",
    pricing: "/pricing",
    support: "/support",
    privacy: "/privacy",
    terms: "/terms",
  }

  return previewMap[slug] || null
}

export default function ContentEditorPage() {
  const { slug } = useParams()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const { adminRecord } = useAdminAuth()
  
  const pageRef = doc(db, "contentPages", slug as string)
  const { data: page, isLoading } = useDoc(pageRef)
  
  const [formData, setFormData] = useState<any>(null)
  const [jsonDraft, setJsonDraft] = useState("{}")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const previewHref = getLivePreviewHref(slug as string)

  const syncFormState = useCallback((nextSections: Record<string, unknown>) => {
    setFormData(nextSections)
    setJsonDraft(JSON.stringify(nextSections, null, 2))
    setJsonError(null)
  }, [])

  useEffect(() => {
    if (page) {
      syncFormState(page.sections || {})
      return
    }

    if (!isLoading) {
      syncFormState({})
    }
  }, [page, isLoading, syncFormState])

  const handleJsonChange = (value: string) => {
    setJsonDraft(value)

    try {
      const parsed = value.trim() ? JSON.parse(value) : {}
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setFormData(parsed)
        setJsonError(null)
      } else {
        setJsonError("Section payload must be a JSON object.")
      }
    } catch (error) {
      setJsonError("JSON is invalid. Fix the syntax before saving or publishing.")
    }
  }

  const handleSaveDraft = async () => {
    if (!adminRecord || !formData) return
    setIsSaving(true)
    try {
      await ContentService.saveDraft(db, slug as string, { sections: formData }, adminRecord.uid)
      await logAdminAction(db, {
        actorUid: adminRecord.uid,
        actorEmail: adminRecord.email,
        action: "save_content_draft",
        targetType: "content_page",
        targetId: slug as string,
        newValue: formData
      })
      toast({ title: "Draft Saved", description: "Changes are stored but not yet live." })
    } catch (error) {
       toast({ variant: "destructive", title: "Save Failed", description: "Failed to save draft." })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!adminRecord) return
    setIsSaving(true)
    try {
      await ContentService.publish(db, slug as string, adminRecord.uid)
      await logAdminAction(db, {
        actorUid: adminRecord.uid,
        actorEmail: adminRecord.email,
        action: "publish_content",
        targetType: "content_page",
        targetId: slug as string
      })
      toast({ title: "Published!", description: "Changes are now live on the platform." })
      router.refresh()
    } catch (error) {
       toast({ variant: "destructive", title: "Publish Failed", description: "Failed to publish content." })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return (
     <div className="flex h-96 items-center justify-center">
       <Loader2 className="h-10 w-10 animate-spin text-primary" />
     </div>
  )

  const isLanding = slug === 'landing'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-slate-100">
            <Link href="/admin/content"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                Editor: {slug}
              </h1>
              <Badge variant={page?.status === 'published' ? "secondary" : "outline"} className={`rounded-md text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none ${
                page?.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
              }`}>
                {page?.status || 'New'}
              </Badge>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-0.5 uppercase tracking-wider">Modify marketing copy and layout structure.</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl h-11 px-6 font-bold uppercase text-xs" onClick={handleSaveDraft} disabled={isSaving || formData === null || !!jsonError}>
             {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
             Save Draft
           </Button>
           <Button className="rounded-xl h-11 px-6 font-bold uppercase text-xs shadow-lg shadow-primary/20" onClick={handlePublish} disabled={isSaving || formData === null || !!jsonError}>
             {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
             Publish Live
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Content Form */}
          {isLanding && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
               <CardHeader className="border-b border-slate-50">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                    <Layout className="h-4 w-4" />
                    Hero Section
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6 text-slate-900">
                  <div className="grid gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Headline</label>
                     <Input 
                       value={formData?.hero?.headline || ""} 
                       onChange={(e) => syncFormState({...formData, hero: {...formData.hero, headline: e.target.value}})}
                       placeholder="e.g. Your AI-Powered Career Partner"
                       className="h-12 rounded-xl border-slate-100 font-bold text-lg focus-visible:ring-primary/10"
                     />
                  </div>
                  <div className="grid gap-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subheadline / Supporting Text</label>
                     <Textarea 
                       value={formData?.hero?.subheadline || ""} 
                       onChange={(e) => syncFormState({...formData, hero: {...formData.hero, subheadline: e.target.value}})}
                       placeholder="Supporting taglines go here..."
                       className="min-h-[100px] rounded-xl border-slate-100 font-medium text-sm focus-visible:ring-primary/10"
                     />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary CTA Label</label>
                      <Input 
                        value={formData?.hero?.primaryCtaLabel || ""} 
                        onChange={(e) => syncFormState({...formData, hero: {...formData.hero, primaryCtaLabel: e.target.value}})}
                        className="h-11 rounded-xl border-slate-100 font-bold text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secondary CTA Label</label>
                      <Input 
                        value={formData?.hero?.secondaryCtaLabel || ""} 
                        onChange={(e) => syncFormState({...formData, hero: {...formData.hero, secondaryCtaLabel: e.target.value}})}
                        className="h-11 rounded-xl border-slate-100 font-bold text-sm"
                      />
                    </div>
                  </div>
               </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
             <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Section Payload
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500">
                  Edit the live `sections` object directly for any content page. This keeps the CMS usable even when a page has custom blocks beyond the hero form.
                </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4 p-8">
                <Textarea
                  value={jsonDraft}
                  onChange={(event) => handleJsonChange(event.target.value)}
                  className="min-h-[320px] rounded-2xl border-slate-100 font-mono text-xs leading-6 text-slate-700 focus-visible:ring-primary/10"
                  placeholder='{"hero":{"headline":"..."}}'
                />
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">CMS Workflow</p>
                    <p className="text-xs font-medium text-slate-500">
                      Save a draft to keep edits private, then publish when the page looks right in the live preview.
                    </p>
                  </div>
                  <Badge className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                    jsonError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {jsonError ? "JSON requires attention" : "Payload ready"}
                  </Badge>
                </div>
                {jsonError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                    {jsonError}
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="border-none shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest">Editor Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${jsonError ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                          <CheckCircle2 className="h-4 w-4" />
                       </div>
                       <span className="text-xs font-bold text-slate-700">Section Payload</span>
                    </div>
                    <Badge className={`${jsonError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} border-none text-[9px] font-black px-2`}>
                      {jsonError ? "FIX JSON" : "READY"}
                    </Badge>
                  </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${previewHref ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"}`}>
                          <Eye className="h-4 w-4" />
                       </div>
                       <span className="text-xs font-bold text-slate-700">Live Preview Path</span>
                    </div>
                    <Badge className={`${previewHref ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"} border-none text-[9px] font-black px-2`}>
                      {previewHref ? "AVAILABLE" : "CMS ONLY"}
                    </Badge>
                 </div>
                 
                 {previewHref ? (
                   <Button variant="outline" asChild className="w-full h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2">
                     <Link href={previewHref} target="_blank" rel="noreferrer">
                       <Eye className="h-4 w-4 mr-2" /> Open Live Page
                     </Link>
                   </Button>
                 ) : (
                   <Button variant="outline" asChild className="w-full h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest border-2">
                     <Link href="/admin/content">
                       <Layout className="h-4 w-4 mr-2" /> Return to CMS
                     </Link>
                   </Button>
                 )}
                 <Button variant="ghost" asChild className="w-full h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400">
                   <Link href="/admin/audit-logs">
                     <History className="h-4 w-4 mr-2" /> Audit Logs
                   </Link>
                 </Button>
              </CardContent>
           </Card>

           <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operations Notice</h4>
              <p className="text-xs font-bold leading-relaxed text-slate-300">
                Publishing updates the Firestore-backed content document immediately. Public pages may still require a refresh before the latest copy is visible everywhere.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
