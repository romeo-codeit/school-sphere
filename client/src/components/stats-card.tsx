import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "bg-primary/10 text-primary",
}: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium text-wrap" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground text-wrap" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
              {value}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
            <Icon className="text-xl w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
