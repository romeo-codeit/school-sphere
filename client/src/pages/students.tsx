import React, { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { StudentForm } from "@/components/student-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserPlus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";
import { Loading } from "@/components/ui/loading";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useStudentsPerformanceTest, logStudentsPerformanceMetrics } from '@/hooks/useStudentsPerformanceTest';

export default function Students() {
  // Page title and subtitle
  const pageTitle = "Students";
  const pageSubtitle = "Manage student records, view details, and perform actions.";

  // Permissions
  const { hasPermission } = useRole();

  // Students data
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  const [, setLocation] = useLocation();

  const { testPerformance, clearCache } = useStudentsPerformanceTest();

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logStudentsPerformanceMetrics('Performance Test Completed', metrics.totalTime, metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).studentsPerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
      console.log('👥 Students Performance Testing available in console:');
      console.log('  window.studentsPerfTest.testPerformance() - Run performance test');
      console.log('  window.studentsPerfTest.clearCache() - Clear cache and reload');
    }
  }, []);

  // Fetch students
  const {
    students,
    total,
    isLoading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
  } = useStudents({ search: searchQuery, page: currentPage, limit: 10 });
  const totalPages = total ? Math.ceil(total / 10) : 1;

  // Fetch classes
  const { classes } = useClasses();
  // Build classMap for quick lookup
  const classMap = classes ? Object.fromEntries(classes.map((c: any) => [c.$id, c.name])) : {};

  // Utility for badge variant
  const getStatusVariant = (status: string) => {
    if (status === 'active') return 'primary';
    if (status === 'inactive') return 'secondary';
    return 'destructive';
  };

  // Handlers
  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };
  const handleViewStudent = (id: string) => {
    setLocation(`/students/${id}`);
  };
  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };
  const openDeleteDialog = (id: string) => {
  setStudentToDelete(null);
    setIsDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
  // Implement delete logic (mutation should refetch automatically)
  setIsDeleteDialogOpen(false);
  setStudentToDelete(null);
  };
  return (
    <>
      <TopNav title={pageTitle} subtitle={pageSubtitle} showGoBackButton={true} />
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <ErrorBoundary>
            <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl">Student Management</CardTitle>
                {hasPermission('students', 'create') && (
                  <Button onClick={handleAddStudent} data-testid="button-add-student" className="w-full sm:w-auto">
                    <UserPlus className="w-4 h-4 mr-2" /> Add Student
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 w-full text-sm sm:text-base"
                  />
                </div>
              </div>
              {isLoading ? (
                <TableSkeleton columns={5} rows={5} />
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Error loading students: {error.message}
                </div>
              ) : !students || students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-base sm:text-lg">{searchQuery ? "No students found." : "No students have been added."}</div>
              ) : (
                <>
                  {/* Mobile: Card view */}
                  <div className="grid grid-cols-1 gap-4 sm:hidden">
                    {students.map((student: any) => (
                      <Card key={student.$id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-base">{student.firstName} {student.lastName}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                          <Badge variant={getStatusVariant(student.status)}>{student.status}</Badge>
                        </div>
                        <div className="text-sm mb-1"><span className="font-medium">Student ID:</span> {student.studentId}</div>
                        <div className="text-sm mb-1"><span className="font-medium">Class:</span> {classMap && classMap[student.classId] ? classMap[student.classId] : 'N/A'}</div>
                        <div className="flex gap-2 mt-2 justify-end">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" onClick={() => handleViewStudent(student.$id)}><Eye /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>View</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {hasPermission('students', 'update') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="outline" onClick={() => handleEditStudent(student)}><Edit /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Edit</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {hasPermission('students', 'delete') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="destructive" onClick={() => openDeleteDialog(student.$id)}><Trash2 /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                  {/* Desktop: Table view and pagination */}
                  <div className="hidden sm:block">
                    <div className="rounded-md border overflow-x-auto">
                      <Table className="min-w-[700px] text-xs sm:text-sm lg:text-base">
                        <TableHeader>
                          <TableRow><TableHead>Student</TableHead><TableHead>Student ID</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student: any) => (
                            <TableRow key={student.$id}>
                              <TableCell>
                                <div className="font-medium text-sm sm:text-base">{student.firstName} {student.lastName}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">{student.email}</div>
                              </TableCell>
                              <TableCell>{student.studentId}</TableCell>
                              <TableCell>{classMap && classMap[student.classId] ? classMap[student.classId] : 'N/A'}</TableCell>
                              <TableCell><Badge variant={getStatusVariant(student.status)}>{student.status}</Badge></TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewStudent(student.$id)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                    {hasPermission('students', 'update') && <DropdownMenuItem onClick={() => handleEditStudent(student)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>}
                                    {hasPermission('students', 'delete') && <DropdownMenuItem onClick={() => openDeleteDialog(student.$id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2 py-4">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                      <span className="text-sm">Page {currentPage} of {totalPages}</span>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          </ErrorBoundary>
        </div>
        <StudentForm open={isFormOpen} onOpenChange={setIsFormOpen} student={selectedStudent} />
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the student record.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
