import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { NoticeBoard } from "@/components/notice-board";
import { Megaphone, Rss, Mic, FileText } from "lucide-react";
import { BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
// Removed duplicate import of useState
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export default function NoticesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["allNotices"],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, "notices", []);
      return res.documents;
    },
  });

  const [showModal, setShowModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ activity: "", date: "", category: "General" });
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    if (data) setNotices(data);
  }, [data]);

  const handleCreateNotice = () => {
    // For demo, just add to local state. In production, call backend API.
    setNotices([
      ...notices,
      { $id: Math.random().toString(), ...newNotice }
    ]);
    setShowModal(false);
    setNewNotice({ activity: "", date: "", category: "General" });
  };

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const getIconForActivity = (activity: string) => {
    if (!activity) return FileText;
    if (activity.toLowerCase().includes('exam')) return BookOpen;
    if (activity.toLowerCase().includes('payment')) return Rss;
    if (activity.toLowerCase().includes('announcement')) return Mic;
    return FileText;
  };

  // Filter notices by search and date range
  const filtered = (notices || []).filter((notice: any) => {
    const matchesSearch = notice.activity.toLowerCase().includes(search.toLowerCase());
    const noticeDate = new Date(notice.date);
    const matchesStart = startDate ? noticeDate >= new Date(startDate) : true;
    const matchesEnd = endDate ? noticeDate <= new Date(endDate) : true;
    return matchesSearch && matchesStart && matchesEnd;
  });

  return (
    <div className="min-h-screen bg-background">
      <TopNav title="All Notices" subtitle="School-wide announcements and updates" showGoBackButton />
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> All Notices
          </h2>
          <Button onClick={() => setShowModal(true)}>
            <Megaphone className="w-4 h-4 mr-2" /> Create Notice
          </Button>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mb-6">
          <Input
            type="text"
            placeholder="Search notices..."
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
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Create Notice</h3>
              <Input className="mb-2" placeholder="Notice text" value={newNotice.activity} onChange={e => setNewNotice({ ...newNotice, activity: e.target.value })} />
              <Input className="mb-2" type="date" value={newNotice.date} onChange={e => setNewNotice({ ...newNotice, date: e.target.value })} />
              <select className="mb-4 w-full p-2 border rounded" value={newNotice.category} onChange={e => setNewNotice({ ...newNotice, category: e.target.value })}>
                <option value="General">General</option>
                <option value="Exam">Exam</option>
                <option value="Payment">Payment</option>
                <option value="Announcement">Announcement</option>
              </select>
              <div className="flex gap-2 justify-end">
                <Button onClick={handleCreateNotice}>
                  <Megaphone className="w-4 h-4 mr-2" /> Create
                </Button>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <BookOpen className="w-10 h-10 mb-2 animate-pulse text-primary" />
            <span>Loading notices...</span>
          </div>
        ) : error ? (
          <p className="text-destructive">Error loading notices</p>
        ) : (
          <ul className="space-y-4">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <BookOpen className="w-10 h-10 mb-2 text-primary" />
                <span>No notices found</span>
              </div>
            )}
            {filtered.map((notice: any) => {
              const Icon = getIconForActivity(notice.activity);
              return (
                <li key={notice.$id} className="flex items-center space-x-4 p-4 bg-card rounded-lg shadow-sm border-l-4 border-primary">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-base">{notice.activity}</p>
                    <span className="inline-block px-2 py-1 rounded text-xs font-semibold mr-2 bg-primary/10 text-primary">{notice.category}</span>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notice.date).toLocaleString()}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
