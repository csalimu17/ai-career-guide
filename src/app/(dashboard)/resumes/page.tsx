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

function releaseDocumentInteractionLock() {
  if (typeof document === "undefined") return

  document.body.style.pointerEvents = ""
  document.body.style.removeProperty("pointer-events")
  document.body.style.removeProperty("overflow")
  document.body.style.removeProperty("margin-right")
  document.body.removeAttribute("data-scroll-locked")
}

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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
          <div className="space-y-1">
            <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-[1.75rem] font-bold tracking-tight text-transparent md:text-4xl">
              My Resumes
            </h1>
            <p className="text-sm text-muted-foreground md:text-lg">
              Manage your professional stories and optimize for ATS success.
            </p>
          </div>
          
          <Button 
            onClick={handleCreateNew}
            className="group h-11 rounded-2xl bg-primary px-5 shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/20 md:h-12 md:rounded-full md:px-6"
          >
            <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Create New CV
          </Button>
        </div>

        {/* Toolbar Section */}
        <div className="flex flex-col items-stretch gap-3 rounded-[1.3rem] border bg-card/50 p-3 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 sm:p-4 sm:rounded-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search CVs by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl border-muted/20 bg-background/50 pl-10 focus-visible:ring-primary/30"
            />
          </div>
          
          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-1 h-11">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-9 w-9 rounded-lg transition-all ${viewMode === "grid" ? "shadow-sm" : ""} ${isMobile ? "hidden" : ""}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={`rounded-lg h-9 w-9 transition-all ${viewMode === "list" ? "shadow-sm" : ""}`}
            >
              <List className="h-4 w-4" />
            </Button>
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
            <div className="flex flex-col gap-3 pb-20">
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
          <div className="flex flex-col items-center justify-center space-y-4 rounded-[1.6rem] border border-dashed border-muted-foreground/20 bg-muted/20 py-16 text-center animate-in zoom-in-95 duration-500 md:rounded-[2rem] md:py-24">
            <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-2">
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
                variant="outline"
                className="mt-4 rounded-full h-12"
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
            <Button variant="ghost" onClick={() => setIsRenameDialogOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isRenaming || !newName.trim()} className="rounded-full px-8">
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
            <Button onClick={confirmCreateNew} className="rounded-xl bg-primary px-8 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90">
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
        <div className="flex items-center justify-between w-full">
          <div className="flex -space-x-1.5 overflow-hidden">
             {/* Dynamic score visualization placeholder */}
             <div className="h-8 w-8 rounded-full ring-2 ring-background bg-emerald-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-emerald-600" />
             </div>
             <div className="h-8 flex items-center pl-4 text-[10px] font-bold text-emerald-600 tracking-wider">
               ATS READY
             </div>
          </div>
          <Link href={`/editor?id=${resume.id}`} className="group/btn inline-flex items-center text-sm font-semibold text-primary/80 hover:text-primary transition-colors">
            Edit
            <ChevronRight className="ml-0.5 h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
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
    <div className="group flex items-center gap-3 rounded-[1.25rem] border border-muted/20 bg-card/40 p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md md:gap-4 md:rounded-2xl md:p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/50 md:h-12 md:w-12">
        <FileText className="h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" />
      </div>
      
      <Link href={`/editor?id=${resume.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
           <h3 className="line-clamp-1 truncate text-base font-semibold transition-colors group-hover:text-primary md:text-lg">
            {resume.name}
          </h3>
          <Badge variant="outline" className="hidden md:flex rounded-full text-[10px] font-normal py-0">
            {template.name}
          </Badge>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
          <Clock className="mr-1 h-3 w-3 " />
          Updated {lastUpdated}
        </div>
      </Link>

      <div className="flex items-center gap-2">
         <div className="mr-4 hidden flex-col items-end sm:flex">
           <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600">
             <Sparkles className="h-2.5 w-2.5" />
             ATS Ready
           </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
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
              <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary">
                <Link href={`/editor?id=${resume.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in Editor</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
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
    </div>
  )
}
