import React, { useState, useEffect, useRef } from 'react';
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
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useVideoConferencingPerformanceTest, logVideoConferencingPerformanceMetrics } from '@/hooks/useVideoConferencingPerformanceTest';

const generateRoomId = () => `OhmanFoundations-Meeting-${Math.random().toString(36).substr(2, 9)}`;

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

  const { testPerformance, clearCache } = useVideoConferencingPerformanceTest();

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logVideoConferencingPerformanceMetrics('Performance Test Completed', metrics.totalTime, metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).videoConferencingPerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
      console.log('📹 Video Conferencing Performance Testing available in console:');
      console.log('  window.videoConferencingPerfTest.testPerformance() - Run performance test');
      console.log('  window.videoConferencingPerfTest.clearCache() - Clear cache and reload');
    }
  }, []);

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
        <div className="px-4 sm:px-6 lg:px-8 py-2">
          <Button onClick={handleLeaveMeeting} variant="outline" className="w-full sm:w-auto">
            <LogOut className="w-4 h-4 mr-2" />
            Leave Meeting
          </Button>
        </div>
        <div ref={jitsiContainerRef} className="flex-1 w-full h-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TopNav title="Video Conferencing" subtitle="Join or create video meetings" showGoBackButton={true} />
      <ErrorBoundary>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">Meeting Rooms</CardTitle>
              {hasPermission('videoConferencing', 'create') && (
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto"><PlusCircle className="w-4 h-4 mr-2" />Create Meeting</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl sm:text-2xl">Create New Meeting</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground mt-2">
                        Set up a new video conference room for your class or team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
                        <div>
                            <Label htmlFor="topic" className="block mb-2 text-sm font-medium">Topic</Label>
                            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Weekly Staff Meeting" className="w-full h-10" />
                        </div>
                        <div>
                            <Label htmlFor="class" className="block mb-2 text-sm font-medium">Class (Optional)</Label>
                            <Select onValueChange={setSelectedClass} value={selectedClass}>
                                <SelectTrigger className="w-full h-10"><SelectValue placeholder="Select a class" /></SelectTrigger>
                                <SelectContent>{classes?.map((c: any) => (<SelectItem key={c.$id} value={c.$id}>{c.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto">Cancel</Button>
                      <Button onClick={handleCreateMeeting} disabled={!topic} className="w-full sm:w-auto">
                        <Video className="w-4 h-4 mr-2" />
                        Create Meeting
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMeetings && filteredMeetings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMeetings.map((meeting: any) => (
                  <Card key={meeting.$id} className={cn(!meeting.isActive && "bg-muted/50")}>...
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{meeting.topic}</CardTitle>
                        <Badge 
                          variant={meeting.isActive ? "primary" : "secondary"} 
                          className={cn(meeting.isActive && "bg-green-500")}
                          aria-label={meeting.isActive ? "Meeting Active" : "Meeting Ended"}
                        >
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
      </ErrorBoundary>
    </div>
  );
}