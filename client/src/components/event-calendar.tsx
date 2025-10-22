import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotices } from "@/hooks/useNotices";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";

export function EventCalendar() {
  const { notices, isLoading } = useNotices();

  const eventDays = notices?.map((n: any) => new Date(n.date)) || [];
  const eventModifiers = {
    events: eventDays,
  };

  const eventModifierStyles = {
    events: {
      color: 'white',
      backgroundColor: 'var(--primary)',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notice Calendar</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="text-center py-8">Loading notices...</div>
        ) : (
          <DayPicker
            showOutsideDays
            className="p-0"
            classNames={{
              months: "flex flex-col space-y-4",
              month: "space-y-4",
              caption: "flex pt-1 relative items-center",
              caption_label: "text-sm font-medium w-full text-center",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-4",
              nav_button_next: "absolute right-4",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 flex-1 text-center text-sm px-1 p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-full p-0 font-normal aria-selected:opacity-100"
              ),
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            modifiers={eventModifiers}
            modifiersStyles={eventModifierStyles}
          />
        )}
        <div className="p-4 border-t">
          <h4 className="font-semibold mb-2">Upcoming Events</h4>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : notices && notices.length > 0 ? (
            <ul className="space-y-2">
              {notices.slice(0, 3).map((notice: any) => (
                <li key={notice.$id} className="flex items-center justify-between text-sm">
                  <span>{notice.title}</span>
                  <Badge variant="secondary">{new Date(notice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-4">
              <EmptyState
                icon={Calendar}
                title="No Events"
                description="No upcoming events scheduled."
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
