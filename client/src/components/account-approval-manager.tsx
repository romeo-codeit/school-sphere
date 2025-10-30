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
import { UserCheck, UserX, Users, AlertCircle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

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
  const { getJWT } = useAuth();
  const [allAccounts, setAllAccounts] = useState<PendingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PendingAccount | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRole, setSelectedRole] = useState("student");
  const [dialogMode, setDialogMode] = useState<'approve' | 'change-role' | 'reject'>('approve');

  const isLoading = usersLoading || profilesLoading;

  useEffect(() => {
    if (profiles) {
      // Show all user profiles, not just pending ones
      const all = profiles.filter((profile: any) => profile.accountStatus !== 'rejected') as unknown as PendingAccount[];
      setAllAccounts(all);
    }
  }, [profiles]);

  const handleApproveAccount = async (account: PendingAccount) => {
    setIsProcessing(true);
    try {
      const jwt = await getJWT();
      await fetch(`/api/admin/approve-account/${account.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      // Update local state
      setAllAccounts(prev => prev.map(acc =>
        acc.userId === account.userId
          ? { ...acc, accountStatus: 'approved', role: selectedRole }
          : acc
      ));

      toast({
        title: "Account Approved",
        description: `${account.firstName} ${account.lastName}'s account has been approved as ${selectedRole}`,
      });

      setIsDialogOpen(false);
      setSelectedAccount(null);
      setSelectedRole("student");
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to approve the account",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeRole = async (account: PendingAccount) => {
    setIsProcessing(true);
    try {
      const jwt = await getJWT();
      await fetch(`/api/admin/change-role/${account.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      // Update local state
      setAllAccounts(prev => prev.map(acc =>
        acc.userId === account.userId
          ? { ...acc, role: selectedRole }
          : acc
      ));

      toast({
        title: "Role Changed",
        description: `${account.firstName} ${account.lastName}'s role has been changed to ${selectedRole}`,
      });

      setIsDialogOpen(false);
      setSelectedAccount(null);
      setSelectedRole("student");
    } catch (error) {
      toast({
        title: "Role Change Failed",
        description: "Failed to change user role",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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

    setIsProcessing(true);
    try {
      const jwt = await getJWT();
      await fetch(`/api/admin/reject-account/${account.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      // Update local state
      setAllAccounts(prev => prev.filter((acc: PendingAccount) => acc.userId !== account.userId));

      toast({
        title: "Account Rejected",
        description: `${account.firstName} ${account.lastName}'s account has been rejected`,
      });

      setIsDialogOpen(false);
      setSelectedAccount(null);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the account",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
          <CardTitle className="text-lg">User Account Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending Accounts Count */}
          <div className="flex items-center justify-between p-4 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Pending Approvals</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Accounts waiting for review</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {allAccounts.filter(acc => acc.accountStatus === 'pending').length}
            </span>
          </div>

          {/* All Accounts List */}
          <div className="space-y-3 max-h-96 overflow-y-auto modern-scrollbar">
            {allAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No user accounts found</p>
              </div>
            ) : (
              allAccounts.map((account) => (
                <div key={account.userId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {account.firstName} {account.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{account.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={account.accountStatus === 'pending' ? 'secondary' : 'primary'}>
                        {account.accountStatus}
                      </Badge>
                      <Badge variant="outline">{account.role}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {account.accountStatus === 'pending' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setSelectedRole(account.role);
                            setDialogMode('approve');
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
                            setDialogMode('reject');
                            setIsDialogOpen(true);
                          }}
                          className="text-red-700 border-red-300 hover:bg-red-50"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(account);
                          setSelectedRole(account.role);
                          setDialogMode('change-role');
                          setIsDialogOpen(true);
                        }}
                        className="text-blue-700 border-blue-300 hover:bg-blue-50"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Change Role
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? `${dialogMode === 'approve' ? 'Approve' : dialogMode === 'change-role' ? 'Change Role for' : 'Reject'} ${selectedAccount.firstName}'s Account` : 'Account Action'}
            </DialogTitle>
          </DialogHeader>

          {selectedAccount && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Account Details</h4>
                <p className="text-sm"><strong>Name:</strong> {selectedAccount.firstName} {selectedAccount.lastName}</p>
                <p className="text-sm"><strong>Email:</strong> {selectedAccount.email}</p>
                <p className="text-sm"><strong>Current Role:</strong> {selectedAccount.role}</p>
                <p className="text-sm"><strong>Status:</strong> {selectedAccount.accountStatus}</p>
              </div>

              {/* Role Selection for Approve/Change Role */}
              {(dialogMode === 'approve' || dialogMode === 'change-role') && (
                <div>
                  <label className="text-sm font-medium">
                    {dialogMode === 'approve' ? 'Assign Role' : 'Change Role To'}
                  </label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Rejection Reason */}
              {dialogMode === 'reject' && (
                <div>
                  <label className="text-sm font-medium">Rejection Reason</label>
                  <Textarea
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {dialogMode === 'approve' && (
                  <Button
                    onClick={() => handleApproveAccount(selectedAccount)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? 'Approving...' : 'Approve Account'}
                  </Button>
                )}
                {dialogMode === 'change-role' && (
                  <Button
                    onClick={() => handleChangeRole(selectedAccount)}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? 'Changing...' : 'Change Role'}
                  </Button>
                )}
                {dialogMode === 'reject' && (
                  <Button
                    onClick={() => handleRejectAccount(selectedAccount)}
                    disabled={isProcessing || !rejectionReason.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isProcessing ? 'Rejecting...' : 'Reject Account'}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedAccount(null);
                    setRejectionReason("");
                    setSelectedRole("student");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}