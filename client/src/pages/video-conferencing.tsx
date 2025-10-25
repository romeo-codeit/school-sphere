import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from '@/components/top-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVideoConferencing } from '@/hooks/useVideoConferencing';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { 
  Video, 
  PlusCircle, 
  LogOut, 
  Users, 
  PowerOff,
  Mic,
  MicOff,
  VideoOff as CameraOff,
  PhoneOff,
  MonitorUp,
  Settings,
  MessageSquare,
  Maximize,
  Minimize,
  Camera,
  AlertCircle,
} from 'lucide-react';
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
import { withBase } from '@/lib/http';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useVideoConferencingPerformanceTest, logVideoConferencingPerformanceMetrics } from '@/hooks/useVideoConferencingPerformanceTest';
import { useTheme } from '@/hooks/useTheme';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { theme } = useTheme();
  
  // Permission prompt state
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<any | null>(null);
  
  // Custom controls state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    }
  }, []);

  // Handle browser close/refresh - clean up meeting
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeRoom) {
        e.preventDefault();
        e.returnValue = 'You are currently in a meeting. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeRoom]);

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
      // We'll request a server-signed JWT if configured; otherwise fall back to anonymous meet.jit.si
      const defaultDomain = (import.meta.env.VITE_JITSI_DOMAIN as string) || 'meet.jit.si';
      let domain = defaultDomain;
      let jwtToken: string | undefined;
      
      // Determine theme for Jitsi
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      const options: any = {
        roomName: activeRoom.roomId,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          email: user?.email,
          displayName: user?.name,
        },
        // If server returns a token, we'll attach it below
        configOverwrite: {
          prejoinPageEnabled: false,
          // Disable moderation/lobby to prevent login prompts
          enableLobbyChat: false,
          disableLobby: true,
          enableWelcomePage: false,
          enableClosePage: false,
          // Auto-join without waiting for moderator
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          requireDisplayName: false,
          disableProfile: true,
          // Hide Jitsi branding and prompts
          disableDeepLinking: true,
          hideConferenceSubject: true,
          hideConferenceTimer: false,
          // Remove branding
          DEFAULT_LOGO_URL: '',
          DEFAULT_WELCOME_PAGE_LOGO_URL: '',
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          // Mobile optimizations
          startAudioOnly: false,
          // Disable moderation features
          disableRemoteMute: true,
          remoteVideoMenu: {
            disableKick: true,
          },
          // Hide unnecessary UI
          prejoinConfig: {
            enabled: false,
          },
          toolbarConfig: {
            alwaysVisible: false,
            autoHideWhileChatIsOpen: true,
          },
          // Apply theme
          subject: activeRoom.topic,
          // Connection resilience
          p2p: {
            enabled: true,
          },
          enableNoAudioDetection: false,
          enableNoisyMicDetection: false,
        },
        interfaceConfigOverwrite: {
          // Minimal toolbar - we'll build custom controls
          TOOLBAR_BUTTONS: [],
          SETTINGS_SECTIONS: [],
          // Hide all Jitsi branding
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          JITSI_WATERMARK_LINK: '',
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          MOBILE_APP_PROMO: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
          // Hide chrome elements
          DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
          DISABLE_FOCUS_INDICATOR: true,
          DISABLE_VIDEO_BACKGROUND: false,
          // Custom app name
          APP_NAME: 'OhmanFoundations',
          NATIVE_APP_NAME: 'OhmanFoundations',
          PROVIDER_NAME: 'OhmanFoundations',
          // Video layout
          FILM_STRIP_MAX_HEIGHT: 0, // Hide filmstrip, we'll show tiles
          VERTICAL_FILMSTRIP: false,
          TILE_VIEW_MAX_COLUMNS: 4,
          // Hide UI chrome
          HIDE_INVITE_MORE_HEADER: true,
          HIDE_DEEP_LINKING_LOGO: true,
        },
      };
      
      (async () => {
        try {
          // Try to fetch a JWT from our server; if unavailable (204), continue anonymously
          const resp = await fetch(withBase('/api/jitsi/token'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: activeRoom.roomId }),
          }).catch(() => undefined);
          if (resp && resp.ok) {
            const body = await resp.json().catch(() => null);
            if (body?.token) {
              jwtToken = body.token;
              if (body?.domain) domain = body.domain;
            }
          }

          setConnectionStatus('connecting');
          const optsToUse = { ...options };
          if (jwtToken) (optsToUse as any).jwt = jwtToken;
          jitsiApiRef.current = new JitsiMeetExternalAPI(domain, optsToUse);
          
          // Connection and error event handlers
          jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
            console.log('Successfully joined conference');
            setConnectionStatus('connected');
            setIsReconnecting(false);
            toast({
              title: "Connected",
              description: "You've joined the meeting successfully.",
            });
          });
          
          jitsiApiRef.current.addEventListener('videoConferenceLeft', (event: any) => {
            console.log('Left conference', event);
            handleLeaveMeeting();
          });
          
          jitsiApiRef.current.addEventListener('connectionFailed', (event: any) => {
            console.error('Connection failed', event);
            setConnectionStatus('error');
            toast({
              title: "Connection Failed",
              description: "Failed to connect to the meeting. Please check your internet connection.",
              variant: "destructive",
            });
          });
          
          jitsiApiRef.current.addEventListener('connectionEstablished', () => {
            console.log('Connection established');
            setConnectionStatus('connected');
          });
          
          jitsiApiRef.current.addEventListener('connectionInterrupted', () => {
            console.log('Connection interrupted');
            setConnectionStatus('disconnected');
            setIsReconnecting(true);
            toast({
              title: "Connection Lost",
              description: "Reconnecting to the meeting...",
              variant: "default",
            });
          });
          
          jitsiApiRef.current.addEventListener('connectionRestored', () => {
            console.log('Connection restored');
            setConnectionStatus('connected');
            setIsReconnecting(false);
            toast({
              title: "Reconnected",
              description: "Connection restored successfully.",
            });
          });
          
          jitsiApiRef.current.addEventListener('readyToClose', () => {
            console.log('Ready to close');
            handleLeaveMeeting();
          });
          
          jitsiApiRef.current.addEventListener('errorOccurred', (event: any) => {
            console.error('Jitsi error occurred', event);
            if (event.error) {
              toast({
                title: "Meeting Error",
                description: event.error.message || "An error occurred during the meeting.",
                variant: "destructive",
              });
            }
          });
          
          // Listen to events for custom controls state
          jitsiApiRef.current.addEventListener('audioMuteStatusChanged', (event: any) => {
            setIsMuted(event.muted);
          });
          
          jitsiApiRef.current.addEventListener('videoMuteStatusChanged', (event: any) => {
            setIsVideoOff(event.muted);
          });
          
          jitsiApiRef.current.addEventListener('screenSharingStatusChanged', (event: any) => {
            setIsScreenSharing(event.on);
          });
          
          jitsiApiRef.current.addEventListener('participantJoined', (event: any) => {
            console.log('Participant joined', event);
            setParticipantCount(prev => prev + 1);
          });
          
          jitsiApiRef.current.addEventListener('participantLeft', (event: any) => {
            console.log('Participant left', event);
            setParticipantCount(prev => Math.max(0, prev - 1));
          });
          
          // Additional branding removal via API commands
          jitsiApiRef.current.executeCommand('subject', activeRoom.topic);
          jitsiApiRef.current.executeCommand('toggleTileView'); // Start in tile view
          
        } catch (error) {
          console.error('Error initializing Jitsi', error);
          setConnectionStatus('error');
          toast({
            title: "Failed to Initialize",
            description: "Could not start the video meeting. Please try again.",
            variant: "destructive",
          });
        }
      })();
    }

    return () => {
      // Clean up reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Only dispose if we're actually leaving (not just re-rendering)
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi', e);
        }
        jitsiApiRef.current = null;
      }
    };
  }, [activeRoom, user, theme]);

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
    setPendingRoom(room);
    setShowPermissionPrompt(true);
  };

  const requestPermissions = async () => {
    try {
      setPermissionError(null);
      let hasAudio = false;
      let hasVideo = false;
      
      // Try to get both video and audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        stream.getTracks().forEach(track => track.stop());
        hasAudio = true;
        hasVideo = true;
      } catch (error: any) {
        // If both failed, try audio only
        if (error.name === 'NotFoundError' || error.name === 'NotAllowedError') {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ 
              audio: true 
            });
            audioStream.getTracks().forEach(track => track.stop());
            hasAudio = true;
            hasVideo = false;
            toast({
              title: "Camera not available",
              description: "Joining with audio only. You can still hear and speak to others.",
              variant: "default",
            });
          } catch (audioError: any) {
            console.error('Audio permission error:', audioError);
            if (audioError.name === 'NotAllowedError') {
              setPermissionError('Microphone access denied. Please allow access to join the meeting.');
            } else if (audioError.name === 'NotFoundError') {
              setPermissionError('No microphone found. Please connect a microphone to join the meeting.');
            } else {
              setPermissionError(`Failed to access microphone: ${audioError.message}`);
            }
            return;
          }
        } else {
          throw error;
        }
      }
      
      setHasPermissions(true);
      setShowPermissionPrompt(false);
      
      // Now actually join the meeting
      if (pendingRoom) {
        await updateMeeting({ id: pendingRoom.$id, participantCount: (pendingRoom.participantCount || 0) + 1 });
        setActiveRoom(pendingRoom);
        setPendingRoom(null);
        
        // If no video, start with video muted
        if (!hasVideo) {
          setIsVideoOff(true);
        }
      }
    } catch (error: any) {
      console.error('Permission error:', error);
      if (error.name === 'NotAllowedError') {
        setPermissionError('Camera and microphone access denied. Please allow access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No camera or microphone found. Please connect a device and try again.');
      } else {
        setPermissionError(`Failed to access devices: ${error.message}`);
      }
    }
  };

  const handleLeaveMeeting = async () => {
    if (activeRoom) {
      const meeting = meetings?.find(m => m.$id === activeRoom.$id);
      if (meeting && meeting.participantCount > 0) {
        try {
          await updateMeeting({ id: activeRoom.$id, participantCount: meeting.participantCount - 1 });
        } catch (error) {
          console.error('Failed to update participant count', error);
        }
      }
    }
    
    // Clean up Jitsi instance
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (e) {
        console.error('Error disposing Jitsi on leave', e);
      }
      jitsiApiRef.current = null;
    }
    
    setActiveRoom(null);
    // Reset control states
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setIsChatOpen(false);
    setIsFullscreen(false);
    setParticipantCount(0);
    setConnectionStatus('connecting');
    setIsReconnecting(false);
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
        await updateMeeting({ id: meetingId, isActive: false });
        toast({ title: "Meeting Ended", description: "The meeting room has been closed." });
    } catch (error: any) {
        toast({ title: "Error", description: `Failed to end meeting: ${error.message}`, variant: "destructive" });
    }
  }

  // Custom control handlers
  const toggleMute = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

  const toggleScreenShare = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleShareScreen');
    }
  };

  const toggleChat = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleChat');
      setIsChatOpen(!isChatOpen);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      jitsiContainerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Add a body class while in an active Jitsi meeting so meeting-specific CSS can be scoped
  useEffect(() => {
    if (activeRoom) {
      document.body.classList.add('jitsi-active');
    } else {
      document.body.classList.remove('jitsi-active');
    }
    return () => {
      document.body.classList.remove('jitsi-active');
    };
  }, [activeRoom]);

  if (activeRoom) {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    return (
      <div className={cn("h-screen flex flex-col", isDark ? "bg-gray-950" : "bg-gray-100")}>
        {/* Custom Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <div className={cn(
                "flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full border",
                isDark 
                  ? "bg-gray-900/60 border-gray-700" 
                  : "bg-white/60 border-gray-300"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === 'connected' ? "bg-green-500 animate-pulse" :
                  connectionStatus === 'connecting' ? "bg-yellow-500 animate-pulse" :
                  connectionStatus === 'disconnected' ? "bg-orange-500 animate-pulse" :
                  "bg-red-500"
                )}></div>
                <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                  {activeRoom.topic}
                </span>
              </div>
              {isReconnecting && (
                <div className={cn(
                  "flex items-center gap-2 backdrop-blur-md px-3 py-2 rounded-full border border-orange-500",
                  isDark 
                    ? "bg-orange-900/60" 
                    : "bg-orange-100/60"
                )}>
                  <span className={cn("text-xs font-medium", isDark ? "text-orange-200" : "text-orange-900")}>
                    Reconnecting...
                  </span>
                </div>
              )}
              <div className={cn(
                "flex items-center gap-2 backdrop-blur-md px-3 py-2 rounded-full border",
                isDark 
                  ? "bg-gray-900/60 border-gray-700" 
                  : "bg-white/60 border-gray-300"
              )}>
                <Users className={cn("w-4 h-4", isDark ? "text-white" : "text-gray-900")} />
                <span className={cn("text-sm", isDark ? "text-white" : "text-gray-900")}>
                  {participantCount + 1}
                </span>
              </div>
            </div>
            <Button 
              onClick={handleLeaveMeeting} 
              variant="destructive" 
              size="sm"
              className="bg-red-600 hover:bg-red-700 shadow-lg"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>

        {/* Jitsi Video Container */}
        <div ref={jitsiContainerRef} className="flex-1 w-full h-full relative"></div>

        {/* Custom Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Microphone */}
            <Button
              onClick={toggleMute}
              size="lg"
              variant={isMuted ? "destructive" : "secondary"}
              className={cn(
                "h-14 w-14 rounded-full transition-all shadow-lg backdrop-blur-md border-2",
                isMuted 
                  ? "bg-red-600 hover:bg-red-700 border-red-500" 
                  : isDark
                    ? "bg-gray-800/80 hover:bg-gray-700/80 border-gray-600"
                    : "bg-white/80 hover:bg-gray-100/80 border-gray-300"
              )}
            >
              {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className={cn("w-6 h-6", isDark ? "text-white" : "text-gray-900")} />}
            </Button>

            {/* Camera */}
            <Button
              onClick={toggleVideo}
              size="lg"
              variant={isVideoOff ? "destructive" : "secondary"}
              className={cn(
                "h-14 w-14 rounded-full transition-all shadow-lg backdrop-blur-md border-2",
                isVideoOff 
                  ? "bg-red-600 hover:bg-red-700 border-red-500" 
                  : isDark
                    ? "bg-gray-800/80 hover:bg-gray-700/80 border-gray-600"
                    : "bg-white/80 hover:bg-gray-100/80 border-gray-300"
              )}
            >
              {isVideoOff ? <CameraOff className="w-6 h-6 text-white" /> : <Video className={cn("w-6 h-6", isDark ? "text-white" : "text-gray-900")} />}
            </Button>

            {/* Screen Share */}
            <Button
              onClick={toggleScreenShare}
              size="lg"
              variant="secondary"
              className={cn(
                "h-14 w-14 rounded-full transition-all shadow-lg backdrop-blur-md border-2",
                isScreenSharing 
                  ? "bg-blue-600 hover:bg-blue-700 border-blue-500" 
                  : isDark
                    ? "bg-gray-800/80 hover:bg-gray-700/80 border-gray-600"
                    : "bg-white/80 hover:bg-gray-100/80 border-gray-300"
              )}
            >
              <MonitorUp className={cn("w-6 h-6", isScreenSharing ? "text-white" : isDark ? "text-white" : "text-gray-900")} />
            </Button>

            {/* Chat */}
            <Button
              onClick={toggleChat}
              size="lg"
              variant="secondary"
              className={cn(
                "h-14 w-14 rounded-full transition-all shadow-lg backdrop-blur-md border-2",
                isChatOpen 
                  ? "bg-blue-600 hover:bg-blue-700 border-blue-500" 
                  : isDark
                    ? "bg-gray-800/80 hover:bg-gray-700/80 border-gray-600"
                    : "bg-white/80 hover:bg-gray-100/80 border-gray-300"
              )}
            >
              <MessageSquare className={cn("w-6 h-6", isChatOpen ? "text-white" : isDark ? "text-white" : "text-gray-900")} />
            </Button>

            {/* Fullscreen */}
            <Button
              onClick={toggleFullscreen}
              size="lg"
              variant="secondary"
              className={cn(
                "h-14 w-14 rounded-full transition-all shadow-lg backdrop-blur-md border-2",
                isDark
                  ? "bg-gray-800/80 hover:bg-gray-700/80 border-gray-600"
                  : "bg-white/80 hover:bg-gray-100/80 border-gray-300"
              )}
            >
              {isFullscreen ? (
                <Minimize className={cn("w-6 h-6", isDark ? "text-white" : "text-gray-900")} />
              ) : (
                <Maximize className={cn("w-6 h-6", isDark ? "text-white" : "text-gray-900")} />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TopNav title="Video Conferencing" subtitle="Join or create video meetings" showGoBackButton={true} />
      
      {/* Permission Prompt Dialog */}
      <Dialog open={showPermissionPrompt} onOpenChange={setShowPermissionPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera & Microphone Access
            </DialogTitle>
            <DialogDescription>
              To join this meeting, we need access to your microphone. Camera is optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Mic className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Microphone <span className="text-xs text-destructive">Required</span></p>
                <p className="text-xs text-muted-foreground">Share your audio to be heard by others</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border-dashed border">
              <Video className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Camera <span className="text-xs text-muted-foreground">Optional</span></p>
                <p className="text-xs text-muted-foreground">Can join audio-only if camera is unavailable</p>
              </div>
            </div>
            {permissionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {permissionError}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPermissionPrompt(false);
                setPendingRoom(null);
                setPermissionError(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={requestPermissions}
              className="w-full sm:w-auto"
            >
              <Mic className="w-4 h-4 mr-2" />
              Join Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            {hasPermission('videoConferencing', 'delete') && meeting.createdBy === user?.$id && (
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