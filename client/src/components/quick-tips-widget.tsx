import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface Quote {
  content: string;
  author: string;
}

interface QuickTipsWidgetProps {
  height?: number;
  contentHeight?: number;
}

// Fallback quotes in case API fails
const FALLBACK_QUOTES: Quote[] = [
  {
    content: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela"
  },
  {
    content: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King"
  },
  {
    content: "Education is not preparation for life; education is life itself.",
    author: "John Dewey"
  },
  {
    content: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert"
  },
  {
    content: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi"
  },
  {
    content: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin"
  },
  {
    content: "The only person who is educated is the one who has learned how to learn and change.",
    author: "Carl Rogers"
  },
  {
    content: "Education is what remains after one has forgotten what one has learned in school.",
    author: "Albert Einstein"
  }
];


export function QuickTipsWidget({ height = 315, contentHeight = 231 }: QuickTipsWidgetProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: quote, isLoading, error, refetch } = useQuery({
    queryKey: ['motivationalQuote', refreshKey],
    queryFn: async () => {
      try {
        // Try Quotable API first
        const response = await fetch('https://api.quotable.io/random?tags=education|inspirational|wisdom', {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        if (!response.ok) {
          throw new Error('API request failed');
        }
        const data = await response.json();
        return {
          content: data.content,
          author: data.author,
        } as Quote;
      } catch (error) {
        // Return random fallback quote if API fails
        const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
        return FALLBACK_QUOTES[randomIndex];
      }
    },
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    refetchInterval: 1000 * 60 * 60 * 6, // Auto-refresh every 6 hours
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className={`h-[${typeof height === 'number' ? height : 220}px]`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            Daily Inspiration
          </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 w-8"
          title="Get new quote"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className={`h-[${typeof contentHeight === 'number' ? contentHeight : 140}px] flex items-center justify-center`}>
        {isLoading ? (
          <div className="space-y-3 w-full">
            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-4/6"></div>
          </div>
        ) : quote ? (
          <div className="space-y-6 w-full">
            <blockquote className="text-base sm:text-lg italic text-foreground leading-relaxed">
              "{quote.content}"
            </blockquote>
            <p className="text-sm sm:text-base text-muted-foreground font-medium text-right">
              — {quote.author}
            </p>
            <p className="text-xs text-muted-foreground/60 text-center">
              Refreshes automatically every 6 hours
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
