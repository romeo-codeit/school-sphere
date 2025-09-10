import { useState, useEffect, useRef } from 'react';
import { TopNav } from '@/components/top-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVideoConferencing } from '@/hooks/useVideoConferencing';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { AdminOrTeacher } from '@/components/RoleGuard';
import { Video, PlusCircle, LogOut } from 'lucide-react';
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

const generateRoomId = () => `EduManage-Meeting-${Math.random().toString(36).substr(2, 9)}`;

declare const JitsiMeetExternalAPI: any;

export default function VideoConferencing() {
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const { meetings, isLoading, createMeeting, deleteMeeting } = useVideoConferencing();
  const { user, role } = useAuth();
  const { hasPermission } = useRole();
  const { students } = useStudents();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const { toast } = useToast();

  const uniqueClasses = students ? [...new Set(students.map((student: any) => student.class))] : [];

  const getUserClass = () => {
    if (!user || !students) return null;
    if (role === 'student') {
      const student = students.find((s: any) => s.userId === user.$id);
      return student?.class;
    }
    if (role === 'parent') {
      const student = students.find((s: any) => s.parentEmail === user.email);
      return student?.class;
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
        configOverwrite: {
            prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'e2ee'
            ],
        },
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
      });
      toast({ title: "Success", description: "Meeting created successfully." });
      setIsFormOpen(false);
      setTopic("");
      setSelectedClass("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleJoinMeeting = (room: any) => {
    setActiveRoom(room);
  };

  const handleLeaveMeeting = () => {
    setActiveRoom(null);
  };

  if (activeRoom) {
    return (
      <div className="h-screen flex flex-col">
        <TopNav title={activeRoom.topic} subtitle={`Room: ${activeRoom.roomId}`}>
            <Button onClick={handleLeaveMeeting} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Leave Meeting
            </Button>
        </TopNav>
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
                    <Button>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Meeting
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Meeting</DialogTitle>
                      <DialogDescription>
                        Enter a topic for your new meeting room.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="topic">Topic</Label>
                            <Input
                                id="topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Weekly Staff Meeting"
                            />
                        </div>
                        <div>
                            <Label htmlFor="class">Class (Optional)</Label>
                            <Select onValueChange={setSelectedClass} value={selectedClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueClasses.map((c: any) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateMeeting} disabled={!topic}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading meetings...</p>
            ) : filteredMeetings && filteredMeetings.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMeetings.map((meeting: any) => (
                  <Card key={meeting.$id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{meeting.topic}</CardTitle>
                      <CardDescription>
                        {meeting.classId && `For Class: ${meeting.classId}`}
                        <br />
                        Created at {new Date(meeting.$createdAt).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => handleJoinMeeting(meeting)} className="w-full">
                        <Video className="w-4 h-4 mr-2" />
                        Join Meeting
                      </Button>
                      {hasPermission('videoConferencing', 'delete') && (
                          <Button
                            onClick={() => deleteMeeting(meeting.$id)}
                            variant="destructive"
                            className="w-full mt-2"
                          >
                            Delete
                          </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    No active meeting rooms.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
