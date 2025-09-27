import { Button } from "./button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export function GoBackButton() {
  const [, setLocation] = useLocation();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/")}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Go back</span>
    </Button>
  );
}
