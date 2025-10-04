import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Payments</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-total-payments">
                    {paymentStats.total}
                  </p>
                  <p className="text-secondary text-xs sm:text-sm mt-1">
                    ₦{paymentStats.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-primary text-lg sm:text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Paid</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-paid-payments">
                    {paymentStats.paid}
                  </p>
                  <p className="text-secondary text-xs sm:text-sm mt-1">
                    ₦{paymentStats.paidAmount.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-secondary text-lg sm:text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-pending-payments">
                    {paymentStats.pending}
                  </p>
                  <p className="text-accent text-xs sm:text-sm mt-1">
                    Awaiting payment
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-accent text-lg sm:text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Overdue</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-overdue-payments">
                    {paymentStats.overdue}
                  </p>
                  <p className="text-destructive text-xs sm:text-sm mt-1">
                    Requires attention
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-destructive text-lg sm:text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">Payment Management</CardTitle>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-payment" className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount (₦)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} data-testid="input-amount" className="w-full" />
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
                                <Input type="date" {...field} data-testid="input-due-date" className="w-full" />
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
                              <Input {...field} placeholder="e.g., School fees, Registration fee" data-testid="input-purpose" className="w-full" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <Input {...field} data-testid="input-academic-year" className="w-full" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto">
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-submit-payment" className="w-full sm:w-auto">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full sm:flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                  data-testid="input-search-payments"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" data-testid="button-export-payments" className="w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
              <div className="overflow-x-auto">
                <TabsList>
                  <TabsTrigger value="all">All ({paymentStats.total})</TabsTrigger>
                  <TabsTrigger value="paid">Paid ({paymentStats.paid})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({paymentStats.pending})</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue ({paymentStats.overdue})</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>

            {/* Payments Table */}
            {isLoading ? (
              <div className="text-center py-8">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No payments found matching your search." : "No payments found."}
              </div>
            ) : (
              <>
                {/* Mobile: Card view */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  {filteredPayments.map((payment: any) => (
                    <Card key={payment.$id} className="p-4 relative">
                      {/* Status badge at top right */}
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant={
                          payment.status === 'paid' ? 'primary' : 
                          payment.status === 'overdue' ? 'destructive' : 'secondary'
                        } className="px-2 py-1 text-xs shadow">{payment.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-base">Student #{payment.studentId}</div>
                          <div className="text-xs text-muted-foreground">{payment.purpose}</div>
                        </div>
                      </div>
                      <div className="text-sm mb-1"><span className="font-medium">Amount:</span> ₦{parseFloat(payment.amount.toString()).toLocaleString()}</div>
                      <div className="text-sm mb-1"><span className="font-medium">Due Date:</span> {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "N/A"}</div>
                      <div className="text-sm mb-1"><span className="font-medium">Term/Year:</span> {payment.term}, {payment.academicYear}</div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="outline" data-testid={`button-view-payment-${payment.$id}`}><Eye /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>View</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {payment.status === 'pending' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" data-testid={`button-mark-paid-${payment.$id}`}>✔</Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Mark Paid</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                {/* Desktop: Table view */}
                <div className="rounded-md border hidden sm:block">
                  <Table className="w-full min-w-full">
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
                        <TableRow key={payment.$id} className="table-row">
                          <TableCell>Student #{payment.studentId}</TableCell>
                          <TableCell>{payment.purpose}</TableCell>
                          <TableCell>₦{parseFloat(payment.amount.toString()).toLocaleString()}</TableCell>
                          <TableCell>{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={
                              payment.status === 'paid' ? 'primary' : 
                              payment.status === 'overdue' ? 'destructive' : 'secondary'
                            }>{payment.status}</Badge>
                          </TableCell>
                          <TableCell>{payment.term}, {payment.academicYear}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="icon" variant="outline" data-testid={`button-view-payment-${payment.$id}`}><Eye /></Button>
                              {payment.status === 'pending' && (
                                <Button size="icon" variant="outline" data-testid={`button-mark-paid-${payment.$id}`}>✔</Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
