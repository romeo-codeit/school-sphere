import React, { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { TeacherForm } from "@/components/teacher-form";
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
import { useTeachers } from "@/hooks/useTeachers";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";
import { Loading } from "@/components/ui/loading";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useTeachersPerformanceTest, logTeachersPerformanceMetrics } from '@/hooks/useTeachersPerformanceTest';

export default function Teachers() {
  // Handler to view teacher details
  const handleViewTeacher = (teacherId: string) => {
    setLocation(`/teachers/${teacherId}`);
  };

  // Handler to edit teacher
  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsFormOpen(true);
  };

  // Handler to open delete dialog
  const openDeleteDialog = (teacherId: string) => {
    setTeacherToDelete(teacherId);
    setIsDeleteDialogOpen(true);
  };

  // Handler to confirm delete
  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    try {
      await deleteTeacher(teacherToDelete);
  toast({ title: "Teacher deleted", description: "The teacher record has been deleted.", variant: "default" });
      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
      setSelectedTeacher(null);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to delete teacher.", variant: "destructive" });
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { hasPermission } = useRole();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [, setLocation] = useLocation();

  const { testPerformance, clearCache } = useTeachersPerformanceTest();

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logTeachersPerformanceMetrics('Performance Test Completed', metrics.totalTime, metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).teachersPerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
    }
  }, []);

  const { teachers, total, isLoading, deleteTeacher } = useTeachers({
      page: currentPage,
      limit: 10,
      search: debouncedSearchQuery,
  });

  const totalPages = total ? Math.ceil(total / 10) : 1;

  return (
    <>
      <TopNav title="Teachers" subtitle="Manage teacher records and information" showGoBackButton={true} />
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <ErrorBoundary>
            <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl">Teacher Management</CardTitle>
                {hasPermission("teachers", "create") && (
                  <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto"><UserPlus className="w-4 h-4 mr-2" /> Add Teacher</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search teachers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-full text-sm sm:text-base" />
                </div>
              </div>
              {isLoading ? (
                <TableSkeleton columns={4} rows={5} />
              ) : !teachers || teachers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-base sm:text-lg">{searchQuery ? "No teachers found." : "No teachers have been added."}</div>
              ) : (
                <>
                  {/* Mobile: Card view */}
                  <div className="grid grid-cols-1 gap-4 sm:hidden">
                    {teachers.map((teacher: any) => (
                      <Card key={teacher.$id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-base">{teacher.firstName} {teacher.lastName}</div>
                            <div className="text-xs text-muted-foreground">{teacher.email}</div>
                          </div>
                          <Badge variant={teacher.status === 'active' ? 'primary' : teacher.status === 'on-leave' ? 'secondary' : 'destructive'}>{teacher.status}</Badge>
                        </div>
                        <div className="text-sm mb-1"><span className="font-medium">Employee ID:</span> {teacher.employeeId}</div>
                        <div className="flex gap-2 mt-2 justify-end">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" onClick={() => handleViewTeacher(teacher.$id)}><Eye /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>View</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {hasPermission("teachers", "update") && 
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="outline" onClick={() => handleEditTeacher(teacher)}><Edit /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Edit</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          }
                          {hasPermission("teachers", "delete") && 
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="destructive" onClick={() => openDeleteDialog(teacher.$id)}><Trash2 /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          }
                        </div>
                      </Card>
                    ))}
                  </div>
                  {/* Desktop: Table view and pagination */}
                  <div>
                    <div className="rounded-md border overflow-x-auto hidden sm:block">
                      <Table className="min-w-[700px] text-xs sm:text-sm lg:text-base">
                        <TableHeader>
                          <TableRow><TableHead>Teacher</TableHead><TableHead>Employee ID</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                          {teachers.map((teacher: any) => (
                            <TableRow key={teacher.$id}>
                              <TableCell>
                                <div className="font-medium text-sm sm:text-base">{teacher.firstName} {teacher.lastName}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">{teacher.email}</div>
                              </TableCell>
                              <TableCell>{teacher.employeeId}</TableCell>
                              <TableCell><Badge variant={teacher.status === 'active' ? 'primary' : teacher.status === 'on-leave' ? 'secondary' : 'destructive'}>{teacher.status}</Badge></TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewTeacher(teacher.$id)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                    {hasPermission("teachers", "update") && <DropdownMenuItem onClick={() => handleEditTeacher(teacher)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>}
                                    {hasPermission("teachers", "delete") && <DropdownMenuItem onClick={() => openDeleteDialog(teacher.$id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>}
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

        <TeacherForm open={isFormOpen} onOpenChange={setIsFormOpen} teacher={selectedTeacher} />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the teacher record.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}