import React, { useState, useEffect, useMemo, useRef } from "react";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useConversations, useChat, useUsers, useForum } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { PlusCircle, Send, MessageSquare, MessageCircle, ArrowLeft, MoreHorizontal, Edit, Trash2, Search, Users, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useCommunicationsPerformanceTest, logCommunicationsPerformanceMetrics } from '@/hooks/useCommunicationsPerformanceTest';

// --- FORUM COMPONENTS ---

function EditPostDialog({ post, onUpdate }: { post: any, onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState(post.content);
    const { updatePost } = useForum();
    const { toast } = useToast();

    const handleUpdate = async () => {
        if (!content) return;
        try {
            await updatePost({ postId: post.$id, data: { content } });
            toast({ title: "Success", description: "Post updated." });
            setOpen(false);
            onUpdate();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl">Edit Post</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-2">
                    Update your announcement or post
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="min-h-[150px]" placeholder="Write your message here..." />
                </div>
                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button onClick={handleUpdate} className="w-full sm:w-auto">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PostItem({ post, isReply = false }: { post: any, isReply?: boolean }) {
    const { user } = useAuth();
    const { users } = useUsers();
    const { deletePost, useReplies } = useForum();
    const { refetch } = useReplies(post.parentThreadId);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const author = useMemo(() => users?.find(u => u.$id === post.createdBy), [users, post.createdBy]);
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            await deletePost(post.$id);
            toast({ title: "Success", description: "Post deleted." });
            refetch();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className={cn("flex space-x-4", isReply && "ml-8")}>
            <Avatar>
                <AvatarImage src={author?.avatarUrl} />
                <AvatarFallback>{author?.name?.slice(0, 2) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <p className="font-bold">{author?.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.$createdAt))} ago</p>
                    </div>
                    {user?.$id === post.createdBy && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <EditPostDialog post={post} onUpdate={refetch} />
                                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                <p className="mt-1">{post.content}</p>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function ThreadView({ thread, onBack }: { thread: any; onBack: () => void }) {
    const { useReplies, createReply } = useForum();
    const { data: replies, isLoading } = useReplies(thread.$id);
    const { user } = useAuth();
    const [replyContent, setReplyContent] = useState("");

    const handleReply = async () => {
        if (!user || !replyContent) return;
        await createReply({ content: replyContent, createdBy: user.$id, parentThreadId: thread.$id });
        setReplyContent("");
    };

    return (
        <div>
            <Button onClick={onBack} variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Threads</Button>
            <Card>
                <CardHeader>
                    <CardTitle>{thread.title}</CardTitle>
                    <PostItem post={thread} />
                </CardHeader>
                <CardContent className="space-y-6">
                    <h3 className="font-bold text-lg">Replies</h3>
                    {isLoading ? <p>Loading replies...</p> : replies?.map((reply: any) => <PostItem key={reply.$id} post={reply} isReply />)}
                    <div className="ml-8">
                        <Textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Write a reply..." />
                        <Button onClick={handleReply} className="mt-2" disabled={!replyContent}>Post Reply</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ForumList({ onSelectThread }: { onSelectThread: (thread: any) => void }) {
  const { threads, isLoadingThreads } = useForum();
  return (
    <Card>
      <CardHeader><CardTitle>Forum</CardTitle></CardHeader>
      <CardContent>
        {isLoadingThreads ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : threads && threads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No Forum Discussions"
            description="There are no forum threads yet. Be the first to start a discussion!"
          />
        ) : (
         threads?.map((thread: any) => (
          <Card key={thread.$id} onClick={() => onSelectThread(thread)} className="cursor-pointer hover:bg-muted/50 mb-4">
            <CardHeader><CardTitle>{thread.title}</CardTitle><CardDescription>Created {formatDistanceToNow(new Date(thread.$createdAt))} ago</CardDescription></CardHeader>
          </Card>
        )))}
      </CardContent>
    </Card>
  );
}

// --- CHAT COMPONENTS ---

function NewChatDialog({ onConversationCreated }: { onConversationCreated: (id: string) => void }) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { users, isLoading } = useUsers();
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const { createConversation } = useChat("");
    const { user: currentUser } = useAuth();
    const { toast } = useToast();

    const handleSelectUser = (user: any) => {
        setSelectedUsers(prev => prev.some(su => su.$id === user.$id) ? prev.filter(su => su.$id !== user.$id) : [...prev, user]);
    };

    const handleCreateConversation = async () => {
        if (!currentUser || selectedUsers.length === 0) return;
        const memberIds = [currentUser.$id, ...selectedUsers.map(u => u.userId)].filter(Boolean);
        const isGroup = memberIds.length > 2;
        const otherUsersName = selectedUsers.map(u => u.firstName || u.name).join(', ');
        const conversationName = isGroup ? `Group Chat with ${otherUsersName}` : `Chat with ${otherUsersName}`;

        try {
            const newConversation = await createConversation({ members: memberIds, isGroup, name: conversationName });
            toast({ title: "Success", description: "Conversation started successfully!" });
            setOpen(false);
            setSelectedUsers([]);
            setSearchQuery("");
            onConversationCreated(newConversation!.$id);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to start conversation", variant: "destructive" });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const filteredUsers = users?.filter(u => {
        if (u.$id === currentUser?.$id) return false;
        const fullName = u.firstName ? `${u.firstName} ${u.lastName}` : u.name;
        return fullName.toLowerCase().includes(searchQuery.toLowerCase());
    }) || [];

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'teacher': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'student': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'parent': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    New Message
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[600px] p-0 gap-0 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b">
                    <DialogTitle className="text-2xl font-semibold">New Message</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                        Select people to start a conversation
                    </DialogDescription>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10"
                        />
                    </div>
                </div>

                {/* Selected Users Pills */}
                {selectedUsers.length > 0 && (
                    <div className="px-6 py-3 border-b bg-muted/30">
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(user => (
                                <div
                                    key={user.$id}
                                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium"
                                >
                                    <span>{user.firstName || user.name}</span>
                                    <button
                                        onClick={() => handleSelectUser(user)}
                                        className="hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* User List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-muted-foreground">Loading users...</div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                            <p className="text-muted-foreground">
                                {searchQuery ? 'No users found' : 'No users available'}
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredUsers.map(user => {
                                const isSelected = selectedUsers.some(su => su.$id === user.$id);
                                const fullName = user.firstName ? `${user.firstName} ${user.lastName}` : user.name;
                                const roleLabel = user.role === 'teacher' ? 'Teacher' : user.role === 'student' ? 'Student' : user.role === 'parent' ? 'Parent' : 'Admin';

                                return (
                                    <div
                                        key={user.$id}
                                        onClick={() => handleSelectUser(user)}
                                        className={cn(
                                            "flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors",
                                            isSelected ? "bg-accent/50" : "hover:bg-accent/30"
                                        )}
                                    >
                                        {/* Avatar */}
                                        <div className={cn(
                                            "flex items-center justify-center w-11 h-11 rounded-full font-semibold text-sm",
                                            user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                                            user.role === 'student' ? 'bg-green-100 text-green-700' :
                                            user.role === 'parent' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-700'
                                        )}>
                                            {getInitials(fullName)}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{fullName}</div>
                                            <div className={cn(
                                                "inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1",
                                                getRoleBadgeColor(user.role)
                                            )}>
                                                {roleLabel}
                                            </div>
                                        </div>

                                        {/* Checkbox */}
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                        )}>
                                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/20">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            {selectedUsers.length > 0 ? (
                                <span>{selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} selected</span>
                            ) : (
                                <span>Select people to continue</span>
                            )}
                        </div>
                        <Button
                            onClick={handleCreateConversation}
                            disabled={selectedUsers.length === 0}
                            size="lg"
                            className="min-w-[120px]"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Start Chat
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ConversationList({ onSelect, selectedConversationId }: { onSelect: (id: string) => void, selectedConversationId: string | null }) {
    const { conversations, isLoading } = useConversations();
    const { user } = useAuth();
    const { users } = useUsers();

    const getConversationName = (conv: any) => {
        if (conv.isGroup) return conv.name;
        const otherMemberId = conv.members.find((id: string) => id !== user?.$id);
        const otherUser = users?.find(u => u.userId === otherMemberId);
        return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Unknown User";
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : conversations && conversations.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={MessageCircle}
                      title="No Conversations"
                      description="Start a new chat to connect with teachers, students, or parents."
                    />
                  </div>
                ) : (
                 conversations?.map(conv => (
                    <div key={conv.$id} onClick={() => onSelect(conv.$id)} className={cn("p-4 border-b cursor-pointer hover:bg-muted/50", selectedConversationId === conv.$id && "bg-accent")}>
                        <p className="font-semibold">{getConversationName(conv)}</p>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || "No messages yet."}</p>
                    </div>
                )))}
            </div>
            <div className="p-4 border-t">
                <NewChatDialog onConversationCreated={onSelect} />
            </div>
        </div>
    );
}

function ChatPanel({ conversationId, onBack }: { conversationId: string | null, onBack?: () => void }) {
    const { conversations } = useConversations();
    const { messages, isLoadingMessages, sendMessage } = useChat(conversationId!);
    const { user } = useAuth();
    const { users } = useUsers();
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

    const conversation = useMemo(() => conversations?.find(c => c.$id === conversationId), [conversations, conversationId]);

    const getConversationName = (conv: any) => {
        if (!conv) return "Chat";
        if (conv.isGroup) return conv.name;
        const otherMemberId = conv.members.find((id: string) => id !== user?.$id);
        const otherUser = users?.find(u => u.userId === otherMemberId);
        return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Unknown User";
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSend = async () => {
        if (!user || !message || !conversationId) return;
        await sendMessage({ content: message, senderId: user.$id, conversationId });
        setMessage("");
    };

    const getUserDetails = (senderId: string) => users?.find(u => u.userId === senderId);

    if (!conversationId) {
        return (
            <div className="hidden md:flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to start chatting.
            </div>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                    {isMobile && onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <CardTitle>{getConversationName(conversation)}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`flex items-end space-x-3 ${i % 2 === 0 ? '' : 'justify-end'} animate-pulse`}>
                        {i % 2 === 0 && <div className="w-8 h-8 bg-gray-200 rounded-full"></div>}
                        <div className={`max-w-xs px-4 py-2 rounded-lg ${i % 2 === 0 ? 'bg-gray-200' : 'bg-blue-200'}`}>
                          <div className="h-4 bg-gray-100 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-100 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) :
                 messages?.map((msg: any) => {
                    const sender = getUserDetails(msg.senderId);
                    const isCurrentUser = msg.senderId === user?.$id;
                    return (
                        <div key={msg.$id} className={cn("flex items-end space-x-3", isCurrentUser && "justify-end")}>
                            {!isCurrentUser && (
                                <Avatar className="w-8 h-8"><AvatarImage src={sender?.avatarUrl} /><AvatarFallback>{sender?.firstName?.[0] || 'U'}</AvatarFallback></Avatar>
                            )}
                            <div className={cn("max-w-xs lg:max-w-md p-3 rounded-lg", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                {!isCurrentUser && <p className="font-bold text-sm mb-1">{sender?.firstName ? `${sender.firstName} ${sender.lastName}` : 'Unknown User'}</p>}
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs text-right mt-1 opacity-70">{formatDistanceToNow(new Date(msg.$createdAt), { addSuffix: true })}</p>
                            </div>
                             {isCurrentUser && (
                                <Avatar className="w-8 h-8"><AvatarImage src={sender?.avatarUrl} /><AvatarFallback>{sender?.firstName?.[0] || 'U'}</AvatarFallback></Avatar>
                            )}
                        </div>
                    );
                 })}
                 <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-4 border-t">
                <div className="flex space-x-2">
                    <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && handleSend()} />
                    <Button onClick={handleSend} disabled={!message}><Send className="w-4 h-4" /></Button>
                </div>
            </div>
        </Card>
    );
}


// --- MAIN COMPONENT ---

export default function Communications() {
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { testPerformance, clearCache } = useCommunicationsPerformanceTest();

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logCommunicationsPerformanceMetrics('Performance Test Completed', metrics.totalTime, metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).communicationsPerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
    }
  }, []);

    return (
        <div className="space-y-6">
            <TopNav title="Communications" subtitle="Engage in forum discussions and private chats" showGoBackButton={true} />
            <ErrorBoundary>
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                <Tabs defaultValue="forum">
                    <TabsList>
                        <TabsTrigger value="forum">Forum</TabsTrigger>
                        <TabsTrigger value="chat">Chat</TabsTrigger>
                    </TabsList>
                    <TabsContent value="forum" className="mt-4">
                        <div className="w-full mx-auto">
                            {selectedThread ? <ThreadView thread={selectedThread} onBack={() => setSelectedThread(null)} /> : <ForumList onSelectThread={setSelectedThread} />}
                        </div>
                    </TabsContent>
                    <TabsContent value="chat" className="mt-4">
                        {isMobile ? (
                            <div className="h-[calc(100vh-200px)]">
                                {selectedConversationId ? (
                                    <ChatPanel conversationId={selectedConversationId} onBack={() => setSelectedConversationId(null)} />
                                ) : (
                                    <ConversationList onSelect={setSelectedConversationId} selectedConversationId={selectedConversationId} />
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)]">
                                <div className="md:col-span-1 lg:col-span-1 border rounded-lg overflow-hidden">
                                    <ConversationList onSelect={setSelectedConversationId} selectedConversationId={selectedConversationId} />
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                    <ChatPanel conversationId={selectedConversationId} />
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
            </ErrorBoundary>
        </div>
    );
}