import { useState, useMemo } from "react";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForum, useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useUsers } from "@/hooks/useUsers";
import { AdminOrTeacher } from "@/components/RoleGuard";
import { PlusCircle, MessageSquare, Send, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Forum Components
function ForumList({ onSelectThread, userMap }: { onSelectThread: (thread: any) => void, userMap: Map<string, string> }) {
  const { threads, isLoadingThreads } = useForum();
  const { hasPermission } = useRole();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Forum Threads</CardTitle>
          {hasPermission("forum", "create") && (
            <NewThreadDialog />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingThreads ? (
          <p>Loading threads...</p>
        ) : (
          <div className="space-y-4">
            {threads?.map((thread: any) => (
              <Card
                key={thread.$id}
                onClick={() => onSelectThread(thread)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <CardHeader>
                  <CardTitle>{thread.title}</CardTitle>
                  <CardDescription>
                    By {userMap.get(thread.createdBy) || '...'} on {new Date(thread.$createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewThreadDialog() {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const { createThread } = useForum();
    const { user } = useAuth();
    const { toast } = useToast();

    const handleCreate = async () => {
        if (!user || !title || !content) return;
        try {
            await createThread({ title, content, createdBy: user.$id });
            toast({ title: "Success", description: "Thread created." });
            setOpen(false);
            setTitle("");
            setContent("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    New Thread
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Forum Thread</DialogTitle>
                    <DialogDescription>
                        Enter the title and content for your new discussion thread.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Thread Title"
                    />
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Thread Content"
                        rows={5}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={!title || !content}>Create Thread</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ThreadView({ thread, onBack, userMap }: { thread: any; onBack: () => void, userMap: Map<string, string> }) {
  const { useReplies, createReply } = useForum();
  const { data: replies, isLoading } = useReplies(thread.$id);
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const { hasPermission } = useRole();

  const handleReply = async () => {
    if (!user || !replyContent) return;
    await createReply({ content: replyContent, createdBy: user.$id, parentThreadId: thread.$id });
    setReplyContent("");
  };

  return (
    <div>
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Threads
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{thread.title}</CardTitle>
          <CardDescription>
            By {userMap.get(thread.createdBy) || '...'}
          </CardDescription>
          <p className="text-sm text-muted-foreground">{thread.content}</p>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Replies</h3>
          <div className="space-y-4">
            {isLoading ? <p>Loading replies...</p> : replies?.map((reply: any) => (
              <div key={reply.$id} className="p-3 rounded-md border bg-muted/20">
                <p className="font-semibold text-sm">{userMap.get(reply.createdBy) || '...'}</p>
                <p className="text-foreground mt-1">{reply.content}</p>
              </div>
            ))}
          </div>
          {hasPermission("forum", "create") && (
            <div className="mt-6">
              <Textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Write a reply..." />
              <Button onClick={handleReply} className="mt-2">Post Reply</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Chat Components
function ChatView({ userMap }: { userMap: Map<string, string> }) {
    // For simplicity, we'll use a hardcoded conversation ID.
    // A real app would have a way to select conversations.
    const conversationId = "general-chat";
    const { messages, isLoadingMessages, sendMessage } = useChat(conversationId);
    const { user } = useAuth();
    const [message, setMessage] = useState("");

    const handleSend = async () => {
        if (!user || !message) return;
        await sendMessage({ content: message, senderId: user.$id, conversationId });
        setMessage("");
    };

    return (
        <Card className="h-[70vh] flex flex-col">
            <CardHeader>
                <CardTitle>General Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                {isLoadingMessages ? <p>Loading...</p> : messages?.map((msg: any) => (
                    <div key={msg.$id} className="flex items-start space-x-3 my-2">
                        <Avatar>
                            <AvatarFallback>{(userMap.get(msg.senderId) || '??').slice(0,2)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold">{userMap.get(msg.senderId) || 'Unknown User'}</p>
                            <p>{msg.content}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
            <div className="p-4 border-t">
                <div className="flex space-x-2">
                    <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && handleSend()} />
                    <Button onClick={handleSend}><Send className="w-4 h-4" /></Button>
                </div>
            </div>
        </Card>
    );
}


export default function Communications() {
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const { users } = useUsers();

  const userMap = useMemo(() => {
    if (!users) return new Map();
    return users.reduce((acc: any, user: any) => {
      acc.set(user.$id, user.name || user.email);
      return acc;
    }, new Map());
  }, [users]);

  return (
    <div className="space-y-6">
      <TopNav
        title="Communications"
        subtitle="Engage in discussions and chats"
      />
      <div className="p-6">
        <Tabs defaultValue="forum">
          <TabsList>
            <TabsTrigger value="forum">
              <MessageSquare className="w-4 h-4 mr-2" /> Forum
            </TabsTrigger>
            <TabsTrigger value="chat">
              <Send className="w-4 h-4 mr-2" /> Chat
            </TabsTrigger>
          </TabsList>
          <TabsContent value="forum" className="mt-6">
            {selectedThread ? (
              <ThreadView
                thread={selectedThread}
                onBack={() => setSelectedThread(null)}
                userMap={userMap}
              />
            ) : (
              <ForumList onSelectThread={setSelectedThread} userMap={userMap} />
            )}
          </TabsContent>
          <TabsContent value="chat" className="mt-6">
            <ChatView userMap={userMap} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
