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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SchoolSphere</h1>
                <p className="text-sm text-muted-foreground">Smart School Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="text-foreground border-border hover:bg-accent hover:text-accent-foreground" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate('/signup')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-12 pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 py-16">
          <motion.div
            className="lg:w-1/2 text-center lg:text-left"
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
              className="text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
            >
              Modern School Management
              <br />
              <span className="text-primary">Simplified & Efficient</span>
            </motion.h1>
            
            <motion.p
              className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg lg:max-w-none mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.9 }}
            >
              SchoolSphere provides a comprehensive platform to manage all aspects of your educational institution,
              from student administration to academic planning and communication.
            </motion.p>
            
            <motion.div
              className="flex items-center justify-center lg:justify-start gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 1.1 }}
            >
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={scrollToFeatures}>
                Explore Features
              </Button>
              <Button size="lg" variant="outline" className="text-foreground border-border hover:bg-accent hover:text-accent-foreground" onClick={scrollToFeatures}>
                Learn More
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="lg:w-1/2 flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          >
            <motion.img
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Stack of books"
              className="rounded-lg shadow-xl w-full max-w-md lg:max-w-full h-auto object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/20">
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
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-xl opacity-90 mb-8 leading-relaxed">
            Join numerous educational institutions already using SchoolSphere to streamline
            their operations and improve educational outcomes.
          </p>
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" onClick={() => navigate('/signup')}>
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-card border-t border-border text-muted-foreground text-center">
        <div className="max-w-7xl mx-auto">
          <p>&copy; {new Date().getFullYear()} SchoolSphere. All rights reserved.</p>
          <p className="mt-2 text-sm">
            <a href="#" className="hover:text-foreground">Privacy Policy</a> | <a href="#" className="hover:text-foreground">Terms of Service</a>
          </p>
        </div>
      </footer>
    </div>
  );
}