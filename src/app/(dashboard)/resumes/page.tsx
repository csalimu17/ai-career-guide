"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  FileText, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Copy, 
  Trash2, 
  Search,
  LayoutGrid,
  List,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react"
import { format } from "date-fns"
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore"

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { getTemplateConfig } from "@/lib/templates-config"
import { ResumeTemplate } from "@/components/editor/resume-template"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

function releaseDocumentInteractionLock() {
  if (typeof document === "undefined") return

  document.body.style.pointerEvents = ""
  document.body.style.removeProperty("pointer-events")
  document.body.style.removeProperty("overflow")
  document.body.style.removeProperty("margin-right")
  document.body.removeAttribute("data-scroll-locked")
}

const pageActionButtonBase =
  "group h-12 rounded-[1.25rem] px-5 text-[0.84rem] font-black tracking-tight transition-all duration-300"

export default function ResumesPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const isMobile = useIsMobile()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Dialog states
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedResume, setSelectedResume] = useState<any>(null)
  const [newName, setNewName] = useState("")
  const [processingAction, setProcessingAction] = useState<"duplicate" | "rename" | "delete" | null>(null)
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newResumeName, setNewResumeName] = useState("My Professional CV")

  const resumesQuery = useMemoFirebase(() => user && db 
    ? query(
        collection(db, "users", user.uid, "resumes"), 
        orderBy("updatedAt", "desc")
      )
    : null, [user, db])

  const { data: resumes, isLoading: resumesLoading } = useCollection(resumesQuery)

  useEffect(() => {
    if (isMobile) {
      setViewMode("list")
    }
  }, [isMobile])

  const filteredResumes = resumes?.filter((resume: any) => {
    const resumeName = typeof resume?.name === "string" && resume.name.trim() ? resume.name : "Untitled CV"
    return resumeName.toLowerCase().includes(searchQuery.toLowerCase())
  })
  const totalResumeCount = resumes?.length ?? 0
  const visibleResumeCount = filteredResumes?.length ?? 0
  const collectionSummary = searchQuery
    ? `${visibleResumeCount} matching CV${visibleResumeCount === 1 ? "" : "s"}`
    : `${totalResumeCount} CV${totalResumeCount === 1 ? "" : "s"} ready to tailor`

  const handleCreateNew = () => {
    setIsCreateDialogOpen(true)
  }

  const confirmCreateNew = () => {
    const encName = encodeURIComponent(newResumeName.trim() || "My Professional CV")
    router.push(`/editor?new=true&name=${encName}`)
    setIsCreateDialogOpen(false)
  }

  const isDuplicating = processingAction === "duplicate"
  const isRenaming = processingAction === "rename"
  const isDeleting = processingAction === "delete"

  const handleDuplicate = async (resume: any) => {
    if (!user || !db) return
    setProcessingAction("duplicate")
    
    try {
      const { id, ...resumeData } = resume
      const newResume = {
        ...resumeData,
        name: `${resumeData.name} (Copy)`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      const docRef = await addDoc(collection(db, "users", user.uid, "resumes"), newResume)
      toast({
        title: "Resume duplicated",
        description: `Successfully created a copy of "${resumeData.name}".`
      })
      router.push(`/editor?id=${docRef.id}`)
    } catch (error) {
      console.error("Duplication failed:", error)
      toast({
        variant: "destructive",
        title: "Duplicate failed",
        description: "We couldn't copy this resume right now."
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleRename = async () => {
    if (!user || !db || !selectedResume || !newName.trim()) return
    setProcessingAction("rename")
    
    try {
      const resumeRef = doc(db, "users", user.uid, "resumes", selectedResume.id)
      await updateDoc(resumeRef, {
        name: newName.trim(),
        updatedAt: serverTimestamp()
      })
      
      toast({
        title: "Resume renamed",
        description: `Successfully renamed to "${newName.trim()}".`
      })
      setIsRenameDialogOpen(false)
      setSelectedResume(null)
    } catch (error) {
      console.error("Rename failed:", error)
      toast({
        variant: "destructive",
        title: "Rename failed",
        description: "We couldn't rename this resume right now."
      })
    } finally {
      setProcessingAction(null)
    }
  }

  const handleDelete = async () => {
    if (!user || !db || !selectedResume) return
    const resumeToDelete = selectedResume
    setProcessingAction("delete")
    
    try {
      const resumeRef = doc(db, "users", user.uid, "resumes", resumeToDelete.id)
      await deleteDoc(resumeRef)
      
      toast({
        title: "Resume deleted",
        description: `"${resumeToDelete.name ?? "Resume"}" has been permanently removed.`
      })
      setIsDeleteDialogOpen(false)
      setSelectedResume(null)
      releaseDocumentInteractionLock()
    } catch (error) {
      console.error("Delete failed:", error)
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "We couldn't delete this resume right now."
      })
    } finally {
      setProcessingAction(null)
      window.setTimeout(releaseDocumentInteractionLock, 0)
    }
  }

  const openRenameDialog = (resume: any) => {
    setSelectedResume(resume)
    setNewName(resume.name)
    setIsRenameDialogOpen(true)
  }

  const openDeleteDialog = (resume: any) => {
    setSelectedResume(resume)
    setIsDeleteDialogOpen(true)
  }

  const handleRenameDialogChange = (open: boolean) => {
    setIsRenameDialogOpen(open)
    if (!open) {
      setSelectedResume(null)
      setNewName("")
      if (processingAction === "rename") {
        setProcessingAction(null)
      }
    }
  }

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open && processingAction === "delete") {
      return
    }

    setIsDeleteDialogOpen(open)
    if (!open) {
      setSelectedResume(null)
      if (processingAction === "delete") {
        setProcessingAction(null)
      }
    }
  }

  if (isUserLoading || resumesLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-12 w-40" />
        </div>
        
        <div className="flex items-center gap-4 py-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <div className="mobile-app-page md:container md:mx-auto md:space-y-8 md:px-8 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <section className="section-shell relative overflow-hidden border-none p-5 sm:p-6 md:p-10">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3 pt-1">
              <h1 className="headline-gradient-vivid pb-1 text-[2.2rem] font-black leading-[1.02] tracking-tight sm:text-[3rem] lg:text-5xl">
                My Resumes
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500 md:text-lg">
                Manage your professional stories, keep your best versions organized, and optimize every CV for ATS success.
              </p>
            </div>

            <Button
              onClick={handleCreateNew}
              className={cn(
                pageActionButtonBase,
                "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 text-white shadow-[0_22px_50px_-28px_rgba(124,58,237,0.52)] hover:-translate-y-0.5 hover:shadow-[0_30px_62px_-30px_rgba(124,58,237,0.6)]"
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110">
                <Plus className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-90" />
              </span>
              <span className="flex flex-col items-start leading-none">
                <span>Create New CV</span>
                <span className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/72">
                  Start a new draft
                </span>
              </span>
            </Button>
          </div>
        </section>

        {/* Toolbar Section */}
        <div className="rounded-[1.5rem] border border-white/70 bg-white/85 p-3 shadow-[0_24px_55px_-40px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:rounded-[1.75rem] sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search CVs by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-2xl border-white/70 bg-slate-50/80 pl-10 shadow-inner shadow-slate-100/80 focus-visible:ring-primary/30"
            />
            </div>

            {isMobile ? (
              <div className="flex items-center justify-between rounded-[1.2rem] border border-slate-100 bg-slate-50/80 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Collection</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">{collectionSummary}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_14px_28px_-18px_rgba(124,58,237,0.7)]">
                  <List className="h-4 w-4" />
                </div>
              </div>
            ) : (
            <div className="flex items-center gap-2 rounded-[1.25rem] border border-slate-100 bg-white/85 p-1.5 h-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`h-10 w-10 rounded-[1rem] transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-md shadow-primary/15 ring-1 ring-primary/10" : "border border-transparent text-slate-400 hover:border-slate-100 hover:bg-white hover:text-slate-700"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`h-10 w-10 rounded-[1rem] transition-all ${viewMode === "list" ? "bg-primary text-white shadow-md shadow-primary/15 ring-1 ring-primary/10" : "border border-transparent text-slate-400 hover:border-slate-100 hover:bg-white hover:text-slate-700"}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        {filteredResumes && filteredResumes.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {filteredResumes.map((resume: any) => (
                <ResumeCard 
                  key={resume.id} 
                  resume={resume} 
                  onRename={openRenameDialog}
                  onDelete={openDeleteDialog}
                  onDuplicate={handleDuplicate}
                  isDuplicating={isDuplicating}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-20">
              {filteredResumes.map((resume: any) => (
                <ResumeListItem 
                  key={resume.id} 
                  resume={resume}
                  onRename={openRenameDialog}
                  onDelete={openDeleteDialog}
                  onDuplicate={handleDuplicate}
                  isDuplicating={isDuplicating}
                />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-[1.75rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,255,0.96))] py-16 text-center shadow-[0_24px_55px_-40px_rgba(15,23,42,0.2)] animate-in zoom-in-95 duration-500 md:rounded-[2rem] md:py-24">
            <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-3xl border border-white bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-orange-400/10 shadow-sm">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">No resumes found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchQuery 
                  ? `No resumes match your search "${searchQuery}". Try a different term.`
                  : "You haven't created any CVs yet. Start by creating your first masterpiece."
                }
              </p>
            </div>
            {!searchQuery && (
              <Button
                onClick={handleCreateNew}
                className="mt-4 h-12 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-6 font-black text-white shadow-[0_18px_40px_-24px_rgba(124,58,237,0.55)] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-26px_rgba(124,58,237,0.65)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create your first CV
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={isRenameDialogOpen} onOpenChange={handleRenameDialogChange}>
        <DialogContent className="rounded-[1.4rem] sm:max-w-md md:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>
              Enter a new name for your CV to stay organized.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Senior Software Engineer - Google"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              className="h-11 rounded-xl md:h-12"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)} className="rounded-full border-2 px-6">
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isRenaming || !newName.trim()} className="rounded-full bg-primary px-8 font-bold shadow-lg shadow-primary/15 hover:bg-primary/90">
              {isRenaming ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
          <AlertDialogContent className="rounded-[1.4rem] border-destructive/20 md:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Resume
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your CV
              <span className="font-semibold text-foreground"> "{selectedResume?.name}" </span>
              and all of its history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
              className="bg-destructive hover:bg-destructive/90 rounded-full"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create New Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="rounded-[1.4rem] sm:max-w-md md:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Name your new CV
            </DialogTitle>
            <DialogDescription>
              Give your CV a descriptive name to stay organized. You can always change this later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              value={newResumeName}
              onChange={(e) => setNewResumeName(e.target.value)}
              placeholder="e.g. Software Engineer CV - Google"
              className="h-11 rounded-xl border-2 focus-visible:ring-primary md:h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmCreateNew()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl border-2 px-6">
              Cancel
            </Button>
            <Button onClick={confirmCreateNew} className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-8 font-bold shadow-lg shadow-primary/20 hover:opacity-95">
              Create CV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ResumeCard({ 
  resume, 
  onRename, 
  onDelete, 
  onDuplicate,
  isDuplicating 
}: { 
  resume: any, 
  onRename: (r: any) => void, 
  onDelete: (r: any) => void,
  onDuplicate: (r: any) => void,
  isDuplicating: boolean
}) {
  const template = getTemplateConfig(resume.templateId)
  const lastUpdated = resume.updatedAt?.toDate() 
    ? format(resume.updatedAt.toDate(), "MMM d, yyyy") 
    : "Just now"

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-[1.45rem] border-muted/20 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 md:rounded-2xl">
      <Link href={`/editor?id=${resume.id}`} className="absolute inset-x-0 top-0 h-[70%] z-0" />
      
      <div className="relative flex h-36 w-full items-center justify-center overflow-hidden border-b border-muted/10 bg-muted/30 md:h-44">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        
        {/* Real Dynamic Thumbnail */}
        <div className="absolute top-3 w-[210mm] origin-top scale-[0.13] overflow-hidden rounded-lg border bg-white shadow-2xl transition-all duration-500 pointer-events-none group-hover:scale-[0.15] md:top-4 md:scale-[0.16] md:group-hover:scale-[0.18]">
           <ResumeTemplate data={resume} mode="thumbnail" />
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
          <Button variant="secondary" className="rounded-full pointer-events-auto h-10 px-6 font-semibold shadow-lg">
            Open Editor
          </Button>
        </div>

        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-8 w-8 rounded-full border border-muted/50 bg-background/80 shadow-sm hover:bg-background hover:text-primary transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRename(resume);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Rename Resume</TooltipContent>
            </Tooltip>
          </TooltipProvider>

           <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full border border-muted/50 bg-background/80 shadow-sm hover:bg-background">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl ring-1 ring-black/5">
              <DropdownMenuItem
                onSelect={() => onRename(resume)}
                className="h-10 rounded-lg cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(resume)} disabled={isDuplicating} className="h-10 rounded-lg cursor-pointer">
                <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onSelect={() => onDelete(resume)}
                className="h-10 rounded-lg text-destructive focus:text-destructive cursor-pointer focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Badge className="absolute top-3 left-3 z-10 rounded-full bg-background/80 backdrop-blur-md text-foreground border-muted/30 font-medium">
          {template.name}
        </Badge>
      </div>

      <CardHeader className="p-4 pb-0 md:p-5 md:pb-0">
        <div className="space-y-1">
          <CardTitle className="line-clamp-1 text-base transition-colors group-hover:text-primary md:text-lg">
            {resume.name}
          </CardTitle>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            Updated {lastUpdated}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="mt-auto p-4 pt-3 md:p-5 md:pt-4">
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex -space-x-1.5 overflow-hidden">
             {/* Dynamic score visualization placeholder */}
             <div className="h-8 w-8 rounded-full ring-2 ring-background bg-emerald-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-emerald-600" />
             </div>
             <div className="h-8 flex items-center pl-4 text-[10px] font-bold text-emerald-600 tracking-wider">
               ATS READY
             </div>
          </div>
          <Link
            href={`/editor?id=${resume.id}`}
            className="group/btn inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/[0.04] px-3 py-1.5 text-[0.72rem] font-black uppercase tracking-[0.16em] text-primary transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/[0.08]"
          >
            Open
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

function ResumeListItem({ 
  resume, 
  onRename, 
  onDelete, 
  onDuplicate,
  isDuplicating 
}: { 
  resume: any, 
  onRename: (r: any) => void, 
  onDelete: (r: any) => void,
  onDuplicate: (r: any) => void,
  isDuplicating: boolean
}) {
  const template = getTemplateConfig(resume.templateId)
  const lastUpdated = resume.updatedAt?.toDate() 
    ? format(resume.updatedAt.toDate(), "MMM d, yyyy") 
    : "Just now"

  return (
    <div className="group rounded-[1.5rem] border border-white/70 bg-white/82 p-4 shadow-[0_24px_55px_-42px_rgba(15,23,42,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_30px_65px_-42px_rgba(124,58,237,0.24)] md:rounded-[1.7rem] md:p-5">
      <div className="flex items-start gap-3">
        <Link href={`/editor?id=${resume.id}`} className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br from-primary/12 to-secondary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <FileText className="h-[1.35rem] w-[1.35rem] transition-colors group-hover:text-primary" />
            </div>

            <div className="min-w-0 space-y-2">
              <div className="space-y-2">
                <h3 className="line-clamp-1 truncate text-[1.02rem] font-black tracking-tight text-slate-900 transition-colors group-hover:text-primary md:text-lg">
                  {resume.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-primary/10 bg-primary/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                    {template.name}
                  </Badge>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    <Sparkles className="h-2.5 w-2.5" />
                    ATS Ready
                  </div>
                </div>
              </div>

              <div className="flex items-center text-xs font-medium text-muted-foreground">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Updated {lastUpdated}
              </div>
            </div>
          </div>
        </Link>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-slate-100 hover:text-slate-900">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem
              onSelect={() => onRename(resume)}
              className="h-10"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(resume)} disabled={isDuplicating} className="h-10">
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(resume)}
              className="h-10 text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100/80 pt-3.5">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          Ready for edits and tailoring
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full bg-white hover:bg-primary/10 hover:text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRename(resume);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rename Resume</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-white hover:bg-primary/10 hover:text-primary">
                  <Link href={`/editor?id=${resume.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in Editor</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
