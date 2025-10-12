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
import { databases, ID, Query } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { Crown, Users, UserCheck, UserX } from "lucide-react";

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
  const { profiles, isLoading: profilesLoading } = useUserProfiles();
  const { toast } = useToast();
  const [subscriptionUsers, setSubscriptionUsers] = useState<SubscriptionUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SubscriptionUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isLoading = usersLoading || profilesLoading;

  useEffect(() => {
    if (users && profiles) {
      // Combine user data with profile data
      const combined = users.map(user => {
        const profile = profiles.find(p => p.userId === user.$id);
        return {
          $id: user.$id,
          userId: user.$id,
          firstName: profile?.firstName || user.name?.split(' ')[0] || 'Unknown',
          lastName: profile?.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          subscriptionStatus: profile?.subscriptionStatus || 'inactive',
          subscriptionType: profile?.subscriptionType,
          subscriptionExpiry: profile?.subscriptionExpiry,
        };
      });
      setSubscriptionUsers(combined);
    }
  }, [users, profiles]);

  const activeSubscriptions = subscriptionUsers.filter(u => u.subscriptionStatus === 'active').length;
  const inactiveSubscriptions = subscriptionUsers.filter(u => u.subscriptionStatus === 'inactive').length;
  const expiredSubscriptions = subscriptionUsers.filter(u => u.subscriptionStatus === 'expired').length;

  const handleUpdateSubscription = async (userId: string, updates: Partial<SubscriptionUser>) => {
    setIsUpdating(true);
    try {
      // Find the profile document
      const profileDocs = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userProfiles',
        [Query.equal('userId', userId), Query.limit(1)]
      );

      if (profileDocs.total > 0) {
        // Update existing profile
        await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userProfiles',
          profileDocs.documents[0].$id,
          updates
        );
      } else {
        // Create new profile if it doesn't exist
        await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userProfiles',
          ID.unique(),
          { userId, ...updates }
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
      console.error('Error updating subscription:', error);
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
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg lg:text-xl">Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subscription Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-sm text-green-600 font-medium">Active</p>
              <p className="text-xl font-bold text-green-700">{activeSubscriptions}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <UserX className="h-4 w-4 text-gray-600" />
              </div>
              <p className="text-sm text-gray-600 font-medium">Inactive</p>
              <p className="text-xl font-bold text-gray-700">{inactiveSubscriptions}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <UserX className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-sm text-red-600 font-medium">Expired</p>
              <p className="text-xl font-bold text-red-700">{expiredSubscriptions}</p>
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {subscriptionUsers.slice(0, 10).map((user) => (
              <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(user.subscriptionStatus)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              onClick={() => setIsDialogOpen(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage All Subscriptions
            </Button>
          </div>
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