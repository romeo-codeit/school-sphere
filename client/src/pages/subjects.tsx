import { useState } from "react";
import React from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/useSubjects";
import { useForm } from "react-hook-form";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import ErrorBoundary from "@/components/ui/error-boundary";
import { useSubjectsPerformanceTest, logSubjectsPerformanceMetrics } from '@/hooks/useSubjectsPerformanceTest';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const subjectFormSchema = z.object({
  name: z.string().min(1, "Subject name is required."),
  description: z.string().optional(),
});

type SubjectFormData = z.infer<typeof subjectFormSchema>;

function SubjectForm({ subject, onFinished }: { subject?: any; onFinished: () => void }) {
  const { toast } = useToast();
  const { createSubject, updateSubject } = useSubjects();
  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: subject?.name || "",
      description: subject?.description || "",
    },
  });

  const onSubmit = async (data: SubjectFormData) => {
    try {
      if (subject) {
        await updateSubject({ subjectId: subject.$id, subjectData: data });
        toast({ title: "Success", description: "Subject updated successfully." });
      } else {
        await createSubject(data);
        toast({ title: "Success", description: "Subject created successfully." });
      }
      onFinished();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="block mb-1">Subject Name</FormLabel>
            <FormControl><Input {...field} className="w-full" /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel className="block mb-1">Description</FormLabel>
            <FormControl><Textarea {...field} className="w-full" /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <DialogFooter>
          <Button type="submit" className="w-full sm:w-auto">{subject ? "Save Changes" : "Create Subject"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function SubjectsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const { subjects, isLoading, error, deleteSubject } = useSubjects();
  const { toast } = useToast();

  const { testPerformance, clearCache } = useSubjectsPerformanceTest();

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logSubjectsPerformanceMetrics(metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).subjectsPerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
    }
  }, []);

  const handleEdit = (subject: any) => {
    setSelectedSubject(subject);
    setIsFormOpen(true);
  };

  const handleDelete = (subjectId: string) => {
    setSubjectToDelete(subjectId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (subjectToDelete) {
      try {
        await deleteSubject(subjectToDelete);
        toast({ title: "Success", description: "Subject deleted successfully." });
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setSubjectToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedSubject(null);
    }
  };

  return (
    <>
      <TopNav title="Subjects" subtitle="Manage subjects and curriculum" showGoBackButton={true} />
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <ErrorBoundary>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl">Subject Management</CardTitle>
                  <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto"><UserPlus className="w-4 h-4 mr-2" /> Add Subject</Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? <TableSkeleton columns={3} rows={5} /> : error ? (
                  <div className="text-center py-8 text-destructive">Error loading subjects</div>
                ) : (
                  <>
                    {/* Mobile: Card view */}
                    <div className="grid grid-cols-1 gap-4 sm:hidden">
                      {subjects && subjects.map((subject: any) => (
                        <Card key={subject.$id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold text-base">{subject.name}</div>
                              <div className="text-xs text-muted-foreground">{subject.description}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2 justify-end">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="outline" onClick={() => handleEdit(subject)}><Edit /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Edit</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="destructive" onClick={() => { setSubjectToDelete(subject.$id); setIsDeleteDialogOpen(true); }}><Trash2 /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </Card>
                      ))}
                    </div>
                    {/* Desktop: Table view */}
                    <div className="rounded-md border overflow-x-auto hidden sm:block">
                      <Table className="min-w-[700px] text-xs sm:text-sm lg:text-base">
                        <TableHeader>
                          <TableRow><TableHead>Subject</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                          {subjects && subjects.map((subject: any) => (
                            <TableRow key={subject.$id}>
                              <TableCell>
                                <div className="font-medium text-sm sm:text-base">{subject.name}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">{subject.description}</div>
                              </TableCell>
                              <TableCell>{subject.description}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(subject)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSubjectToDelete(subject.$id); setIsDeleteDialogOpen(true); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </ErrorBoundary>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedSubject ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
            <SubjectForm subject={selectedSubject} onFinished={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the subject record.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async () => { await deleteSubject(subjectToDelete!); setIsDeleteDialogOpen(false); setSubjectToDelete(null); }}>Continue</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
