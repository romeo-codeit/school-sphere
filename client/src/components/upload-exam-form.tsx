import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { useExams } from "@/hooks/useExams";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const examFormSchema = z.object({
  title: z.string().min(1, "Title is required."),
  type: z.enum(["jamb", "waec", "neco", "internal"]),
  subject: z.string().min(1, "Subject is required."),
  duration: z.coerce.number().int().positive("Duration must be a positive number."),
  totalMarks: z.coerce.number().int().positive("Total marks must be a positive number."),
  passingMarks: z.coerce.number().int().positive("Passing marks must be a positive number."),
  isActive: z.boolean().default(true),
  questions: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch (e) {
      return false;
    }
  }, {
    message: "Questions must be a valid JSON array and cannot be empty.",
  }),
});

type ExamFormData = z.infer<typeof examFormSchema>;

export function UploadExamForm({ onFinished }: { onFinished: () => void }) {
  const { createExam } = useExams();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      type: "internal",
      subject: "",
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
      isActive: true,
      questions: "[]",
    },
  });

  const onSubmit = async (data: ExamFormData) => {
    try {
      await createExam({
        ...data,
        createdBy: user?.$id,
      });
      toast({ title: "Success", description: "Exam created successfully." });
      onFinished();
    } catch (error: any) {
      toast({
        title: "Error creating exam",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 modern-scrollbar">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem><FormLabel>Exam Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an exam type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="jamb">JAMB</SelectItem><SelectItem value="waec">WAEC</SelectItem><SelectItem value="neco">NECO</SelectItem><SelectItem value="internal">Internal</SelectItem></SelectContent></Select><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="subject" render={({ field }) => (
          <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField control={form.control} name="duration" render={({ field }) => (
            <FormItem><FormLabel>Duration (mins)</FormLabel><FormControl><Input type="number" {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="totalMarks" render={({ field }) => (
            <FormItem><FormLabel>Total Marks</FormLabel><FormControl><Input type="number" {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="passingMarks" render={({ field }) => (
            <FormItem><FormLabel>Passing Marks</FormLabel><FormControl><Input type="number" {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
          )}/>
        </div>
        <FormField control={form.control} name="questions" render={({ field }) => (
          <FormItem>
            <FormLabel>Questions (JSON format)</FormLabel>
            <FormControl><Textarea {...field} rows={8} placeholder='[{"question": "What is 2+2?", "options": ["3", "4", "5"], "answer": "4"}]' className="w-full" /></FormControl>
            <FormDescription>Enter questions as a JSON array.</FormDescription>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel>Activate Exam</FormLabel>
                    <FormDescription>
                        Make this exam available for students to take.
                    </FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
        )}/>
        <Button type="submit" className="w-full sm:w-auto">Create Exam</Button>
      </form>
    </Form>
  );
}