import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CommunityWidget() {
  return (
    <Card className="bg-gradient-to-br from-orange-400 to-rose-400 text-white overflow-hidden">
      <CardContent className="p-6 relative">
        <div className="relative z-10">
          <h3 className="text-xl font-bold">Join the community and get free access!</h3>
          <p className="text-sm opacity-80 mt-2 mb-4">
            Join our community and clear your doubts with our experts.
          </p>
          <Button variant="secondary" className="bg-white text-orange-500 hover:bg-white/90">
            Explore Now
          </Button>
        </div>
        {/* Decorative elements can be added here if needed */}
      </CardContent>
    </Card>
  );
}
