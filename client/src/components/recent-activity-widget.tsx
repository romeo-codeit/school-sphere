import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  $id: string;
  activity: string;
  date: string;
}

interface RecentActivityWidgetProps {
  activities: Activity[];
}

export function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map((activity) => (
            <li key={activity.$id} className="flex items-start space-x-4">
              <div className="p-2 bg-muted rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{activity.activity}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {activities.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No recent activities</p>
        )}
        <Button variant="outline" className="w-full mt-4">View All</Button>
      </CardContent>
    </Card>
  );
}
