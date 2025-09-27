import { useState, useEffect, useRef } from 'react';
import { TopNav } from '@/components/top-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVideoConferencing } from '@/hooks/useVideoConferencing';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Video, PlusCircle, LogOut, Users, PowerOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useStudents } from '@/hooks/useStudents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { getAllClasses } from '@/lib/api/attendance';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const generateRoomId = () => `EduManage-Meeting-${Math.random().toString(36).substr(2, 9)}`;

declare const JitsiMeetExternalAPI: any;

export default function VideoConferencing() {
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const { meetings, isLoading, createMeeting, deleteMeeting, updateMeeting } = useVideoConferencing();
  const { user, role } = useAuth();
  const { hasPermission } = useRole();
  const { students } = useStudents();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const { toast } = useToast();

  const { data: classes } = useQuery({
      queryKey: ['classes'],
      queryFn: getAllClasses,
      enabled: hasPermission('videoConferencing', 'create'),
  });

  const getUserClass = () => {
    if (!user || !students) return null;
    if (role === 'student') {
      const student = students.find((s: any) => s.userId === user.$id);
      return student?.classId;
    }
    if (role === 'parent') {
      const student = students.find((s: any) => s.parentEmail === user.email);
      return student?.classId;
    }
    return null;
  };

  const userClass = getUserClass();

  const filteredMeetings = meetings?.filter((meeting: any) => {
    if (role === 'admin' || role === 'teacher') return true;
    if (!meeting.classId) return true;
    return meeting.classId === userClass;
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (activeRoom && jitsiContainerRef.current && typeof JitsiMeetExternalAPI !== 'undefined') {
      const domain = 'meet.jit.si';
      const options = {
        roomName: activeRoom.roomId,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          email: user?.email,
          displayName: user?.name,
        },
        configOverwrite: { prejoinPageEnabled: false },
        interfaceConfigOverwrite: { TOOLBAR_BUTTONS: ['microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup', 'profile', 'chat', 'recording', 'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand', 'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts', 'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'e2ee'] },
      };
      jitsiApiRef.current = new JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current.addEventListener('videoConferenceLeft', handleLeaveMeeting);
    }

    return () => {
      jitsiApiRef.current?.dispose();
      jitsiApiRef.current = null;
    };
  }, [activeRoom, user]);

  const handleCreateMeeting = async () => {
    if (!user || !topic) return;
    try {
      await createMeeting({
        topic,
        roomId: generateRoomId(),
        createdBy: user.$id,
        classId: selectedClass || undefined,
        isActive: true,
        participantCount: 0,
      });
      toast({ title: "Success", description: "Meeting created successfully." });
      setIsFormOpen(false);
      setTopic("");
      setSelectedClass("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleJoinMeeting = async (room: any) => {
    await updateMeeting({ id: room.$id, participantCount: (room.participantCount || 0) + 1 });
    setActiveRoom(room);
  };

  const handleLeaveMeeting = async () => {
    if (activeRoom) {
      const meeting = meetings?.find(m => m.$id === activeRoom.$id);
      if (meeting && meeting.participantCount > 0) {
        await updateMeeting({ id: activeRoom.$id, participantCount: meeting.participantCount - 1 });
      }
    }
    setActiveRoom(null);
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
        await updateMeeting({ id: meetingId, isActive: false });
        toast({ title: "Meeting Ended", description: "The meeting room has been closed." });
    } catch (error: any) {
        toast({ title: "Error", description: `Failed to end meeting: ${error.message}`, variant: "destructive" });
    }
  }

  if (activeRoom) {
    return (
      <div className="h-screen flex flex-col">
        <TopNav title={activeRoom.topic} subtitle={`Room: ${activeRoom.roomId}`} />
        <div className="p-2">
            <Button onClick={handleLeaveMeeting} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Leave Meeting
            </Button>
        </div>
        <div ref={jitsiContainerRef} className="flex-1"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TopNav title="Video Conferencing" subtitle="Join or create video meetings" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Meeting Rooms</CardTitle>
              {hasPermission('videoConferencing', 'create') && (
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                    <Button><PlusCircle className="w-4 h-4 mr-2" />Create Meeting</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Meeting</DialogTitle>
                      <DialogDescription>Enter a topic for your new meeting room.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="topic">Topic</Label>
                            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Weekly Staff Meeting" />
                        </div>
                        <div>
                            <Label htmlFor="class">Class (Optional)</Label>
                            <Select onValueChange={setSelectedClass} value={selectedClass}>
                                <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                                <SelectContent>{classes?.map((c: any) => (<SelectItem key={c.$id} value={c.$id}>{c.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreateMeeting} disabled={!topic}>Create</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <p>Loading meetings...</p> :
             filteredMeetings && filteredMeetings.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMeetings.map((meeting: any) => (
                  <Card key={meeting.$id} className={cn(!meeting.isActive && "bg-muted/50")}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{meeting.topic}</CardTitle>
                        <Badge variant={meeting.isActive ? "default" : "secondary"} className={cn(meeting.isActive && "bg-green-500")}>
                          {meeting.isActive ? "Active" : "Ended"}
                        </Badge>
                      </div>
                      <CardDescription>
                        {meeting.classId && `For Class: ${classes?.find(c => c.$id === meeting.classId)?.name || ''}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> {meeting.participantCount || 0} Participants</div>
                            <span>{new Date(meeting.$createdAt).toLocaleDateString()}</span>
                        </div>
                      <Button onClick={() => handleJoinMeeting(meeting)} className="w-full" disabled={!meeting.isActive}>
                        <Video className="w-4 h-4 mr-2" />
                        {meeting.isActive ? "Join Meeting" : "Meeting Ended"}
                      </Button>
                      {meeting.createdBy === user?.$id && meeting.isActive && (
                          <Button onClick={() => handleEndMeeting(meeting.$id)} variant="outline" className="w-full mt-2">
                              <PowerOff className="w-4 h-4 mr-2" />
                              End Meeting
                          </Button>
                      )}
                      {hasPermission('videoConferencing', 'delete') && (
                          <Button onClick={() => deleteMeeting(meeting.$id)} variant="destructive" className="w-full mt-2">Delete Room</Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">No active meeting rooms.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}