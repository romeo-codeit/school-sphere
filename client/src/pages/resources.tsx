import { useState, useRef, useMemo } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Search, Plus, Upload, Download, Eye, FileText, Video, Music, Image, Link as LinkIcon, Grid, List, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResources } from "@/hooks/useResources";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useStudents } from "@/hooks/useStudents";
import { cn } from "@/lib/utils";

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
  const { students } = useStudents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const studentProfile = useMemo(() => {
    if (!user || !students) return null;
    if (role === 'student') return students.find(s => s.userId === user.$id);
    if (role === 'parent') return students.find(s => s.parentEmail === user.email);
    return null;
  }, [user, students, role]);

  const resourceFilters = useMemo(() => {
      if (role === 'admin' || role === 'teacher') return {};
      return { isPublic: true, classId: studentProfile?.classId };
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

  const resourceStats = {
    total: resources?.length || 0,
    pdf: resources?.filter((r: any) => r.type === "pdf").length || 0,
    video: resources?.filter((r: any) => r.type === "video").length || 0,
    audio: resources?.filter((r: any) => r.type === "audio").length || 0,
    image: resources?.filter((r: any) => r.type === "image").length || 0,
    link: resources?.filter((r: any) => r.type === "link").length || 0,
  };

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
        const uploadedFile = await uploadFile(selectedFile);
        fileId = uploadedFile.$id;
      }

      if (!fileId && !editingResource) {
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
        const url = getFileDownload(resource.fileId)?.href;
        if(url) {
            window.open(url, '_blank');
            await updateResource({ id: resource.$id, downloads: (resource.downloads || 0) + 1 });
        }
      } catch (error) {
          toast({ title: "Error", description: "Could not download file.", variant: "destructive" });
      }
  };

  const handlePreview = (fileId: string) => {
      try {
          const url = getFilePreview(fileId)?.href;
          if (url) window.open(url, '_blank');
      } catch (error) {
          toast({ title: "Error", description: "Could not get file preview.", variant: "destructive" });
      }
  };

  return (
    <div className="space-y-6">
      <TopNav title="Resources" subtitle="Educational materials and study resources" showGoBackButton={true} />
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resource Library</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}><Grid className="w-4 h-4" /></Button>
                <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
                {hasPermission('resources', 'create') && <Button onClick={() => handleOpenForm()}><Plus className="w-4 h-4 mr-2" />Upload</Button>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/></div>
              <div className="flex items-center space-x-4">
                <Select value={selectedType} onValueChange={setSelectedType}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="audio">Audio</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="link">Link</SelectItem></SelectContent></Select>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Subjects</SelectItem>{subjects.map((subject: string) => (<SelectItem key={subject} value={subject}>{subject}</SelectItem>))}</SelectContent></Select>
              </div>
            </div>

            {isLoading ? <div className="text-center py-8">Loading...</div> :
             filteredResources.length === 0 ? <div className="text-center py-8 text-muted-foreground">No resources found.</div> :
             viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredResources.map((resource: any) => {
                  const Icon = getTypeIcon(resource.type);
                  const canManage = hasPermission('resources', 'update') && (user?.$id === resource.uploadedBy || role === 'admin');
                  return (
                    <Card key={resource.$id} className="flex flex-col">
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center"><Icon className="text-primary text-xl" /></div>
                          {canManage && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => handleOpenForm(resource)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem><DropdownMenuItem onClick={() => {setResourceToDelete(resource); setIsDeleteDialogOpen(true);}} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
                        </div>
                        <h4 className="font-semibold text-foreground mb-2 line-clamp-2">{resource.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">{resource.description || "No description."}</p>
                        <div className="text-xs text-muted-foreground space-y-1 mb-4">
                            {resource.subject && <div><span className="font-medium">Subject:</span> {resource.subject}</div>}
                            {resource.class && <div><span className="font-medium">Class:</span> {resource.class}</div>}
                            <div>{resource.downloads || 0} downloads</div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <Button variant="outline" size="sm" onClick={() => handlePreview(resource.fileId)}><Eye className="w-4 h-4 mr-1" />Preview</Button>
                          <Button size="sm" onClick={() => handleDownload(resource)}><Download className="w-4 h-4 mr-1" />Download</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResources.map((resource: any) => {
                  const Icon = getTypeIcon(resource.type);
                  const canManage = hasPermission('resources', 'update') && (user?.$id === resource.uploadedBy || role === 'admin');
                  return (
                    <div key={resource.$id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="text-primary" /></div>
                      <div className="flex-1"><h4 className="font-semibold">{resource.title}</h4><p className="text-sm text-muted-foreground">{resource.subject || 'General'}{resource.class && ` - ${resource.class}`}</p></div>
                      <div className="text-sm text-muted-foreground">{resource.downloads || 0} downloads</div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handlePreview(resource.fileId)}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" onClick={() => handleDownload(resource)}><Download className="w-4 h-4" /></Button>
                        {canManage && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => handleOpenForm(resource)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem><DropdownMenuItem onClick={() => {setResourceToDelete(resource); setIsDeleteDialogOpen(true);}} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingResource ? "Edit Resource" : "Upload New Resource"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>)}/>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="audio">Audio</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="link">Link</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="subject" render={({ field }) => (<FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="class" render={({ field }) => (<FormItem><FormLabel>Class (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="isPublic" render={({ field }) => (<FormItem><FormLabel>Visibility</FormLabel><Select onValueChange={(val) => field.onChange(val === 'true')} defaultValue={String(field.value)}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="true">Public</SelectItem><SelectItem value="false">Private</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <FormItem>
                <FormLabel>{editingResource ? "Replace File (Optional)" : "File"}</FormLabel>
                <FormControl>
                  <div>
                    <Input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden"/>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full"><Upload className="w-4 h-4 mr-2" />{selectedFile ? selectedFile.name : "Choose a file"}</Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit">Submit</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the resource and its associated file.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}