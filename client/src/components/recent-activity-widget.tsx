import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { formatDistanceToNow, isValid } from 'date-fns';

interface Activity {
  $id: string;
  activity: string;
  date: string;
}

interface RecentActivityWidgetProps {
  activities: Activity[];
}

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return 'No date';
  const date = new Date(timestamp);
  if (!isValid(date)) {
    return 'Invalid date';
  }
  return formatDistanceToNow(date, { addSuffix: true });
};

export function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
  const [, setLocation] = useLocation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map((activity) => (
            <li key={activity.$id} className="flex items-start space-x-2 sm:space-x-4">
              <div className="p-2 bg-muted rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm text-wrap">{activity.activity}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(activity.date)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {activities.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No recent activities</p>
        )}
        <Button variant="outline" className="w-full mt-4" onClick={() => setLocation('/activities')}>View All</Button>
      </CardContent>
    </Card>
  );
}
