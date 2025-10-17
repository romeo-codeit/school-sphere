import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Quote {
  content: string;
  author: string;
}

export function QuickTipsWidget() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ['motivationalQuote', refreshKey],
    queryFn: async () => {
      // Using Quotable API - free, no auth required
      const response = await fetch('https://api.quotable.io/random?tags=education,inspirational,wisdom');
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      const data = await response.json();
      return {
        content: data.content,
        author: data.author,
      } as Quote;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Daily Inspiration
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-4/6"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Unable to load quote. Try again later.
            </p>
          </div>
        ) : quote ? (
          <div className="space-y-4">
            <blockquote className="text-sm sm:text-base italic text-foreground leading-relaxed">
              "{quote.content}"
            </blockquote>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium text-right">
              — {quote.author}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
