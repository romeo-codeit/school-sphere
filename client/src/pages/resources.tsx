import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  BookOpen, 
  Search, 
  Plus, 
  Upload,
  Download,
  Eye,
  FileText,
  Video,
  Music,
  Image,
  Link,
  Filter,
  Grid,
  List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResources } from "@/hooks/useResources";

const resourceFormSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  type: z.string(),
  subject: z.string().optional(),
  class: z.string().optional(),
  fileUrl: z.string(),
  isPublic: z.boolean(),
});

type ResourceFormData = z.infer<typeof resourceFormSchema>;

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  const { resources, isLoading, createResource } = useResources();

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "pdf",
      subject: "",
      class: "",
      fileUrl: "",
      isPublic: true,
    },
  });

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

  const subjects = [...new Set(resources?.map((r: any) => r.subject).filter(Boolean))] || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf": return FileText;
      case "video": return Video;
      case "audio": return Music;
      case "image": return Image;
      case "link": return Link;
      default: return FileText;
    }
  };

  const onSubmit = async (data: ResourceFormData) => {
    try {
      await createResource(data);
      toast({
        title: "Success",
        description: "Resource uploaded successfully",
      });
      setIsUploadOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload resource",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <TopNav title="Resources" subtitle="Educational materials and study resources" />
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="text-primary text-xl" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Total Resources</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="text-total-resources">
                {resourceStats.total}
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="text-secondary text-xl" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">PDFs</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="text-pdf-count">
                {resourceStats.pdf}
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Video className="text-accent text-xl" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Videos</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="text-video-count">
                {resourceStats.video}
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Music className="text-primary text-xl" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Audio</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="text-audio-count">
                {resourceStats.audio}
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Link className="text-secondary text-xl" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Links</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="text-link-count">
                {resourceStats.link}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resource Library</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-grid-view"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="button-list-view"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-upload-resource">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload New Resource</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-resource-title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} data-testid="textarea-resource-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Resource Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-resource-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="audio">Audio</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="link">External Link</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Mathematics, English" data-testid="input-resource-subject" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="class"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Class (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., SS 2" data-testid="input-resource-class" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="fileUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>File URL or Upload</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <Input {...field} placeholder="Enter file URL or upload file" data-testid="input-resource-url" />
                                  <Button type="button" variant="outline" className="w-full" data-testid="button-upload-file">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload File
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" data-testid="button-submit-resource">
                            Upload Resource
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-resources"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32" data-testid="select-filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-40" data-testid="select-filter-subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject: string) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resource Types Tabs */}
            <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All ({resourceStats.total})</TabsTrigger>
                <TabsTrigger value="pdf">PDF ({resourceStats.pdf})</TabsTrigger>
                <TabsTrigger value="video">Video ({resourceStats.video})</TabsTrigger>
                <TabsTrigger value="audio">Audio ({resourceStats.audio})</TabsTrigger>
                <TabsTrigger value="image">Images ({resourceStats.image})</TabsTrigger>
                <TabsTrigger value="link">Links ({resourceStats.link})</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Resources Display */}
            {isLoading ? (
              <div className="text-center py-8">Loading resources...</div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No resources found matching your search." : "No resources available."}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredResources.map((resource: any) => {
                  const Icon = getTypeIcon(resource.type);
                  return (
                    <Card key={resource.$id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="text-primary text-xl" />
                          </div>
                          <Badge variant="outline">
                            {resource.type.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <h4 className="font-semibold text-foreground mb-2 line-clamp-2" data-testid={`text-resource-title-${resource.$id}`}>
                          {resource.title}
                        </h4>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-resource-description-${resource.$id}`}>
                          {resource.description || "No description available"}
                        </p>
                        
                        <div className="space-y-2 mb-4">
                          {resource.subject && (
                            <div className="text-xs">
                              <span className="font-medium">Subject:</span> {resource.subject}
                            </div>
                          )}
                          {resource.class && (
                            <div className="text-xs">
                              <span className="font-medium">Class:</span> {resource.class}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {resource.downloads || 0} downloads
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Button variant="outline" size="sm" data-testid={`button-preview-resource-${resource.$id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" data-testid={`button-download-resource-${resource.$id}`}>
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResources.map((resource: any) => {
                  const Icon = getTypeIcon(resource.type);
                  return (
                    <div
                      key={resource.$id}
                      className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="text-primary" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground" data-testid={`text-resource-title-${resource.$id}`}>
                              {resource.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-1">
                              {resource.description || "No description available"}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{resource.subject}</span>
                              {resource.class && <span>{resource.class}</span>}
                              <span>{resource.downloads || 0} downloads</span>
                              <span>{new Date(resource.$createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant="outline">
                              {resource.type.toUpperCase()}
                            </Badge>
                            <Button variant="outline" size="sm" data-testid={`button-preview-resource-${resource.$id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" data-testid={`button-download-resource-${resource.$id}`}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
