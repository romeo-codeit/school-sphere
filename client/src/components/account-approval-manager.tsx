import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUsers } from "@/hooks/useUsers";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Users, Shield, AlertCircle } from "lucide-react";

interface PendingAccount {
  $id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  accountStatus: string;
  createdAt?: string;
}

export function AccountApprovalManager() {
  const { users, isLoading: usersLoading } = useUsers();
  const { data: profiles, isLoading: profilesLoading } = useUserProfiles();
  const { toast } = useToast();
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PendingAccount | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRole, setSelectedRole] = useState("student");

  const isLoading = usersLoading || profilesLoading;

  useEffect(() => {
    if (profiles) {
      const pending = profiles.filter((profile: any) => profile.accountStatus === 'pending') as unknown as PendingAccount[];
      setPendingAccounts(pending);
    }
  }, [profiles]);

  const handleApproveAccount = async (account: PendingAccount) => {
    setIsApproving(true);
    try {
      await fetch(`/api/admin/approve-account/${account.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      // Update local state
      setPendingAccounts(prev => prev.filter(acc => acc.userId !== account.userId));

      toast({
        title: "Account Approved",
        description: `${account.firstName} ${account.lastName}'s account has been approved as ${selectedRole}`,
      });

      setIsDialogOpen(false);
      setSelectedAccount(null);
      setSelectedRole("student");
    } catch (error) {
      console.error('Error approving account:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve the account",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectAccount = async (account: PendingAccount) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setIsApproving(true);
    try {
      await fetch(`/api/admin/reject-account/${account.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      // Update local state
      setPendingAccounts(prev => prev.filter(acc => acc.userId !== account.userId));

      toast({
        title: "Account Rejected",
        description: `${account.firstName} ${account.lastName}'s account has been rejected`,
      });

      setIsDialogOpen(false);
      setSelectedAccount(null);
      setRejectionReason("");
    } catch (error) {
      console.error('Error rejecting account:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the account",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg lg:text-xl">Account Approvals</CardTitle>
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
            <Shield className="h-5 w-5" />
            Account Approvals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending Accounts Count */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Pending Approvals</p>
                <p className="text-sm text-blue-700">Accounts waiting for review</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-900">{pendingAccounts.length}</span>
          </div>

          {/* Pending Accounts List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending accounts to review</p>
              </div>
            ) : (
              pendingAccounts.map((account) => (
                <div key={account.userId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {account.firstName} {account.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{account.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Applied as: <Badge variant="outline">{account.role}</Badge>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(account);
                        setSelectedRole(account.role);
                        setIsDialogOpen(true);
                      }}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(account);
                        setIsDialogOpen(true);
                      }}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? `Review ${selectedAccount.firstName}'s Account` : 'Account Review'}
            </DialogTitle>
          </DialogHeader>

          {selectedAccount && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Account Details</h4>
                <p className="text-sm"><strong>Name:</strong> {selectedAccount.firstName} {selectedAccount.lastName}</p>
                <p className="text-sm"><strong>Email:</strong> {selectedAccount.email}</p>
                <p className="text-sm"><strong>Applied Role:</strong> {selectedAccount.role}</p>
              </div>

              {/* Role Assignment for Approval */}
              <div>
                <label className="text-sm font-medium">Assign Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rejection Reason */}
              <div>
                <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                <Textarea
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleApproveAccount(selectedAccount)}
                  disabled={isApproving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isApproving ? 'Approving...' : 'Approve Account'}
                </Button>
                <Button
                  onClick={() => handleRejectAccount(selectedAccount)}
                  disabled={isApproving || !rejectionReason.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  {isApproving ? 'Rejecting...' : 'Reject Account'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}