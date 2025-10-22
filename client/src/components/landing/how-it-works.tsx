import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: <UserPlus className="text-primary text-3xl" />,
    title: "1. Create an Account",
    description:
      "Sign up in minutes and get immediate access to our platform. No credit card required.",
  },
  {
    icon: <LogIn className="text-secondary text-3xl" />,
    title: "2. Set Up Your School",
    description:
      "Easily import your student data, configure your settings, and invite your staff.",
  },
  {
    icon: <GraduationCap className="text-primary text-3xl" />,
    title: "3. Start Managing",
    description:
      "Enjoy a streamlined workflow and a powerful set of tools to manage your school with ease.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="text-center hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  {step.icon}
                </div>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
