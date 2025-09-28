import { useState, useEffect } from "react";
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
import { useTeachers } from "@/hooks/useTeachers";
import { useLocation } from "wouter";
import { useDebounce } from "@/hooks/useDebounce";

export default function Teachers() {
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

  const { teachers, total, isLoading, deleteTeacher } = useTeachers({
      page: currentPage,
      limit: 10,
      search: debouncedSearchQuery,
  });

  const totalPages = total ? Math.ceil(total / 10) : 1;

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setIsFormOpen(true);
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleViewTeacher = (teacherId: string) => {
    setLocation(`/teachers/${teacherId}`);
  };

  const openDeleteDialog = (id: string) => {
    setTeacherToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (teacherToDelete) {
      try {
        await deleteTeacher(teacherToDelete);
        toast({ title: "Success", description: "Teacher deleted successfully" });
        if (teachers?.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to delete teacher", variant: "destructive" });
      }
      setTeacherToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <TopNav title="Teachers" subtitle="Manage teacher records and information" showGoBackButton={true} />
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Teacher Management</CardTitle>
              {hasPermission("teachers", "create") && (
                <Button onClick={handleAddTeacher}><UserPlus className="w-4 h-4 mr-2" /> Add Teacher</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search teachers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </div>

            {isLoading ? <div className="text-center py-8">Loading teachers...</div> :
             !teachers || teachers.length === 0 ? <div className="text-center py-8 text-muted-foreground">{searchQuery ? "No teachers found." : "No teachers have been added."}</div> :
             (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Teacher</TableHead><TableHead>Employee ID</TableHead><TableHead>Subjects</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.map((teacher: any) => (
                        <TableRow key={teacher.$id}>
                          <TableCell>
                            <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                            <div className="text-sm text-muted-foreground">{teacher.email}</div>
                          </TableCell>
                          <TableCell>{teacher.employeeId}</TableCell>
                          <TableCell>{teacher.subjects?.join(', ')}</TableCell>
                          <TableCell><Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>{teacher.status}</Badge></TableCell>
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

      <TeacherForm open={isFormOpen} onOpenChange={setIsFormOpen} teacher={selectedTeacher} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the teacher record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}