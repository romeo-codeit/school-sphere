import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">EduManage</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/login')}>
                Sign In
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setLocation('/signup')}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />

        {/* CTA Section */}
        <section className="py-16 px-6 bg-primary/5">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Ready to Transform Your School Management?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of schools already using EduManage to streamline
              their operations and improve educational outcomes.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-3" onClick={() => setLocation('/login')}>
              Start Now
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}