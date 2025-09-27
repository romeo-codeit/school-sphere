import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
  CreditCard, 
  Search, 
  Plus, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Download,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePayments } from "@/hooks/usePayments";
import { useStudents } from "@/hooks/useStudents";

const paymentFormSchema = z.object({
  studentId: z.string(),
  amount: z.string(),
  purpose: z.string(),
  dueDate: z.string().optional(),
  status: z.string(),
  term: z.string(),
  academicYear: z.string(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const { payments, isLoading, createPayment } = usePayments();
  const { students } = useStudents();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      purpose: "",
      dueDate: "",
      status: "pending",
      term: "First Term",
      academicYear: "2024/2025",
    },
  });

  const filteredPayments = payments?.filter((payment: any) => {
    const student = students?.find((s: any) => s.$id === payment.studentId);
    const matchesSearch = payment.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || payment.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const paymentStats = {
    total: payments?.length || 0,
    paid: payments?.filter((p: any) => p.status === "paid").length || 0,
    pending: payments?.filter((p: any) => p.status === "pending").length || 0,
    overdue: payments?.filter((p: any) => p.status === "overdue").length || 0,
    totalAmount: payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0) || 0,
    paidAmount: payments?.filter((p: any) => p.status === "paid")
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0) || 0,
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      await createPayment(data);
      toast({
        title: "Success",
        description: "Payment record created successfully",
      });
      setIsFormOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment record",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <TopNav title="Payments" subtitle="Track and manage student fee payments" showGoBackButton={true} />
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Payments</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-total-payments">
                    {paymentStats.total}
                  </p>
                  <p className="text-secondary text-sm mt-1">
                    ₦{paymentStats.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Paid</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-paid-payments">
                    {paymentStats.paid}
                  </p>
                  <p className="text-secondary text-sm mt-1">
                    ₦{paymentStats.paidAmount.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-secondary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-pending-payments">
                    {paymentStats.pending}
                  </p>
                  <p className="text-accent text-sm mt-1">
                    Awaiting payment
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-accent text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Overdue</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="text-overdue-payments">
                    {paymentStats.overdue}
                  </p>
                  <p className="text-destructive text-sm mt-1">
                    Requires attention
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-destructive text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment Management</CardTitle>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-payment">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Payment Record</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="studentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-student">
                                  <SelectValue placeholder="Select student" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {students?.map((student: any) => (
                                  <SelectItem key={student.$id} value={student.$id}>
                                    {student.firstName} {student.lastName} - {student.studentId}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount (₦)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} data-testid="input-amount" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-due-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purpose</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., School fees, Registration fee" data-testid="input-purpose" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="term"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Term</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-term">
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
                          control={form.control}
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

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-submit-payment">
                          Create Payment
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-payments"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" data-testid="button-export-payments">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All ({paymentStats.total})</TabsTrigger>
                <TabsTrigger value="paid">Paid ({paymentStats.paid})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({paymentStats.pending})</TabsTrigger>
                <TabsTrigger value="overdue">Overdue ({paymentStats.overdue})</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Payments Table */}
            {isLoading ? (
              <div className="text-center py-8">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No payments found matching your search." : "No payments found."}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Term/Year</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment: any) => (
                      <TableRow key={payment.$id}>
                        <TableCell>
                          <div>
                            <p className="font-medium" data-testid={`text-payment-student-${payment.$id}`}>
                              Student #{payment.studentId}
                            </p>
                            <p className="text-sm text-muted-foreground">ID: {payment.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-payment-purpose-${payment.$id}`}>
                          {payment.purpose}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold" data-testid={`text-payment-amount-${payment.$id}`}>
                            ₦{parseFloat(payment.amount.toString()).toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell data-testid={`text-payment-due-date-${payment.$id}`}>
                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              payment.status === 'paid' ? 'default' : 
                              payment.status === 'overdue' ? 'destructive' : 'secondary'
                            }
                            className={
                              payment.status === 'paid' ? 'bg-secondary/10 text-secondary' :
                              payment.status === 'overdue' ? 'bg-destructive/10 text-destructive' :
                              'bg-accent/10 text-accent'
                            }
                            data-testid={`badge-payment-status-${payment.$id}`}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{payment.term}</p>
                            <p className="text-muted-foreground">{payment.academicYear}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" data-testid={`button-view-payment-${payment.$id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {payment.status === 'pending' && (
                              <Button size="sm" data-testid={`button-mark-paid-${payment.$id}`}>
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
