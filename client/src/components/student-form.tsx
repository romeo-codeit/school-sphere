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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useStudents } from "@/hooks/useStudents";
import { useQuery } from "@tanstack/react-query";
import { getAllClasses } from "@/lib/api/attendance";
import { useEffect } from "react";

const studentFormSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  classId: z.string().min(1, 'Class assignment is required'),
  status: z.string(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any | null;
}

export function StudentForm({ open, onOpenChange, student }: StudentFormProps) {
  const { toast } = useToast();
  const { createStudent, updateStudent } = useStudents();
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
      queryKey: ['classes'],
      queryFn: getAllClasses
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
  });

  useEffect(() => {
    if (student) {
      form.reset({
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : "",
        address: student.address,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        classId: student.classId,
        status: student.status,
      });
    } else {
      form.reset({
        studentId: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        classId: "",
        status: "active",
      });
    }
  }, [student, open, form]);

  const onSubmit = async (data: StudentFormData) => {
    try {
      if (student) {
        await updateStudent({ studentId: student.$id, studentData: data });
        toast({ title: "Success", description: "Student updated successfully" });
      } else {
        await createStudent(data);
        toast({ title: "Success", description: "Student created successfully" });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save student", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg md:max-w-xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <div className="flex-none px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 modern-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="studentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block mb-1 sm:mb-0">Student ID</FormLabel>
                    <FormControl><Input {...field} className="w-full" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="classId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block mb-1 sm:mb-0">Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger disabled={isLoadingClasses}><SelectValue placeholder="Select a class" /></SelectTrigger></FormControl>
                      <SelectContent>{classes?.map(c => (<SelectItem key={c.$id} value={c.$id}>{c.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
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
              )}/>
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
              )}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 sm:mb-0">Date of Birth</FormLabel>
                  <FormControl><Input type="date" {...field} className="w-full" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
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
              )}/>
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel className="block mb-1 sm:mb-0">Address</FormLabel>
                <FormControl><Textarea {...field} className="w-full" /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-foreground">Parent/Guardian Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="parentName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block mb-1 sm:mb-0">Parent Name</FormLabel>
                    <FormControl><Input {...field} className="w-full" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="parentPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block mb-1 sm:mb-0">Parent Phone</FormLabel>
                    <FormControl><Input {...field} className="w-full" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="parentEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-1 sm:mb-0">Parent Email</FormLabel>
                  <FormControl><Input type="email" {...field} className="w-full" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel className="block mb-1 sm:mb-0">Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
                </Select>
              <FormMessage />
                </FormItem>
              )}/>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" className="w-full sm:w-auto">{student ? "Update Student" : "Create Student"}</Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}