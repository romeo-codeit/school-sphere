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

function ExamPreviewDialog({ exam, open, onOpenChange }: { exam: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{exam.title}</DialogTitle>
          <DialogDescription>
            {exam.subject} - {Array.isArray(exam.questions) ? exam.questions.length : 0} questions
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4">
          {Array.isArray(exam.questions) && exam.questions.map((q: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg">
              <p className="font-semibold">Question {index + 1}: {q.question}</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {Array.isArray(q.options) && q.options.map((option: string, i: number) => (
                  <li key={i} className={option === q.correctAnswer ? "text-green-600 font-bold" : ""}>
                    {option}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Exams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const { exams, isLoading } = useExams();
  const [, setLocation] = useLocation();
  const [selectedExamForPreview, setSelectedExamForPreview] = useState<any | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);

  const filteredExams = exams?.filter((exam: any) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || exam.type === selectedType;
    return matchesSearch && matchesType;
  }) || [];

  const examStats = {
    jamb: exams?.filter((e: any) => e.type === "jamb").length || 0,
    waec: exams?.filter((e: any) => e.type === "waec").length || 0,
    neco: exams?.filter((e: any) => e.type === "neco").length || 0,
    internal: exams?.filter((e: any) => e.type === "internal").length || 0,
  };

  const handleStartExam = (examId: string) => {
    setLocation(`/exams/${examId}/take`);
  };

  const handlePreviewExam = (exam: any) => {
    setSelectedExamForPreview(exam);
    setIsPreviewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <TopNav title="Exams" subtitle="Manage examination questions and practice tests" showGoBackButton={true} />
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-primary text-2xl" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">JAMB Questions</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="text-jamb-count">
                {examStats.jamb}
              </p>
              <p className="text-sm text-muted-foreground">Available Sets</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-secondary text-2xl" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">WAEC Questions</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="text-waec-count">
                {examStats.waec}
              </p>
              <p className="text-sm text-muted-foreground">Available Sets</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-accent text-2xl" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">NECO Questions</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="text-neco-count">
                {examStats.neco}
              </p>
              <p className="text-sm text-muted-foreground">Available Sets</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-primary text-2xl" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Internal Exams</h4>
              <p className="text-2xl font-bold text-foreground" data-testid="text-internal-count">
                {examStats.internal}
              </p>
              <p className="text-sm text-muted-foreground">School Tests</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Examination Management</CardTitle>
              <Button onClick={() => setIsUploadFormOpen(true)} data-testid="button-upload-exam">
                <Upload className="w-4 h-4 mr-2" />
                Upload Questions
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-exams"
                />
              </div>
            </div>

            {/* Exam Types Tabs */}
            <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Exams</TabsTrigger>
                <TabsTrigger value="jamb">JAMB</TabsTrigger>
                <TabsTrigger value="waec">WAEC</TabsTrigger>
                <TabsTrigger value="neco">NECO</TabsTrigger>
                <TabsTrigger value="internal">Internal</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Exams Table */}
            {isLoading ? (
              <div className="text-center py-8">Loading exams...</div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No exams found matching your search." : "No exams available."}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
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
                          <div>
                            <p className="font-medium" data-testid={`text-exam-title-${exam.$id}`}>
                              {exam.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(exam.$createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              exam.type === 'jamb' ? 'border-primary text-primary' :
                              exam.type === 'waec' ? 'border-secondary text-secondary' :
                              exam.type === 'neco' ? 'border-accent text-accent' :
                              'border-muted-foreground text-muted-foreground'
                            }
                            data-testid={`badge-exam-type-${exam.$id}`}
                          >
                            {exam.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-exam-subject-${exam.$id}`}>
                          {exam.subject}
                        </TableCell>
                        <TableCell data-testid={`text-exam-questions-${exam.$id}`}>
                          {Array.isArray(exam.questions) ? exam.questions.length : 0} questions
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span data-testid={`text-exam-duration-${exam.$id}`}>
                              {exam.duration || 0} mins
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={exam.isActive ? 'default' : 'secondary'}
                            className={exam.isActive ? 'bg-secondary/10 text-secondary' : 'bg-muted/10 text-muted-foreground'}
                            data-testid={`badge-exam-status-${exam.$id}`}
                          >
                            {exam.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-preview-exam-${exam.$id}`}
                              onClick={() => handlePreviewExam(exam)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleStartExam(exam.$id)}
                              data-testid={`button-start-exam-${exam.$id}`}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
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
  );
}