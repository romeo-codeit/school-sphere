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
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";

const announcementFormSchema = z.object({
  recipientType: z.enum(["all-students", "all-teachers", "all-parents", "all-users"]),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
});

type AnnouncementFormData = z.infer<typeof announcementFormSchema>;

interface SendAnnouncementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendAnnouncementForm({ open, onOpenChange }: SendAnnouncementFormProps) {
  const { toast } = useToast();
  const { createMessage } = useMessages();
  const { user } = useAuth();

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      recipientType: "all-students",
      subject: "",
      content: "",
    },
  });

  const onSubmit = async (data: AnnouncementFormData) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }
    try {
      // For simplicity, we'll send a single message with recipientType in subject/content
      // In a real app, this would iterate through users of the selected type and send individual messages
      await createMessage({
        senderId: user.$id,
        recipientId: data.recipientType, // This would be a list of actual user IDs in a real app
        subject: `Announcement to ${data.recipientType}: ${data.subject}`,
        content: data.content,
        messageType: "announcement",
        isRead: false,
      });
      toast({
        title: "Success",
        description: "Announcement sent successfully",
      });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send announcement",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modern-scrollbar">
        <DialogHeader>
          <DialogTitle>Send New Announcement</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all-students">All Students</SelectItem>
                      <SelectItem value="all-teachers">All Teachers</SelectItem>
                      <SelectItem value="all-parents">All Parents</SelectItem>
                      <SelectItem value="all-users">All Users</SelectItem>
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

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Send Announcement
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
