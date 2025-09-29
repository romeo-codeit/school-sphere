import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { RecentActivityWidget } from "@/components/recent-activity-widget";
import { Bell } from "lucide-react";
import { FileText, Users, BookOpen } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export default function ActivitiesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["allActivities"],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, "activities", []);
      return res.documents;
    },
  });

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filter activities by search and date range
  // Removed duplicate declaration of filtered
  const filtered = (data || []).filter((activity: any) => {
    const matchesSearch = activity.activity.toLowerCase().includes(search.toLowerCase());
    const activityDate = new Date(activity.date);
    const matchesStart = startDate ? activityDate >= new Date(startDate) : true;
    const matchesEnd = endDate ? activityDate <= new Date(endDate) : true;
    return matchesSearch && matchesStart && matchesEnd;
  });

  // Activity type summary
  const typeCounts = filtered.reduce((acc: any, activity: any) => {
    const type = activity.activity.toLowerCase().includes('exam') ? 'Exam' :
      activity.activity.toLowerCase().includes('student') ? 'Student' :
      activity.activity.toLowerCase().includes('teacher') ? 'Teacher' :
      'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

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
    <div className="min-h-screen bg-background">
      <TopNav title="Recent Activities" subtitle="Latest school events and actions" showGoBackButton />
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> All Recent Activities
          </h2>
          <button className="bg-primary/10 text-primary px-3 py-1 rounded hover:bg-primary/20 text-sm font-medium" onClick={exportCSV}>Export CSV</button>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mb-6">
          <Input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="md:w-1/3"
          />
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4 text-primary" /> From
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-32" />
            </label>
            <label className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4 text-primary" /> To
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-32" />
            </label>
          </div>
        </div>
        <div className="mb-6 flex gap-4">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded">
            <BookOpen className="w-4 h-4 text-primary" /> Exams: <span className="font-bold">{typeCounts.Exam || 0}</span>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded">
            <Users className="w-4 h-4 text-primary" /> Students: <span className="font-bold">{typeCounts.Student || 0}</span>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded">
            <BookOpen className="w-4 h-4 text-primary" /> Teachers: <span className="font-bold">{typeCounts.Teacher || 0}</span>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded">
            <FileText className="w-4 h-4 text-primary" /> Other: <span className="font-bold">{typeCounts.Other || 0}</span>
          </div>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Bell className="w-10 h-10 mb-2 animate-pulse text-primary" />
            <span>Loading activities...</span>
          </div>
        ) : error ? (
          <p className="text-destructive">Error loading activities</p>
        ) : (
          <ul className="space-y-4">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Bell className="w-10 h-10 mb-2 text-primary" />
                <span>No recent activities found</span>
              </div>
            )}
            {filtered.map((activity: any) => (
              <li key={activity.$id} className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-sm border-l-4 border-primary">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-base">{activity.activity}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(activity.date).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
