import { Button } from "./button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function GoBackButton() {
  const navigate = useNavigate();

  return (
    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Go back</span>
    </Button>
  );
}
