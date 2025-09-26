import { useState } from "react";
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
import { AdminOnly } from "@/components/RoleGuard";
import { useTeachers } from "@/hooks/useTeachers";
import { useLocation } from "wouter";
import { Teacher } from "~/shared/schema";

export default function Teachers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasPermission } = useRole();
  const { teachers, isLoading, deleteTeacher } = useTeachers();
  const [, setLocation] = useLocation();

  const filteredTeachers = teachers?.filter((teacher: Teacher) =>
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setIsFormOpen(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
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
        toast({
          title: "Success",
          description: "Teacher deleted successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete teacher",
          variant: "destructive",
        });
      }
      setTeacherToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'on-leave':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="space-y-6">
      <TopNav title="Teachers" subtitle="Manage teacher records and information" />

      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Teacher Management</CardTitle>
              <AdminOnly>
                <Button onClick={handleAddTeacher}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Teacher
                </Button>
              </AdminOnly>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted border-0 focus-visible:ring-primary"
                />
              </div>
            </div>

            {!hasPermission("teachers", "read") ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">Access Denied</div>
                <p className="text-sm">You don't have permission to view teacher records.</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">Loading teachers...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No teachers found matching your search." : "No teachers found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="py-3">Teacher</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher: Teacher) => (
                      <TableRow key={teacher.$id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-primary font-medium text-sm">
                                  {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                                </span>
                              </div>
                            <div>
                              <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                              <p className="text-sm text-muted-foreground">{teacher.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{teacher.employeeId}</TableCell>
                        <TableCell>{teacher.subjects?.join(', ')}</TableCell>
                        <TableCell>{teacher.phone}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(teacher.status)}>
                            {teacher.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewTeacher(teacher.$id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <AdminOnly>
                                <DropdownMenuItem onClick={() => handleEditTeacher(teacher)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDeleteDialog(teacher.$id)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AdminOnly>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <TeacherForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        teacher={selectedTeacher}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the teacher record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}