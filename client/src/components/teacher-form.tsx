import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTeachers } from "@/hooks/useTeachers";
import { useSubjects } from "@/hooks/useSubjects";
import { MultiSelect } from "@/components/ui/multi-select";
import { useEffect } from "react";

const teacherFormSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  gender: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  qualification: z.string().optional(),
  experience: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().optional()
  ),
  status: z.string(),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: any | null;
}

export function TeacherForm({ open, onOpenChange, teacher }: TeacherFormProps) {
  const { toast } = useToast();
  const { createTeacher, updateTeacher } = useTeachers();
  const { subjects, isLoading: isLoadingSubjects } = useSubjects();

  const subjectOptions = subjects?.map(s => ({ value: s.name, label: s.name })) || [];

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
  });

  useEffect(() => {
    if (teacher) {
      form.reset({
        employeeId: teacher.employeeId || "",
        firstName: teacher.firstName || "",
        lastName: teacher.lastName || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        subjects: teacher.subjects || [],
        qualification: teacher.qualification || "",
        experience: teacher.experience?.toString() || "",
        status: teacher.status || "active"
      });
    }
  }, [teacher, form]);

  const onSubmit = async (data: TeacherFormData) => {
    try {
      if (teacher) {
        await updateTeacher({ teacherId: teacher.$id, teacherData: data });
        toast({ title: "Teacher updated successfully" });
      } else {
        await createTeacher(data);
        toast({ title: "Teacher created successfully" });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg md:max-w-xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <div className="flex-none px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle>{teacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 modern-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="employeeId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 sm:mb-0">Employee ID</FormLabel>
                  <FormControl><Input {...field} className="w-full" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 sm:mb-0">First Name</FormLabel>
                  <FormControl><Input {...field} className="w-full" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 sm:mb-0">Last Name</FormLabel>
                  <FormControl><Input {...field} className="w-full" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 sm:mb-0">Email</FormLabel>
                  <FormControl><Input type="email" {...field} className="w-full" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 sm:mb-0">Phone</FormLabel>
                  <FormControl><Input {...field} className="w-full" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel className="block mb-1 sm:mb-0">Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="subjects" render={({ field }) => (
              <FormItem>
                <FormLabel className="block mb-1 sm:mb-0">Subjects</FormLabel>
                <MultiSelect
                  options={subjectOptions}
                  selected={field.value || []}
                  onChange={field.onChange}
                  className="w-full"
                />
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="qualification" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 sm:mb-0">Qualification</FormLabel>
                  <FormControl><Input {...field} className="w-full" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="experience" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 sm:mb-0">Experience (years)</FormLabel>
                  <FormControl><Input type="number" {...field} className="w-full" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel className="block mb-1 sm:mb-0">Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {teacher ? "Update Teacher" : "Create Teacher"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
