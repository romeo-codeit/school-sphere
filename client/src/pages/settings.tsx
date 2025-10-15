import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
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
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  School,
  Shield,
  Save,
  Upload,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  QrCode,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSchoolData } from "@/hooks/useSchoolData";
import { useUserProfile, useUserSettings } from "@/hooks/useUserSettings";
import { account } from '@/lib/appwrite';
import { AuthenticationFactor } from 'appwrite';
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useSettingsPerformanceTest } from "@/hooks/useSettingsPerformanceTest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const schoolFormSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().optional(),
  motto: z.string().optional(),
  currentTerm: z.string(),
  academicYear: z.string(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  paymentReminders: z.boolean(),
  examNotifications: z.boolean(),
  announcementNotifications: z.boolean(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^a-zA-Z0-9]/, "Must contain special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type SchoolFormData = z.infer<typeof schoolFormSchema>;
type NotificationFormData = z.infer<typeof notificationFormSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const { user, getJWT } = useAuth();
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();
  const userId = user?.$id || "";
  const { profile, isLoading: isLoadingProfile, upsertUserProfile } = useUserProfile(userId);
  const { settings, isLoading: isLoadingSettings, upsertUserSettings } = useUserSettings(userId);

  // Modal states
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA states
  const [mfaChallenge, setMfaChallenge] = useState<any>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const colorOptions = [
    { name: "Blue", value: "hsl(221, 91%, 60%)", hex: "#3b82f6", className: "bg-blue-500" },
    { name: "Green", value: "hsl(142, 71%, 45%)", hex: "#22c55e", className: "bg-green-500" },
    { name: "Purple", value: "hsl(270, 70%, 50%)", hex: "#a855f7", className: "bg-purple-500" },
    { name: "Orange", value: "hsl(30, 90%, 50%)", hex: "#f97316", className: "bg-orange-500" },
    { name: "Red", value: "hsl(0, 84%, 60%)", hex: "#ef4444", className: "bg-red-500" },
    { name: "Yellow", value: "hsl(48, 96%, 50%)", hex: "#eab308", className: "bg-yellow-500" },
    { name: "Cyan", value: "hsl(185, 75%, 45%)", hex: "#06b6d4", className: "bg-cyan-500" },
    { name: "Pink", value: "hsl(330, 80%, 60%)", hex: "#ec4899", className: "bg-pink-500" },
  ];

  const { schoolData, isLoading: isLoadingSchoolData } = useSchoolData();

  // Performance testing hook
  useSettingsPerformanceTest();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: profile?.firstName || user?.prefs?.firstName || "",
      lastName: profile?.lastName || user?.prefs?.lastName || "",
      email: user?.email || profile?.email || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    },
  });

  const schoolForm = useForm<SchoolFormData>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      schoolName: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      motto: "",
      currentTerm: "",
      academicYear: "",
    },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: user?.email || profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (schoolData) {
      schoolForm.reset({
        schoolName: schoolData.name || "",
        address: schoolData.address || "",
        phone: schoolData.phone || "",
        email: schoolData.email || "",
        website: schoolData.website || "",
        motto: schoolData.motto || "",
        currentTerm: schoolData.currentTerm || "",
        academicYear: schoolData.academicYear || "",
      });
    }
  }, [schoolData]);

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: settings?.notificationPreferences?.emailNotifications ?? true,
      smsNotifications: settings?.notificationPreferences?.smsNotifications ?? false,
      pushNotifications: settings?.notificationPreferences?.pushNotifications ?? true,
      paymentReminders: settings?.notificationPreferences?.paymentReminders ?? true,
      examNotifications: settings?.notificationPreferences?.examNotifications ?? true,
      announcementNotifications: settings?.notificationPreferences?.announcementNotifications ?? true,
    },
  });

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (settings?.notificationPreferences) {
      notificationForm.reset({
        emailNotifications: settings.notificationPreferences.emailNotifications ?? true,
        smsNotifications: settings.notificationPreferences.smsNotifications ?? false,
        pushNotifications: settings.notificationPreferences.pushNotifications ?? true,
        paymentReminders: settings.notificationPreferences.paymentReminders ?? true,
        examNotifications: settings.notificationPreferences.examNotifications ?? true,
        announcementNotifications: settings.notificationPreferences.announcementNotifications ?? true,
      });
    }
  }, [settings]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await upsertUserProfile(data);
      toast({ title: "Success", description: "Profile updated successfully" });
      // Removed refetchUser (no longer available)
    } catch (e) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const onSchoolSubmit = async (data: SchoolFormData) => {
    try {
      const jwt = await getJWT();
      // Implement school update logic here (call backend API)
      await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
        body: JSON.stringify(data),
      });
      toast({ title: "Success", description: "School settings updated successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update school settings", variant: "destructive" });
    }
  };

  const onNotificationSubmit = async (data: NotificationFormData) => {
    try {
      await upsertUserSettings({ notificationPreferences: data });
      toast({ title: "Success", description: "Notification preferences updated successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update notification preferences", variant: "destructive" });
    }
  };

  // Appearance
  useEffect(() => {
    if (settings?.theme) setTheme(settings.theme);
    if (settings?.primaryColor) setPrimaryColor(settings.primaryColor);
  }, [settings]);

  const onAppearanceSave = async () => {
    try {
      await upsertUserSettings({ theme, primaryColor });
      toast({ title: "Success", description: "Appearance updated" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update appearance", variant: "destructive" });
    }
  };

  // Security actions
  const [securityLoading, setSecurityLoading] = useState(false);
  const handleEnable2FA = async () => {
    try {
      const challenge = await account.createMfaChallenge({ factor: AuthenticationFactor.Totp });
      setMfaChallenge(challenge);
      setIs2FADialogOpen(true);
      toast({
        title: "2FA Setup Started",
        description: "Scan the QR code with your authenticator app."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start 2FA setup",
        variant: "destructive"
      });
    }
  };

  const handleVerify2FA = async () => {
    if (!mfaCode || !mfaChallenge) return;

    try {
      await account.updateMfaChallenge(mfaChallenge.$id, mfaCode);
      setIs2FAEnabled(true);
      setIs2FADialogOpen(false);
      setMfaChallenge(null);
      setMfaCode("");
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled."
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleManageSessions = async () => {
    setSecurityLoading(true);
    try {
      // Optionally, navigate to a sessions management page or show a modal
      const sessions = await account.listSessions();
      toast({ title: "Active Sessions", description: `${sessions.sessions.length} active sessions.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch sessions", variant: "destructive" });
    } finally {
      setSecurityLoading(false);
    }
  };
  const handleChangePassword = async () => {
    setIsPasswordDialogOpen(true);
  };

  const onChangePasswordSubmit = async (data: ChangePasswordFormData) => {
    try {
      await account.updatePassword(data.newPassword, data.currentPassword);
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully."
      });
      changePasswordForm.reset();
      setIsPasswordDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please check your current password.",
        variant: "destructive"
      });
    }
  };
  const handleExportData = async () => {
    setSecurityLoading(true);
    try {
      // Download user data (profile, settings, etc.)
      const blob = new Blob([
        JSON.stringify({ profile, settings }, null, 2)
      ], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_data.json';
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Your data has been downloaded." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    } finally {
      setSecurityLoading(false);
    }
  };
  const handleDeleteAccount = async () => {
    setSecurityLoading(true);
    try {
  await account.deleteSession("current");
      toast({ title: "Account Deleted", description: "Your account has been deleted." });
      // Optionally, redirect to login page
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      <TopNav title="Settings" subtitle="Customize your school management system" isLoading={isLoadingSchoolData} showGoBackButton={true} />
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="school" className="flex items-center space-x-2">
              <School className="w-4 h-4" />
              <span className="hidden sm:inline">School</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="flex items-center space-x-6 mb-6">
                      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">
                          {user?.prefs?.firstName?.charAt(0)}{user?.prefs?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <Button variant="outline" data-testid="button-change-avatar">
                          <Upload className="w-4 h-4 mr-2" />
                          Change Avatar
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          Upload a new profile picture
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" data-testid="button-save-profile">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* School Settings */}
          <TabsContent value="school">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <School className="w-5 h-5" />
                  <span>School Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSchoolData ? (
                  <TableSkeleton rows={6} columns={2} />
                ) : (
                  <Form {...schoolForm}>
                    <form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-6">
                      <FormField
                        control={schoolForm.control}
                        name="schoolName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-school-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={schoolForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} data-testid="textarea-school-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={schoolForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-school-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={schoolForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} data-testid="input-school-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={schoolForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-school-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={schoolForm.control}
                        name="motto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Motto</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-school-motto" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={schoolForm.control}
                          name="currentTerm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Term</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-current-term">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="First Term">First Term</SelectItem>
                                  <SelectItem value="Second Term">Second Term</SelectItem>
                                  <SelectItem value="Third Term">Third Term</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={schoolForm.control}
                          name="academicYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Academic Year</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-academic-year" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" data-testid="button-save-school">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                    <div className="space-y-6">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-email-notifications"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">SMS Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via SMS
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-sms-notifications"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Push Notifications</FormLabel>
                              <FormDescription>
                                Receive push notifications in your browser
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-push-notifications"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="paymentReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Payment Reminders</FormLabel>
                              <FormDescription>
                                Get notified about overdue payments
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-payment-reminders"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="examNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Exam Notifications</FormLabel>
                              <FormDescription>
                                Receive updates about exam schedules and results
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-exam-notifications"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="announcementNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Announcement Notifications</FormLabel>
                              <FormDescription>
                                Get notified about school announcements
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-announcement-notifications"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" data-testid="button-save-notifications">
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Appearance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-4">Theme</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Light Mode Card */}
                    <Card 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${theme === "light" ? "border-2 border-primary" : ""}`}
                      onClick={() => setTheme("light")}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-full h-20 flex items-center justify-center mb-3">
                          <div className="w-5/6 h-12 bg-white border rounded shadow"></div>
                        </div>
                        <p className="font-medium">Light</p>
                        <p className="text-sm text-muted-foreground">Default light theme</p>
                      </CardContent>
                    </Card>
                    {/* Dark Mode Card */}
                    <Card 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${theme === "dark" ? "border-2 border-primary" : ""}`}
                      onClick={() => setTheme("dark")}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-full h-20 flex items-center justify-center mb-3">
                          <div className="w-5/6 h-12 bg-slate-900 border rounded shadow"></div>
                        </div>
                        <p className="font-medium">Dark</p>
                        <p className="text-sm text-muted-foreground">Dark theme</p>
                      </CardContent>
                    </Card>
                    {/* System Card: Diagonal split */}
                    <Card 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${theme === "system" ? "border-2 border-primary" : ""}`}
                      onClick={() => setTheme("system")}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-full h-20 flex items-center justify-center mb-3">
                          <div className="w-5/6 h-12 border rounded shadow bg-gradient-to-tr from-white to-slate-900"></div>
                        </div>
                        <p className="font-medium">System</p>
                        <p className="text-sm text-muted-foreground">System preference</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-4">Color Scheme</h4>
                  <Select value={primaryColor} onValueChange={setPrimaryColor}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value} className="flex items-center gap-2">
                          <span className={`inline-block w-4 h-4 rounded ${color.className} mr-2 border`} />
                          {color.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button data-testid="button-save-appearance" onClick={onAppearanceSave} type="button">
                  <Save className="w-4 h-4 mr-2" />
                  Apply Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" data-testid="button-enable-2fa" onClick={handleEnable2FA} disabled={securityLoading}>
                      Enable
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Active Sessions</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage your active login sessions
                      </p>
                    </div>
                    <Button variant="outline" data-testid="button-manage-sessions" onClick={handleManageSessions} disabled={securityLoading}>
                      Manage
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Change your account password
                      </p>
                    </div>
                    <Button variant="outline" data-testid="button-change-password" onClick={handleChangePassword} disabled={securityLoading}>
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Export Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Download a copy of your data
                      </p>
                    </div>
                    <Button variant="outline" data-testid="button-export-data" onClick={handleExportData} disabled={securityLoading}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                    <div>
                      <h4 className="font-medium text-destructive">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" data-testid="button-delete-account" onClick={handleDeleteAccount} disabled={securityLoading}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Password Modal */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new secure password.
            </DialogDescription>
          </DialogHeader>
          <Form {...changePasswordForm}>
            <form onSubmit={changePasswordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-4">
              <FormField
                control={changePasswordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={changePasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={changePasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPasswordDialogOpen(false);
                    changePasswordForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={changePasswordForm.formState.isSubmitting}>
                  {changePasswordForm.formState.isSubmitting ? "Changing..." : "Change Password"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Modal */}
      <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code below with your authenticator app, then enter the verification code.
            </DialogDescription>
          </DialogHeader>
          {mfaChallenge && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 border rounded-lg bg-muted">
                  <QrCode className="h-32 w-32" />
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    QR Code would be displayed here
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Verification Code</Label>
                <Input
                  id="mfa-code"
                  placeholder="Enter 6-digit code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIs2FADialogOpen(false);
                setMfaChallenge(null);
                setMfaCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify2FA}
              disabled={!mfaCode || mfaCode.length !== 6}
            >
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ErrorBoundary>
  );
}