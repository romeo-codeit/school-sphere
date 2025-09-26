import { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { useToast } from "@/components/ui/use-toast";
import { AttendanceForm } from "@/components/attendance-form";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";

export function AttendanceManagementView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Define how many items per page

  const { toast } = useToast();
  const { attendance, isLoading, deleteAttendance } = useAttendance();
  const { students } = useStudents();
  const { user } = useAuth();
  const { users } = useUsers();

  // This is a placeholder since the original useAttendance hook is not fully compatible
  const filteredAndPaginatedAttendance = attendance?.filter((record: any) => {
    const student = students?.find((s: any) => s.$id === record.studentId);
    const studentName = student ? `${student.firstName} ${student.lastName}` : "";

    const matchesSearch = (
      (record.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesDate = selectedDate ? new Date(record.date).toISOString().split('T')[0] === selectedDate : true;
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;

    return matchesSearch && matchesDate && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredAndPaginatedAttendance.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttendancePage = filteredAndPaginatedAttendance.slice(startIndex, endIndex);

  const handleAddRecord = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  const handleEditRecord = (record: any) => {
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      try {
        await deleteAttendance(recordToDelete);
        toast({
          title: "Success",
          description: "Attendance record deleted successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete record",
          variant: "destructive",
        });
      }
      setRecordToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students?.find((s: any) => s.$id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : studentId;
  };

  const getMarkedByName = (markedBy: string) => {
    const markedByUser = users?.find((u: any) => u.$id === markedBy);
    if (markedByUser) {
      return markedByUser.name || markedByUser.email || markedBy;
    }
    return markedBy;
  };
  return (
    <div className="space-y-6">
      <TopNav title="Attendance" subtitle="View and manage student attendance records" />

      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance Records</CardTitle>
              <Button onClick={handleAddRecord}>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </div>
          </CardHeader>
          <CardContent>
             <div className="text-center py-8 text-muted-foreground">
                This view is temporarily disabled. Please use "Take Attendance" or "Historical Attendance" pages.
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}