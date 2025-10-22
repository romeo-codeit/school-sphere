import { useState, useRef, useMemo, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Search, Plus, Upload, Download, Eye, FileText, Video, Music, Image, Link as LinkIcon, Grid, List, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResources } from "@/hooks/useResources";
import { isOnline } from "@/lib/offline";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useClasses } from "@/hooks/useClasses";
import { getStudentByUserId, getStudentByParentEmail } from "@/lib/api/students";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useResourcesPerformanceTest } from "@/hooks/useResourcesPerformanceTest";

const resourceFormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  type: z.string(),
  subject: z.string().optional(),
  class: z.string().optional(),
  isPublic: z.boolean(),
});

type ResourceFormData = z.infer<typeof resourceFormSchema>;

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<any | null>(null);
  const [editingResource, setEditingResource] = useState<any | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { role, hasPermission } = useRole();
  const { classes } = useClasses();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const isMobile = useIsMobile();

  // Performance testing hook
  useResourcesPerformanceTest();

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) return;
      try {
        if (role === 'student' && user.$id) {
          const student = await getStudentByUserId(user.$id);
          setStudentProfile(student);
        } else if (role === 'parent' && user.email) {
          const student = await getStudentByParentEmail(user.email);
          setStudentProfile(student);
        }
      } catch (e) {
        setStudentProfile(null);
      }
    };
    fetchStudentProfile();
  }, [user, role]);

  const resourceFilters = useMemo(() => {
  if (role === 'admin' || role === 'teacher') return {};
  return { isPublic: true, classId: studentProfile?.classId ?? undefined };
  }, [role, studentProfile]);

  const { resources, isLoading, createResource, updateResource, deleteResource, uploadFile, getFilePreview, getFileDownload } = useResources(resourceFilters);

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: { isPublic: true },
  });

  const handleOpenForm = (resource: any | null = null) => {
    setEditingResource(resource);
    if (resource) {
      form.reset({
        title: resource.title,
        description: resource.description,
        type: resource.type,
        subject: resource.subject,
        class: resource.class,
        isPublic: resource.isPublic,
      });
    } else {
      form.reset({ title: "", description: "", type: "pdf", subject: "", class: "", isPublic: true });
    }
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const filteredResources = resources?.filter((resource: any) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || resource.type === selectedType;
    const matchesSubject = selectedSubject === "all" || resource.subject === selectedSubject;
    return matchesSearch && matchesType && matchesSubject;
  }) || [];

  const subjects = Array.from(new Set(resources?.map((r: any) => r.subject).filter(Boolean) || []));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf": return FileText;
      case "video": return Video;
      case "audio": return Music;
      case "image": return Image;
      case "link": return LinkIcon;
      default: return FileText;
    }
  };

  const onSubmit = async (data: ResourceFormData) => {
    if (!user) return;
    try {
      let fileId = editingResource?.fileId;
      if (selectedFile) {
        if (!isOnline()) {
          toast({ title: "Offline", description: "Cannot upload file while offline. The resource metadata will be queued. You can upload the file once online." });
        } else {
          const uploadedFile = await uploadFile(selectedFile);
          fileId = uploadedFile.$id;
        }
      }

      if (!fileId && !editingResource && isOnline()) {
        toast({ title: "Error", description: "A file is required to create a resource.", variant: "destructive" });
        return;
      }

      const resourceData = { ...data, fileId, uploadedBy: user.$id, downloads: editingResource?.downloads || 0 };

      if (editingResource) {
        await updateResource({ id: editingResource.$id, ...resourceData });
        toast({ title: "Success", description: "Resource updated successfully." });
      } else {
        await createResource(resourceData);
        toast({ title: "Success", description: "Resource uploaded successfully." });
      }

      setIsFormOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteConfirm = async () => {
      if (!resourceToDelete) return;
      try {
          await deleteResource({ resourceId: resourceToDelete.$id, fileId: resourceToDelete.fileId });
          toast({ title: "Success", description: "Resource deleted." });
      } catch (error: any) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
          setIsDeleteDialogOpen(false);
          setResourceToDelete(null);
      }
  };

  const handleDownload = async (resource: any) => {
    try {
  const fileDownload = getFileDownload(resource.fileId) as string | { href: string } | undefined;
  const url = typeof fileDownload === 'string' ? fileDownload : fileDownload?.href;
    if(url) {
      window.open(url, '_blank');
      await updateResource({ id: resource.$id, downloads: (resource.downloads || 0) + 1 });
    } else {
      toast({ title: "Error", description: "Download link not available.", variant: "destructive" });
    }
    } catch (error) {
      toast({ title: "Error", description: "Could not download file.", variant: "destructive" });
    }
  };

  const handlePreview = (fileId: string) => {
      try {
          const filePreview = getFilePreview(fileId) as string | { href: string } | undefined;
          const url = typeof filePreview === 'string' ? filePreview : filePreview?.href;
          if (url) {
            window.open(url, '_blank');
          } else {
            toast({ title: "Error", description: "Preview link not available.", variant: "destructive" });
          }
      } catch (error) {
          toast({ title: "Error", description: "Could not get file preview.", variant: "destructive" });
      }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-4 md:space-y-6">
      <TopNav title="Resources" subtitle="Educational materials and study resources" showGoBackButton={true} />
      <div className="px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-2xl sm:text-3xl">Resource Library</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {hasPermission('resources', 'create') && <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Upload Resource</Button>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="relative w-full md:flex-1 md:max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-full"/></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full md:w-auto">
                <Select value={selectedType} onValueChange={setSelectedType}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="audio">Audio</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="link">Link</SelectItem></SelectContent></Select>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Subjects</SelectItem>{subjects.map((subject: string) => (<SelectItem key={subject} value={subject}>{subject}</SelectItem>))}</SelectContent></Select>
              </div>
            </div>

            {isLoading ? <TableSkeleton rows={8} columns={4} /> :
             filteredResources.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Resources Available"
                description={searchQuery || selectedType !== 'all' || selectedSubject !== 'all' 
                  ? "No resources match your filters. Try adjusting your search criteria."
                  : "There are no learning resources uploaded yet. Check back later or contact your teacher."}
                action={hasPermission('resources', 'create') ? {
                  label: "Upload Resource",
                  onClick: () => setIsFormOpen(true)
                } : undefined}
              />
             ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredResources.map((resource: any) => {
                  const Icon = getTypeIcon(resource.type);
                  const canManage = hasPermission('resources', 'update') && (user?.$id === resource.uploadedBy || role === 'admin');
                  return (
                    <Card key={resource.$id} className="flex flex-col group">
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center"><Icon className="text-primary text-xl" /></div>
                          {canManage && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => handleOpenForm(resource)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem><DropdownMenuItem onClick={() => {setResourceToDelete(resource); setIsDeleteDialogOpen(true);}} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
                        </div>
                        <h4 className="font-semibold text-sm sm:text-base lg:text-lg text-foreground mb-2 line-clamp-2">{resource.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-3 flex-1">{resource.description || "No description."}</p>
            <div className="text-xs text-muted-foreground space-y-1 mb-4">
              {resource.subject && <Badge variant="outline">{resource.subject}</Badge>}
              {resource.class && <Badge variant="secondary">{resource.class}</Badge>}
              {resource.offline && <Badge variant="outline">Offline</Badge>}
            </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between mt-auto pt-4 border-t gap-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Download className="w-3 h-3" /> {resource.downloads || 0}</div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button variant="ghost" size="sm" onClick={() => resource.offline ? toast({ title: 'Offline', description: 'Preview unavailable while offline' }) : handlePreview(resource.fileId)} className="flex-1 sm:flex-none"><Eye className="w-4 h-4 sm:mr-1" /> <span className="sm:hidden">Preview</span></Button>
                            <Button size="sm" onClick={() => resource.offline ? toast({ title: 'Offline', description: 'Download unavailable while offline' }) : handleDownload(resource)} className="flex-1 sm:flex-none"><Download className="w-4 h-4 sm:mr-1" /> <span className="sm:hidden">Download</span></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl sm:text-2xl">{editingResource ? "Edit Resource" : "Upload New Resource"}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {editingResource ? "Update resource information and file" : "Add a new learning resource for students"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto modern-scrollbar px-6 flex-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel className="block mb-1">Title</FormLabel><FormControl><Input {...field} className="w-full" /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel className="block mb-1">Description</FormLabel><FormControl><Textarea {...field} rows={3} className="w-full" /></FormControl><FormMessage /></FormItem>)}/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel className="block mb-1">Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="audio">Audio</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="link">Link</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="subject" render={({ field }) => (<FormItem><FormLabel className="block mb-1">Subject</FormLabel><FormControl><Input {...field} className="w-full" /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="class" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block mb-1">Class (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Assign to a class" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {classes?.map((c: any) => (
                          <SelectItem key={c.$id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="isPublic" render={({ field }) => (<FormItem><FormLabel className="block mb-1">Visibility</FormLabel><Select onValueChange={(val) => field.onChange(val === 'true')} defaultValue={String(field.value)}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="true">Public</SelectItem><SelectItem value="false">Private</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <FormItem>
                <FormLabel className="block mb-1">{editingResource ? "Replace File (Optional)" : "File"}</FormLabel>
                <FormControl>
                  <div>
                    <Input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden"/>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full"><Upload className="w-4 h-4 mr-2" />{selectedFile ? selectedFile.name : "Choose a file"}</Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" className="w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  {editingResource ? "Update Resource" : "Upload Resource"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the resource and its associated file.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </ErrorBoundary>
  );
}