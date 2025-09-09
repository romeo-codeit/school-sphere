import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Hero() {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            The Future of School Management is Here.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto md:mx-0">
            Empower your educators, engage your students, and streamline your
            administration with our all-in-one platform.
          </p>
          <Link href="/login">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-3">
              <a>Get Started</a>
            </Button>
          </Link>
        </div>
        <div>
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/online-learning-illustration-svg-download-png-6415193.png"
            alt="Modern School Management System"
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
