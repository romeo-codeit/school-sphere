import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Rss, BookOpen, Mic, LucideIcon, FileText } from "lucide-react";
import { format } from 'date-fns';

interface Notice {
  $id: string;
  activity: string;
  date: string;
  category?: string;
}

interface NoticeBoardProps {
  notices: Notice[];
}

const getIconForActivity = (activity: string, category?: string): LucideIcon => {
  // First check category
  if (category) {
    switch (category.toLowerCase()) {
      case 'exam': return BookOpen;
      case 'payment': return Rss;
      case 'announcement': return Mic;
      case 'event': return Calendar;
      case 'holiday': return Calendar;
      default: break;
    }
  }
  
  // Fallback to activity text
  if (!activity) return FileText;
  if (activity.toLowerCase().includes('exam')) return BookOpen;
  if (activity.toLowerCase().includes('payment')) return Rss;
  if (activity.toLowerCase().includes('announcement')) return Mic;
  return FileText;
}

export function NoticeBoard({ notices }: NoticeBoardProps) {
  const [, setLocation] = useLocation();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notice Board</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setLocation('/notices')}>View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {notices.map((notice) => {
            const Icon = getIconForActivity(notice.activity, notice.category);
            return (
              <li key={notice.$id} className="flex items-center space-x-2 sm:space-x-4 p-2 rounded-lg hover:bg-muted/50">
                <div className="p-2 bg-muted rounded-lg">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-wrap">{notice.activity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    {format(new Date(notice.date), "dd MMM, yyyy")}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
