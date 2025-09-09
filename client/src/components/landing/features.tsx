import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  Calculator,
  MessageCircle,
  Settings,
  Library,
} from "lucide-react";

const features = [
  {
    icon: <Users className="text-primary text-3xl" />,
    title: "Student Management",
    description:
      "Complete student profiles, enrollment tracking, attendance monitoring, and academic progress management.",
  },
  {
    icon: <BookOpen className="text-secondary text-3xl" />,
    title: "Exam Module",
    description:
      "JAMB, WAEC, and NECO practice questions with auto-scoring, progress tracking, and detailed analytics.",
  },
  {
    icon: <Calculator className="text-primary text-3xl" />,
    title: "Payment Tracking",
    description:
      "Monitor fee payments, track overdue amounts, generate reports, and manage payment history efficiently.",
  },
  {
    icon: <MessageCircle className="text-secondary text-3xl" />,
    title: "Communication Hub",
    description:
      "Secure messaging between teachers, students, and parents. Announcements and notification system.",
  },
  {
    icon: <Library className="text-primary text-3xl" />,
    title: "Resource Library",
    description:
      "Digital library with e-books, videos, study guides, and educational materials for all subjects.",
  },
  {
    icon: <Settings className="text-secondary text-3xl" />,
    title: "Admin Controls",
    description:
      "Role-based access control, system customization, reporting, and comprehensive administrative tools.",
  },
];

export function Features() {
  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Everything You Need to Manage Your School
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
