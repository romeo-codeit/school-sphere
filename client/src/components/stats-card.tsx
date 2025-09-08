import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
    icon: LucideIcon;
  };
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor, 
  trend 
}: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
              {value}
            </p>
            {trend && (
              <p className={`text-sm mt-1 flex items-center space-x-1 ${
                trend.isPositive ? 'text-secondary' : 'text-accent'
              }`}>
                <trend.icon className="w-4 h-4" />
                <span>{trend.value}</span>
              </p>
            )}
            {subtitle && !trend && (
              <p className="text-accent text-sm mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon className="text-xl w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
