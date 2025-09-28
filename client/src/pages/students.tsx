import { useState, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";

export default function Students() {
  console.log('Students page mounted');
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { hasPermission } = useRole();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const classIdFromUrl = searchParams.get('classId');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { students, total, isLoading: studentsLoading, deleteStudent } = useStudents({
      page: currentPage,
      limit: 10,
      search: debouncedSearchQuery,
      classId: classIdFromUrl,
  });
  const { classes, isLoading: classesLoading } = useClasses();

  const classMap = classes?.reduce((acc: any, currentClass: any) => {
    acc[currentClass.$id] = currentClass.name;
    return acc;
  }, {});

  const isLoading = studentsLoading || classesLoading;
  const totalPages = total ? Math.ceil(total / 10) : 1;

  const pageTitle = classIdFromUrl && classMap && classMap[classIdFromUrl] ? `Students in ${classMap[classIdFromUrl]}` : "Students";
  const pageSubtitle = classIdFromUrl ? "Viewing students for a specific class" : "Manage student records and information";

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleViewStudent = (studentId: string) => {
    setLocation(`/students/${studentId}`);
  };

  const openDeleteDialog = (id: string) => {
    setStudentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      try {
        await deleteStudent(studentToDelete);
        toast({ title: "Success", description: "Student deleted successfully" });
        if (students?.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to delete student", variant: "destructive" });
      }
      setStudentToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  try {
    return (
    <div className="space-y-6">
      <TopNav title={pageTitle} subtitle={pageSubtitle} showGoBackButton={true} />
      
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Student Management</CardTitle>
              {hasPermission('students', 'create') && (
                <Button onClick={handleAddStudent} data-testid="button-add-student">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Student
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? <div className="text-center py-8">Loading students...</div> :
             !students || students.length === 0 ? <div className="text-center py-8 text-muted-foreground">{searchQuery ? "No students found." : "No students have been added."}</div> :
             (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Student</TableHead><TableHead>Student ID</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student: any) => (
                        <TableRow key={student.$id}>
                          <TableCell>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
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
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <StudentForm open={isFormOpen} onOpenChange={setIsFormOpen} student={selectedStudent} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the student record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  } catch (err) {
    console.error('Students page error:', err);
    return <div style={{color: 'red', padding: 24}}>A fatal error occurred in Students page. Check the console for details.</div>;
  }
}