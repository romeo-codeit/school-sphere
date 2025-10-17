import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
  DialogDescription,
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
  Eye,
  Users,
  Settings,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePayments } from "@/hooks/usePayments";
import { useStudents } from "@/hooks/useStudents";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { usePaymentsPerformanceTest, logPaymentsPerformanceMetrics } from '@/hooks/usePaymentsPerformanceTest';
import React from "react";

const paymentFormSchema = z.object({
  studentId: z.string(),
  amount: z.string(),
  purpose: z.string(),
  dueDate: z.string().optional(),
  status: z.string(),
  term: z.string(),
  academicYear: z.string(),
});

const bulkPaymentFormSchema = z.object({
  fees: z.array(z.object({
    purpose: z.string(),
    amount: z.string(),
    dueDate: z.string(),
    term: z.string(),
  })),
  academicYear: z.string(),
  applyToAllStudents: z.boolean(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;
type BulkPaymentFormData = z.infer<typeof bulkPaymentFormSchema>;

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [isGeneratingPayments, setIsGeneratingPayments] = useState(false);
  const { toast } = useToast();

  const { payments, isLoading, createPayment } = usePayments();
  const { students } = useStudents();

  const { testPerformance, clearCache } = usePaymentsPerformanceTest();

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logPaymentsPerformanceMetrics(metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).paymentsPerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
    }
  }, []);

  const bulkForm = useForm<BulkPaymentFormData>({
    resolver: zodResolver(bulkPaymentFormSchema),
    defaultValues: {
      fees: [
        { purpose: "First Term School Fee", amount: "", dueDate: "", term: "First Term" },
        { purpose: "Second Term School Fee", amount: "", dueDate: "", term: "Second Term" },
        { purpose: "Third Term School Fee", amount: "", dueDate: "", term: "Third Term" },
      ],
      academicYear: "2024/2025",
      applyToAllStudents: true,
    },
  });

  const singleForm = useForm<PaymentFormData>({
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
      singleForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment record",
        variant: "destructive",
      });
    }
  };

  const addFeeRow = () => {
    const currentFees = bulkForm.getValues("fees");
    bulkForm.setValue("fees", [
      ...currentFees,
      { purpose: "", amount: "", dueDate: "", term: "First Term" }
    ]);
  };

  const removeFeeRow = (index: number) => {
    const currentFees = bulkForm.getValues("fees");
    if (currentFees.length > 1) {
      bulkForm.setValue("fees", currentFees.filter((_, i) => i !== index));
    }
  };

  const onBulkSubmit = async (data: BulkPaymentFormData) => {
    if (!students || students.length === 0) {
      toast({
        title: "Error",
        description: "No students found to create payments for",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPayments(true);
    try {
      let createdCount = 0;
      const totalPayments = data.fees.length * students.length;

      // Create payments for each fee for each student
      for (const fee of data.fees) {
        for (const student of students) {
          const paymentData = {
            studentId: student.$id,
            amount: parseFloat(fee.amount),
            purpose: fee.purpose,
            dueDate: fee.dueDate,
            status: "pending",
            term: fee.term,
            academicYear: data.academicYear,
          };

          await createPayment(paymentData);
          createdCount++;
        }
      }

      toast({
        title: "Success",
        description: `Created ${createdCount} payment records for ${students.length} students`,
      });
      setIsBulkFormOpen(false);
      bulkForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create bulk payment records",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPayments(false);
    }
  };

  return (
    <div className="space-y-6">
      <TopNav title="Payments" subtitle="Track and manage student fee payments" showGoBackButton={true} />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary>
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
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Users className="w-4 h-4 mr-2" />
                      Bulk Create Payments
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="px-6 pt-6 pb-4">
                      <DialogTitle className="text-xl sm:text-2xl">Create Payment Records for All Students</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground mt-2">
                        Set up fee structures that will be applied to all students
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="overflow-y-auto px-6 flex-1">
                      <Form {...bulkForm}>
                        <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-6 pb-6">
                        <FormField
                          control={bulkForm.control}
                          name="academicYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Academic Year</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select academic year" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                                  <SelectItem value="2026/2027">2026/2027</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <FormLabel>Fee Structure</FormLabel>
                            <Button type="button" variant="outline" size="sm" onClick={addFeeRow}>
                              <Plus className="w-4 h-4 mr-1" />
                              Add Fee
                            </Button>
                          </div>
                          {bulkForm.watch("fees").map((_, index) => (
                            <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg relative bg-card/50">
                              <FormField
                                control={bulkForm.control}
                                name={`fees.${index}.purpose`}
                                render={({ field }) => (
                                  <FormItem className="sm:col-span-2 lg:col-span-1">
                                    <FormLabel className="text-xs sm:text-sm">Purpose</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g., First Term School Fee" className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={bulkForm.control}
                                name={`fees.${index}.amount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs sm:text-sm">Amount (₦)</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" placeholder="50000" className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={bulkForm.control}
                                name={`fees.${index}.dueDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs sm:text-sm">Due Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="date" className="h-9" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                                <FormField
                                  control={bulkForm.control}
                                  name={`fees.${index}.term`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormLabel className="text-xs sm:text-sm">Term</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="h-9">
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
                                {bulkForm.watch("fees").length > 1 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeFeeRow(index)}
                                    className="self-end h-9 px-3"
                                    title="Remove this fee"
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            This will create <span className="font-semibold">{bulkForm.watch("fees").length}</span> payment records for each of the <span className="font-semibold">{students?.length || 0}</span> students 
                            (<span className="font-semibold text-primary">{(bulkForm.watch("fees").length * (students?.length || 0))} total records</span>)
                          </p>
                          <Button type="submit" disabled={isGeneratingPayments} className="w-full sm:w-auto">
                            {isGeneratingPayments ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create All Payments"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-payment" className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-xl sm:text-2xl">Add New Payment Record</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-2">
                      Create a payment record for a specific student
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="overflow-y-auto px-6 flex-1">
                    <Form {...singleForm}>
                      <form onSubmit={singleForm.handleSubmit(onSubmit)} className="space-y-6 pb-6">
                      <FormField
                        control={singleForm.control}
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
                          control={singleForm.control}
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
                          control={singleForm.control}
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
                        control={singleForm.control}
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
                          control={singleForm.control}
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
                          control={singleForm.control}
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
                  </div>
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
              <TableSkeleton columns={7} rows={5} />
            ) : filteredPayments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title={searchQuery ? "No Payments Found" : "No Payments Yet"}
                description={searchQuery ? "Try adjusting your search or filter criteria." : "Payment records will appear here once students start making payments."}
              />
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
        </ErrorBoundary>
      </div>
    </div>
  );
}
