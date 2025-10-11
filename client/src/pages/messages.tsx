import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  MessageSquare, 
  Search, 
  Plus, 
  Send,
  Inbox,
  Forward,
  Users,
  Megaphone,
  Eye,
  Reply
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";

const messageFormSchema = z.object({
  recipientId: z.string(),
  subject: z.string(),
  content: z.string(),
  messageType: z.string(),
});

type MessageFormData = z.infer<typeof messageFormSchema>;

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { messages, isLoading, createMessage } = useMessages();

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      subject: "",
      content: "",
      messageType: "personal",
    },
  });

  const filteredMessages = messages?.filter((message: any) => {
    const matchesSearch = message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || message.messageType === selectedType;
    return matchesSearch && matchesType;
  }) || [];

  const messageStats = {
    total: messages?.length || 0,
    unread: messages?.filter((m: any) => !m.isRead).length || 0,
    sent: messages?.filter((m: any) => m.senderId === user?.$id).length || 0,
    received: messages?.filter((m: any) => m.recipientId === user?.$id).length || 0,
  };

  const onSubmit = async (data: MessageFormData) => {
    try {
      await createMessage({ ...data, senderId: user?.$id, isRead: false });
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      setIsComposeOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <TopNav title="Messages" subtitle="Communication hub for teachers, students, and parents" showGoBackButton={true} />
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Messages</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-total-messages">
                    {messageStats.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Unread</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-unread-messages">
                    {messageStats.unread}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Inbox className="text-accent text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Forward</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-sent-messages">
                    {messageStats.sent}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Forward className="text-secondary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Received</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-received-messages">
                    {messageStats.received}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Message Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant={selectedType === "all" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setSelectedType("all")}
                data-testid="button-filter-all"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                All Messages
                <Badge variant="secondary" className="ml-auto">
                  {messageStats.total}
                </Badge>
              </Button>
              
              <Button 
                variant={selectedType === "personal" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setSelectedType("personal")}
                data-testid="button-filter-personal"
              >
                <Users className="w-4 h-4 mr-2" />
                Personal
              </Button>
              
              <Button 
                variant={selectedType === "announcement" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setSelectedType("announcement")}
                data-testid="button-filter-announcements"
              >
                <Megaphone className="w-4 h-4 mr-2" />
                Announcements
              </Button>
              
              <Button 
                variant={selectedType === "notification" ? "default" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setSelectedType("notification")}
                data-testid="button-filter-notifications"
              >
                <Inbox className="w-4 h-4 mr-2" />
                Notifications
              </Button>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-compose-message">
                      <Plus className="w-4 h-4 mr-2" />
                      Compose Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="px-6 pt-6 pb-4">
                      <DialogTitle className="text-xl sm:text-2xl">Compose New Message</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground mt-2">
                        Send a message to students, teachers, or parents
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="overflow-y-auto px-6 flex-1">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="recipientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Recipient</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-recipient">
                                      <SelectValue placeholder="Select recipient" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all-students">All Students</SelectItem>
                                    <SelectItem value="all-teachers">All Teachers</SelectItem>
                                    <SelectItem value="all-parents">All Parents</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="messageType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-message-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="personal">Personal</SelectItem>
                                    <SelectItem value="announcement">Announcement</SelectItem>
                                    <SelectItem value="notification">Notification</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-message-subject" />
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
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  rows={6} 
                                  placeholder="Type your message here..."
                                  data-testid="textarea-message-content"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                          <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)} className="w-full sm:w-auto">
                            Cancel
                          </Button>
                          <Button type="submit" data-testid="button-send-message" className="w-full sm:w-auto">
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                        </div>
                      </form>
                    </Form>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-messages"
                />
              </div>

              {/* Messages List */}
              {isLoading ? (
                <div className="text-center py-8">Loading messages...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No messages found matching your search." : "No messages found."}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message: any) => (
                    <div
                      key={message.$id}
                      className={`p-4 border border-border rounded-lg hover:shadow-sm transition-shadow ${
                        !message.isRead ? "bg-accent/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {!message.isRead && (
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                            )}
                            <Badge 
                              variant="outline" 
                              className={
                                message.messageType === 'announcement' ? 'border-accent text-accent' :
                                message.messageType === 'notification' ? 'border-primary text-primary' :
                                'border-secondary text-secondary'
                              }
                            >
                              {message.messageType}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(message.$createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h4 className="font-medium text-foreground mb-1" data-testid={`text-message-subject-${message.$id}`}>
                            {message.subject || "No Subject"}
                          </h4>
                          
                          <p className="text-sm text-muted-foreground mb-2" data-testid={`text-message-preview-${message.$id}`}>
                            {message.content.substring(0, 120)}
                            {message.content.length > 120 && "..."}
                          </p>
                          
                          <div className="text-xs text-muted-foreground">
                            From: {message.senderId === user?.$id ? "You" : "System"}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm" data-testid={`button-read-message-${message.$id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {message.messageType === "personal" && (
                            <Button variant="outline" size="sm" data-testid={`button-reply-message-${message.$id}`}>
                              <Reply className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
