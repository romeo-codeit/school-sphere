import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useSubjects } from "@/hooks/useSubjects";
import { useForm } from "react-hook-form";
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
          <FormItem><FormLabel>Subject Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <DialogFooter>
          <Button type="submit">{subject ? "Save Changes" : "Create Subject"}</Button>
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
  const { subjects, isLoading, deleteSubject } = useSubjects();
  const { toast } = useToast();

  const handleAdd = () => {
    setSelectedSubject(null);
    setIsFormOpen(true);
  };

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

  const handleFormFinished = () => {
      setIsFormOpen(false);
      setSelectedSubject(null);
  }

  return (
    <div className="space-y-6">
      <TopNav title="Subjects" subtitle="Manage academic subjects" showGoBackButton={true} />
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subject Management</CardTitle>
              <Button onClick={handleAdd}><UserPlus className="w-4 h-4 mr-2" /> Add Subject</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <p>Loading subjects...</p> :
             <div className="rounded-md border">
                <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {subjects?.map((subject) => (
                            <TableRow key={subject.$id}>
                                <TableCell className="font-medium">{subject.name}</TableCell>
                                <TableCell>{subject.description}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(subject)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(subject.$id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
            }
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{selectedSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle></DialogHeader>
            <SubjectForm subject={selectedSubject} onFinished={handleFormFinished} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}