import { useQuery, useQueryClient } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { Megaphone, Calendar as CalendarIcon, FileText, Bell, Search, Clock, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useNoticesPerformanceTest } from "@/hooks/useNoticesPerformanceTest";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export default function NoticesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["allNotices"],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, "notices", []);
      return res.documents;
    },
  });

  // Performance testing hook
  useNoticesPerformanceTest();

  const [showModal, setShowModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ activity: "", date: "", category: "General" });
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    if (data) setNotices(data);
  }, [data]);

  const handleCreateNotice = async () => {
    try {
      await databases.createDocument(DATABASE_ID, "notices", "unique()", {
        activity: newNotice.activity,
        date: newNotice.date,
        category: newNotice.category,
      });
      // Refetch notices
      queryClient.invalidateQueries({ queryKey: ["allNotices"] });
      setShowModal(false);
      setNewNotice({ activity: "", date: "", category: "General" });
    } catch (error) {
      // You might want to show an error toast here
    }
  };

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "General", "Exam", "Payment", "Announcement", "Event", "Holiday"];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      General: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Exam: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      Payment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Announcement: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Event: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      Holiday: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    };
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      General: FileText,
      Exam: FileText,
      Payment: FileText,
      Announcement: Megaphone,
      Event: CalendarIcon,
      Holiday: CalendarIcon,
    };
    return icons[category] || FileText;
  };

  // Filter notices by search and category
  const filtered = (notices || []).filter((notice: any) => {
    const matchesSearch = notice.activity.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || notice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TopNav title="Notice Board" subtitle="Stay updated with school announcements and events" showGoBackButton />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search notices..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button onClick={() => setShowModal(true)} className="h-12 px-6">
              <Megaphone className="w-5 h-5 mr-2" />
              Post Notice
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-card hover:bg-accent text-muted-foreground hover:text-foreground border"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Modal for Creating Notice */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  Post New Notice
                </CardTitle>
                <CardDescription>Share important information with everyone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Notice Content</label>
                  <textarea
                    className="w-full p-3 border rounded-lg min-h-[120px] focus:ring-2 focus:ring-primary"
                    placeholder="Write your notice here..."
                    value={newNotice.activity}
                    onChange={e => setNewNotice({ ...newNotice, activity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={newNotice.date}
                    onChange={e => setNewNotice({ ...newNotice, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <select
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    value={newNotice.category}
                    onChange={e => setNewNotice({ ...newNotice, category: e.target.value })}
                  >
                    {categories.filter(c => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNotice}>
                    <Megaphone className="w-4 h-4 mr-2" />
                    Post Notice
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Section */}
        {isLoading ? (
          <TableSkeleton rows={6} columns={3} />
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                  <FileText className="w-12 h-12 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Notices</h3>
                <p className="text-muted-foreground">Unable to fetch notices. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Bell className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Notices Found</h3>
                <p className="text-muted-foreground">
                  {search || selectedCategory !== "All" 
                    ? "Try adjusting your filters" 
                    : "No notices have been posted yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((notice: any) => {
              const CategoryIcon = getCategoryIcon(notice.category);
              return (
                <Card 
                  key={notice.$id} 
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-l-4 border-l-primary"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className={getCategoryColor(notice.category)}>
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {notice.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(notice.date)}
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {notice.activity}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(notice.date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
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
