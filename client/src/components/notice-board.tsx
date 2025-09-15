import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Rss, BookOpen, Mic } from "lucide-react";

const notices = [
  {
    icon: Rss,
    title: "Inter-school competition",
    description: "sports/singing/drawing/drama",
    date: "10 Feb, 2023",
    category: "Competition",
    categoryColor: "text-red-500"
  },
  {
    icon: BookOpen,
    title: "Disciplinary action if school discipline is not followed",
    date: "6 Feb, 2023",
    category: "School Event",
    categoryColor: "text-blue-500"
  },
  {
    icon: Mic,
    title: "Disciplinary action on holiday",
    date: "24 Jan, 2023",
    category: "Notice",
    categoryColor: "text-green-500"
  },
];

export function NoticeBoard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notice Board</CardTitle>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {notices.map((notice, index) => (
            <li key={index} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-muted/50">
              <div className="p-2 bg-muted rounded-lg">
                <notice.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{notice.title}</p>
                {notice.description && <p className="text-sm text-muted-foreground">{notice.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">{notice.date}</p>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
