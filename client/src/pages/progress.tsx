import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Progress() {
  return (
    <div className="space-y-6">
      <TopNav title="Progress" subtitle="Track student progress and performance" />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Progress Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              This page is under construction. Please check back later for progress tracking features.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
