import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsers } from "@/hooks/useUsers";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import { databases, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, UserX } from "lucide-react";
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

interface SubscriptionUser {
  $id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  subscriptionStatus: string;
  subscriptionType?: string;
  subscriptionExpiry?: string;
}

export function SubscriptionManager() {
  const { users, isLoading: usersLoading } = useUsers();
  const { data: profiles, isLoading: profilesLoading } = useUserProfiles();
  const { data: subscriptions, isLoading: subscriptionsLoading, error: subscriptionsError } = useUserSubscriptions();
  const { toast } = useToast();
  const [subscriptionUsers, setSubscriptionUsers] = useState<SubscriptionUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SubscriptionUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isLoading = usersLoading || profilesLoading || subscriptionsLoading;

  useEffect(() => {
    if (users && profiles && subscriptions) {
      // Combine user data with profile data and subscription data
      const combined = users.map(user => {
        const profile = profiles?.find((p: any) => p.userId === user.$id);
        const subscription = subscriptions?.find((s: any) => s.userId === user.$id);
        return {
          $id: user.$id,
          userId: user.$id,
          firstName: profile?.firstName || user.name?.split(' ')[0] || 'Unknown',
          lastName: profile?.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          subscriptionStatus: subscription?.subscriptionStatus || 'inactive',
          subscriptionType: subscription?.subscriptionType,
          subscriptionExpiry: subscription?.subscriptionExpiry,
        };
      });
      setSubscriptionUsers(combined);
    }
  }, [users, profiles, subscriptions]);

  const activeSubscriptions = subscriptionUsers.filter(u => u.subscriptionStatus === 'active').length;
  const inactiveSubscriptions = subscriptionUsers.filter(u => u.subscriptionStatus === 'inactive').length;
  const expiredSubscriptions = subscriptionUsers.filter(u => u.subscriptionStatus === 'expired').length;

  const handleUpdateSubscription = async (userId: string, updates: Partial<SubscriptionUser>) => {
    if (subscriptionsError) {
      toast({
        title: "Subscription System Unavailable",
        description: "Cannot update subscriptions because the database collection is not accessible.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Find existing subscription document
      const subscriptionDocs = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userSubscriptions',
        [Query.equal('userId', userId), Query.limit(1)]
      );

      const subscriptionData = {
        subscriptionStatus: updates.subscriptionStatus,
        subscriptionType: updates.subscriptionType,
        subscriptionExpiry: updates.subscriptionExpiry,
        updatedAt: new Date().toISOString(),
      };

      if (subscriptionDocs.total > 0) {
        // Update existing subscription
        await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userSubscriptions',
          subscriptionDocs.documents[0].$id,
          subscriptionData
        );
      } else {
        // Create new subscription if it doesn't exist
        await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userSubscriptions',
          ID.unique(),
          {
            userId,
            ...subscriptionData,
            createdAt: new Date().toISOString(),
          }
        );
      }

      // Update local state
      setSubscriptionUsers(prev =>
        prev.map(user =>
          user.userId === userId ? { ...user, ...updates } : user
        )
      );

      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });

      setIsDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 text-xs">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 text-xs">Expired</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptionsError) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <p className="text-lg font-medium">Subscription System Unavailable</p>
              <p className="text-sm">The subscription database collection could not be accessed.</p>
              <p className="text-sm mt-2">This may be due to database attribute limits or collection not being created yet.</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">To enable subscriptions:</p>
              <ul className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 space-y-1">
                <li>• Run database seeding to create the userSubscriptions collection</li>
                <li>• Or manually create the collection in Appwrite Console</li>
                <li>• Check database permissions and attribute limits</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Subscription Management</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.history.pushState({}, '', '/admin/activation-codes'))}
              className="text-xs"
              data-testid="button-manage-activation-codes"
            >
              Manage Codes →
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subscription Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-500/10 dark:bg-green-500/20 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-center mb-1">
                <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 font-medium">Active</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{activeSubscriptions}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-center mb-1">
                <UserX className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Inactive</p>
              <p className="text-2xl font-bold text-foreground">{inactiveSubscriptions}</p>
            </div>
            <div className="text-center p-3 bg-red-500/10 dark:bg-red-500/20 rounded-lg border border-red-500/20">
              <div className="flex items-center justify-center mb-1">
                <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">Expired</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{expiredSubscriptions}</p>
            </div>
          </div>

          {/* User List with Custom Scrollbar */}
          <SimpleBar style={{ maxHeight: '256px' }}>
            <div className="space-y-2 pr-2">
              {subscriptionUsers.slice(0, 10).map((user) => (
                <div 
                  key={user.userId} 
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(user.subscriptionStatus)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDialogOpen(true);
                      }}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SimpleBar>
        </CardContent>
      </Card>

      {/* Subscription Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? `Edit ${selectedUser.firstName}'s Subscription` : 'Manage Subscriptions'}
            </DialogTitle>
          </DialogHeader>

          {selectedUser ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Subscription Status</Label>
                <Select
                  value={selectedUser.subscriptionStatus}
                  onValueChange={(value) =>
                    setSelectedUser({ ...selectedUser, subscriptionStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Subscription Type</Label>
                <Select
                  value={selectedUser.subscriptionType || ''}
                  onValueChange={(value) =>
                    setSelectedUser({ ...selectedUser, subscriptionType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={selectedUser.subscriptionExpiry || ''}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, subscriptionExpiry: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleUpdateSubscription(selectedUser.userId, {
                    subscriptionStatus: selectedUser.subscriptionStatus,
                    subscriptionType: selectedUser.subscriptionType,
                    subscriptionExpiry: selectedUser.subscriptionExpiry,
                  })}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a user from the list above to manage their subscription, or use this dialog to manage all subscriptions.
              </p>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}