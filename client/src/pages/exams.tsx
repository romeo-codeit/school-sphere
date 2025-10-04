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
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, Search, FileText, Play, Clock, Users } from "lucide-react";
import { useExams } from "@/hooks/useExams";
import { useLocation } from "wouter";
import { UploadExamForm } from "@/components/upload-exam-form";


// ExamPreviewDialog should only render the preview dialog
function ExamPreviewDialog({ exam, open, onOpenChange }: { exam: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!exam) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exam Preview</DialogTitle>
        </DialogHeader>
        {/* Render exam details here */}
        <div className="space-y-4">
          <div className="font-bold text-lg">{exam.title}</div>
          <div className="text-sm text-muted-foreground">Type: {exam.type}</div>
          <div className="text-sm text-muted-foreground">Subject: {exam.subject}</div>
          <div className="text-sm text-muted-foreground">Duration: {exam.duration} mins</div>
          <div className="text-sm text-muted-foreground">Questions: {Array.isArray(exam.questions) ? exam.questions.length : 0}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Exams Page
export default function ExamsPage() {
  const { exams, isLoading } = useExams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [selectedExamForPreview, setSelectedExamForPreview] = useState<any | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [, navigate] = useLocation();

  // Filter exams by type and search
  const filteredExams = (exams || []).filter((exam: any) => {
    const matchesType = selectedType === "all" || exam.type === selectedType;
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Stats (example, adjust as needed)
  const examStats = {
    jamb: (exams || []).filter((e: any) => e.type === "jamb").length,
    waec: (exams || []).filter((e: any) => e.type === "waec").length,
    neco: (exams || []).filter((e: any) => e.type === "neco").length,
    internal: (exams || []).filter((e: any) => e.type === "internal").length,
  };

  const handleStartExam = (examId: string) => {
  navigate(`/exams/${examId}/take`);
  };

  const handlePreviewExam = (exam: any) => {
    setSelectedExamForPreview(exam);
    setIsPreviewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <TopNav title="Exams" subtitle="Manage examination questions and practice tests" showGoBackButton={true} />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-primary text-xl sm:text-2xl" />
              </div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base mb-2">JAMB Questions</h4>
              <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-jamb-count">
                {examStats.jamb}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Available Sets</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-secondary text-xl sm:text-2xl" />
              </div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base mb-2">WAEC Questions</h4>
              <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-waec-count">
                {examStats.waec}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Available Sets</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-accent text-xl sm:text-2xl" />
              </div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base mb-2">NECO Questions</h4>
              <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-neco-count">
                {examStats.neco}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Available Sets</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-primary text-xl sm:text-2xl" />
              </div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base mb-2">Internal Exams</h4>
              <p className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-internal-count">
                {examStats.internal}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">School Tests</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">Examination Management</CardTitle>
              <Button onClick={() => setIsUploadFormOpen(true)} data-testid="button-upload-exam" className="w-full sm:w-auto">
                <Upload className="w-4 h-4 mr-2" />
                Upload Questions
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="relative w-full sm:flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                  data-testid="input-search-exams"
                />
              </div>
            </div>

            {/* Exam Types Tabs */}
            <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
              <div className="overflow-x-auto">
                <TabsList>
                  <TabsTrigger value="all">All Exams</TabsTrigger>
                  <TabsTrigger value="jamb">JAMB</TabsTrigger>
                  <TabsTrigger value="waec">WAEC</TabsTrigger>
                  <TabsTrigger value="neco">NECO</TabsTrigger>
                  <TabsTrigger value="internal">Internal</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>

            {/* Exams List: Mobile Card view and Desktop Table view */}
            {isLoading ? (
              <div className="text-center py-8">Loading exams...</div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No exams found matching your search." : "No exams available."}
              </div>
            ) : (
              <>
                {/* Mobile: Card view */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  {filteredExams.map((exam: any) => (
                    <Card key={exam.$id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-base">{exam.title}</div>
                          <div className="text-xs text-muted-foreground">{exam.subject}</div>
                        </div>
                        <Badge variant={exam.isActive ? 'primary' : 'secondary'} className="text-xs">
                          {exam.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm mb-1"><span className="font-medium">Type:</span> {exam.type.toUpperCase()}</div>
                      <div className="text-sm mb-1"><span className="font-medium">Questions:</span> {Array.isArray(exam.questions) ? exam.questions.length : 0}</div>
                      <div className="text-sm mb-1"><span className="font-medium">Duration:</span> {exam.duration || 0} mins</div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button size="icon" variant="outline" onClick={() => handlePreviewExam(exam)} className="p-2"><FileText className="w-4 h-4" /></Button>
                        <Button size="icon" onClick={() => handleStartExam(exam.$id)} className="p-2"><Play className="w-4 h-4" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
                {/* Desktop: Table view */}
                <div className="rounded-md border hidden sm:block">
                  <Table className="w-full min-w-full">
                    <TableHeader className="table-header-group">
                      <TableRow>
                        <TableHead>Exam Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam: any) => (
                        <TableRow key={exam.$id}>
                          <TableCell>
                            <div className="font-medium text-sm sm:text-base">{exam.title}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">{exam.subject}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={'text-xs sm:text-sm ' + (exam.type === 'jamb' ? 'border-primary text-primary' : exam.type === 'waec' ? 'border-secondary text-secondary' : exam.type === 'neco' ? 'border-accent text-accent' : 'border-muted-foreground text-muted-foreground')}>
                              {exam.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">{exam.subject}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{Array.isArray(exam.questions) ? exam.questions.length : 0} questions</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-xs sm:text-sm">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                              <span>{exam.duration || 0} mins</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={exam.isActive ? 'primary' : 'secondary'} className={'text-xs sm:text-sm ' + (exam.isActive ? 'bg-secondary/10 text-secondary' : 'bg-muted/10 text-muted-foreground')}>
                              {exam.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => handlePreviewExam(exam)}><FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Preview</Button>
                              <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => handleStartExam(exam.$id)}><Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Start</Button>
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
        <ExamPreviewDialog
          exam={selectedExamForPreview}
          open={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
        />
        <Dialog open={isUploadFormOpen} onOpenChange={setIsUploadFormOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Upload New Exam</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new exam.
              </DialogDescription>
            </DialogHeader>
            <UploadExamForm onFinished={() => setIsUploadFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}