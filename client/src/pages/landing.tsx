import React from 'react';
import { GraduationCap, Users, BookOpen, TrendingUp, Calendar, Bell, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex flex-row items-center justify-between min-h-[56px]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  <img src="/src/assets/ohman-no-bg.png" alt="OhmanFoundations Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col justify-center ml-2 sm:ml-3">
                  <h1 className="text-base sm:text-2xl font-bold text-foreground leading-tight">OhmanFoundations</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Smart School Management</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Show header buttons only on screens >=sm */}
                <Button variant="outline" className="hidden sm:inline-flex text-foreground border-border hover:bg-accent hover:text-accent-foreground px-4 py-2" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2" onClick={() => navigate('/signup')}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-12 overflow-hidden mt-12 sm:mt-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 py-16">
          <motion.div
            className="w-full md:w-1/2 text-center md:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          >
            <motion.div
              className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
            >
              <Zap className="w-4 h-4 mr-2" />
              Empowering Education Through Technology
            </motion.div>
            
            <motion.h1
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
            >
              Modern School Management
              <br />
              <span className="text-primary">Simplified & Efficient</span>
            </motion.h1>
            {/* ...existing code... */}
            <motion.p
              className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed max-w-lg md:max-w-none mx-auto md:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.9 }}
            >
              OhmanFoundations provides a comprehensive platform to manage all aspects of your educational institution,
              from student administration to academic planning and communication.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 1.1 }}
            >
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto" onClick={() => navigate('/signup')}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="text-foreground border-border hover:bg-accent hover:text-accent-foreground w-full sm:w-auto" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="w-full md:w-1/2 flex justify-center md:justify-end mt-8 md:mt-0 relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          >
            <div className="relative w-full max-w-md lg:max-w-full">
              <motion.img
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Stack of books"
                className="rounded-lg shadow-xl w-full h-auto object-cover aspect-[16/9] lg:aspect-[21/13]"
              />
              {/* Play Icon Overlay */}
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center"
                aria-label="Play video"
              >
                <span className="bg-primary text-primary-foreground rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-transform hover:scale-105 border-4 border-background opacity-95 lg:w-16 lg:h-16 md:w-14 md:h-14 sm:w-14 sm:h-14 w-12 h-12">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="currentColor" className="opacity-10" />
                    <polygon points="13,11 23,16 13,21" fill="currentColor" className="text-primary-foreground" />
                  </svg>
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
              <BookOpen className="w-4 h-4 mr-2" />
              Key Features
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Everything Your School Needs
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Streamline administrative tasks, enhance communication, and foster a better learning environment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
            
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Users, title: "Student Management", desc: "Comprehensive student profiles, attendance tracking, and academic records." },
                { icon: BookOpen, title: "Academic Management", desc: "Curriculum planning, timetable generation, and exam management." },
                { icon: TrendingUp, title: "Performance Analytics", desc: "Real-time insights into student performance and school operations." },
                { icon: Calendar, title: "Event & Calendar", desc: "Manage school events, holidays, and academic schedules with ease." },
                { icon: Bell, title: "Communication Hub", desc: "Instant notifications, announcements, and messaging for staff, students, and parents." },
                { icon: Shield, title: "Secure & Reliable", desc: "Enterprise-grade security to protect sensitive school data." }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="p-8 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-base sm:text-xl opacity-90 mb-6 sm:mb-8 leading-relaxed">
            Join numerous educational institutions already using OhmanFoundations to streamline
            their operations and improve educational outcomes.
          </p>
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full sm:w-auto" onClick={() => navigate('/signup')}>
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 bg-card border-t border-border text-muted-foreground text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs sm:text-sm">&copy; {new Date().getFullYear()} OhmanFoundations. All rights reserved.</p>
          <p className="mt-2 text-xs sm:text-sm">
            <a href="#" className="hover:text-foreground">Privacy Policy</a> | <a href="#" className="hover:text-foreground">Terms of Service</a>
          </p>
        </div>
      </footer>
    </div>
  );
}