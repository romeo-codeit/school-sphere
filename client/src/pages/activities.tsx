import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { Activity, FileText, Users, BookOpen, Search, Clock, Download, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/top-nav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useActivitiesPerformanceTest } from "@/hooks/useActivitiesPerformanceTest";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export default function ActivitiesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["allActivities"],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, "activities", []);
      return res.documents;
    },
  });

  useActivitiesPerformanceTest();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");

  const types = ["All", "Exam", "Student", "Teacher", "Other"];

  const getActivityType = (activity: string) => {
    if (activity.toLowerCase().includes('exam')) return 'Exam';
    if (activity.toLowerCase().includes('student')) return 'Student';
    if (activity.toLowerCase().includes('teacher')) return 'Teacher';
    return 'Other';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Exam: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      Student: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Teacher: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      Exam: BookOpen,
      Student: Users,
      Teacher: Users,
      Other: FileText,
    };
    return icons[type] || FileText;
  };

  // Filter activities by search and type
  const filtered = (data || []).filter((activity: any) => {
    const matchesSearch = activity.activity.toLowerCase().includes(search.toLowerCase());
    const activityType = getActivityType(activity.activity);
    const matchesType = selectedType === "All" || activityType === selectedType;
    return matchesSearch && matchesType;
  });

  // Activity type summary
  const typeCounts = (data || []).reduce((acc: any, activity: any) => {
    const type = getActivityType(activity.activity);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Export to CSV
  const exportCSV = () => {
    const rows = [
      ['Type', 'Activity', 'Date'],
      ...filtered.map((a: any) => [
        a.activity,
        a.activity,
        new Date(a.date).toLocaleString()
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activities.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TopNav title="Recent Activities" subtitle="Track all school events and actions" showGoBackButton />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Exams</p>
                    <p className="text-2xl font-bold">{typeCounts.Exam || 0}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="text-2xl font-bold">{typeCounts.Student || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Teachers</p>
                    <p className="text-2xl font-bold">{typeCounts.Teacher || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Other</p>
                    <p className="text-2xl font-bold">{typeCounts.Other || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button onClick={exportCSV} variant="outline" className="h-12 px-6">
              <Download className="w-5 h-5 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedType === type
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-card hover:bg-accent text-muted-foreground hover:text-foreground border"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <TableSkeleton rows={6} columns={2} />
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                  <FileText className="w-12 h-12 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Activities</h3>
                <p className="text-muted-foreground">Unable to fetch activities. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Activity}
                title="No Activities Found"
                description={search || selectedType !== "All" 
                  ? "Try adjusting your filters to see more activities." 
                  : "No activities have been recorded yet. Activities will appear here as they occur."}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((activity: any) => {
              const activityType = getActivityType(activity.activity);
              const TypeIcon = getTypeIcon(activityType);
              return (
                <Card 
                  key={activity.$id} 
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl shrink-0">
                        <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg leading-tight group-hover:text-primary transition-colors break-words">
                            {activity.activity}
                          </h3>
                          <Badge className={`${getTypeColor(activityType)} shrink-0 self-start`}>
                            {activityType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDate(activity.date)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}
