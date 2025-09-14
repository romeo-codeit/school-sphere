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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useExams } from "@/hooks/useExams";
import { useAuth } from "@/hooks/useAuth";

const examFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["jamb", "waec", "neco", "internal"]),
  subject: z.string().min(1, "Subject is required"),
  duration: z.string().optional(),
  totalMarks: z.string().optional(),
  passingMarks: z.string().optional(),
  questions: z.string(),
});

type ExamFormData = z.infer<typeof examFormSchema>;

interface UploadExamFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadExamForm({ open, onOpenChange }: UploadExamFormProps) {
  const { toast } = useToast();
  const { createExam } = useExams();
  const { user } = useAuth();

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      type: "internal",
      subject: "",
      duration: "",
      totalMarks: "",
      passingMarks: "",
      questions: "[]",
    },
  });

  const onSubmit = async (data: ExamFormData) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }
    try {
      let questions;
      try {
        questions = JSON.parse(data.questions);
      } catch (e) {
        toast({
          title: "Error",
          description: "Invalid JSON format for questions",
          variant: "destructive",
        });
        return;
      }

      const numericData = {
        ...data,
        questions,
        duration: data.duration ? parseInt(data.duration, 10) : undefined,
        totalMarks: data.totalMarks ? parseInt(data.totalMarks, 10) : undefined,
        passingMarks: data.passingMarks ? parseInt(data.passingMarks, 10) : undefined,
      };

      await createExam({
        ...numericData,
        createdBy: user.$id,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Exam uploaded successfully",
      });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload exam",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload New Exam Questions</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <FormLabel>Exam Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="jamb">JAMB</SelectItem>
                        <SelectItem value="waec">WAEC</SelectItem>
                        <SelectItem value="neco">NECO</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Marks</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passingMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Marks</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="questions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Questions (JSON Array)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={10} placeholder={`[{"question":"What is...?","options":["A","B"],"correctAnswer":"A"}]`} />
                  </FormControl>
                  <FormDescription>
                    Enter exam questions as a JSON array. Each object should have 'question' (string), 'options' (array of strings), and 'correctAnswer' (string).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Upload Exam
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
