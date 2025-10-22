import React, { useState } from 'react';
import logo from '@/assets/ohman-no-bg.png';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  Bell, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Award,
  BarChart3,
  MessageSquare,
  FileText,
  Clock,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { ExamSuccessModal } from "@/components/exam-success-modal";

export default function Landing() {
  const [, navigate] = useLocation();
  const [showExamTips, setShowExamTips] = useState(false);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 text-foreground flex flex-col">
      <ExamSuccessModal open={showExamTips} onOpenChange={setShowExamTips} />
      
      {/* Enhanced Header */}
      <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                <img src={logo} alt="OhmanFoundations Logo" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  OhmanFoundations
                </span>
                <span className="text-xs text-muted-foreground">Smart School Management</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={scrollToFeatures} className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </button>
              <button onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium hover:text-primary transition-colors">
                Benefits
              </button>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                className="text-sm font-medium"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/25"
                onClick={() => navigate('/signup')}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Completely Redesigned */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-full mb-6"
              >
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Empowering Education Through Technology</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight mb-6"
              >
                <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                  Transform Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  School Management
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                Welcome to OhmanFoundations' comprehensive school management system. Access your student portal, track performance, manage attendance, and stay connected with our educational community.
              </motion.p>

              {/* Feature Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8"
              >
                {[
                  { icon: CheckCircle, text: "All-in-One Platform" },
                  { icon: Shield, text: "Enterprise Security" },
                  { icon: Zap, text: "Lightning Fast" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl shadow-primary/25 text-base h-12 px-8"
                  onClick={() => navigate('/signup')}
                >
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-base h-12 px-8 border-2"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base h-12 px-8"
                  onClick={() => navigate('/signup?guest=1')}
                  data-testid="button-register-guest"
                >
                  Register as Guest
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0"
              >
                {[
                  { value: "1000+", label: "Students" },
                  { value: "50+", label: "Teachers" },
                  { value: "20+", label: "Classes" }
                ].map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Column - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative"
            >
              <div className="relative min-h-[400px] flex items-center justify-center">
                {/* Main Visual - Abstract Representation */}
                <div className="relative w-full max-w-md">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/20 shadow-2xl p-8 flex items-center justify-center">
                    <div className="text-center space-y-6">
                      <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                        <GraduationCap className="w-12 h-12 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">OhmanFoundations</h3>
                        <p className="text-muted-foreground">School Management System</p>
                      </div>
                      <div className="flex justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">Students</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">Teachers</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements - Keep these as they're just UI indicators */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 bg-card border-2 rounded-lg shadow-lg p-4 w-48"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Attendance</div>
                      <div className="text-xs text-muted-foreground">Track Daily</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-6 -left-6 bg-card border-2 rounded-lg shadow-lg p-4 w-48"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Notifications</div>
                      <div className="text-xs text-muted-foreground">Stay Updated</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Exam Success Tips CTA - NEW */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-8 sm:p-12 text-center overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
            
            <Badge variant="secondary" className="mb-4 bg-primary/20 border-primary/30">
              <Award className="w-3 h-3 mr-1" />
              Free Study Guide
            </Badge>
            
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                12 Proven Strategies for
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Exam Success
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover the essential tips that help students excel in JAMB, WAEC, and other major examinations. 
              Learn from proven strategies used by top performers.
            </p>
            
            <Button
              size="lg"
              onClick={() => setShowExamTips(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl shadow-primary/25 text-base h-14 px-10"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Read Success Tips Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              💡 Takes only 5 minutes to read • Used by 1000+ students
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
              <Star className="w-3 h-3 mr-1 text-primary" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Everything Your School Needs,
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                All in One Place
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive tools designed to streamline operations, enhance communication, and improve educational outcomes.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {[
              { 
                icon: Users, 
                title: "Student Management", 
                desc: "Comprehensive student profiles with attendance tracking, academic records, and performance analytics.",
                color: "text-blue-500",
                bgColor: "bg-blue-500/10"
              },
              { 
                icon: BookOpen, 
                title: "Academic Planning", 
                desc: "Streamlined curriculum planning, timetable generation, and exam management in one unified system.",
                color: "text-purple-500",
                bgColor: "bg-purple-500/10"
              },
              { 
                icon: BarChart3, 
                title: "Performance Analytics", 
                desc: "Real-time insights and detailed reports on student performance and institutional operations.",
                color: "text-green-500",
                bgColor: "bg-green-500/10"
              },
              { 
                icon: Calendar, 
                title: "Events & Scheduling", 
                desc: "Manage school events, holidays, academic calendars, and class schedules effortlessly.",
                color: "text-orange-500",
                bgColor: "bg-orange-500/10"
              },
              { 
                icon: MessageSquare, 
                title: "Communication Hub", 
                desc: "Instant messaging, announcements, and notifications for seamless communication with all stakeholders.",
                color: "text-pink-500",
                bgColor: "bg-pink-500/10"
              },
              { 
                icon: Shield, 
                title: "Enterprise Security", 
                desc: "Bank-level encryption and advanced security protocols to protect sensitive educational data.",
                color: "text-red-500",
                bgColor: "bg-red-500/10"
              },
              { 
                icon: FileText, 
                title: "Smart Reports", 
                desc: "Generate comprehensive reports with a single click—attendance, grades, fees, and more.",
                color: "text-cyan-500",
                bgColor: "bg-cyan-500/10"
              },
              { 
                icon: Award, 
                title: "Grade Management", 
                desc: "Automated grading systems with customizable rubrics and instant grade calculations.",
                color: "text-yellow-500",
                bgColor: "bg-yellow-500/10"
              },
              { 
                icon: Globe, 
                title: "Cloud-Based Access", 
                desc: "Access your school management system from anywhere, on any device, at any time.",
                color: "text-indigo-500",
                bgColor: "bg-indigo-500/10"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
                  <CardContent className="p-6 sm:p-8">
                    <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section - New */}
      <section id="benefits" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          >
            {/* Left - Content */}
            <div>
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
                <Award className="w-3 h-3 mr-1 text-primary" />
                Why Choose Us
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Built for Modern
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Educational Excellence
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our comprehensive school management system empowers students, teachers, and administrators with tools to excel in today's educational landscape.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Clock,
                    title: "Save 10+ Hours Weekly",
                    desc: "Automate repetitive tasks and free up time for what matters most—teaching."
                  },
                  {
                    icon: TrendingUp,
                    title: "Improve Performance",
                    desc: "Data-driven insights help identify areas for improvement and track progress."
                  },
                  {
                    icon: Users,
                    title: "Better Engagement",
                    desc: "Keep parents, students, and teachers connected with real-time updates."
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right - Visual Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="border-2 shadow-xl">
                <CardContent className="p-8">
                  <div className="space-y-8">
                    {[
                      { label: "Time Saved", value: "85%", icon: Clock, color: "text-green-500" },
                      { label: "User Satisfaction", value: "98%", icon: Star, color: "text-yellow-500" },
                      { label: "Data Accuracy", value: "99.9%", icon: CheckCircle, color: "text-blue-500" },
                      { label: "Active Users", value: "50K+", icon: Users, color: "text-purple-500" }
                    ].map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${stat.color.replace('text', 'bg')}/10 flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <span className="font-medium">{stat.label}</span>
                        </div>
                        <span className="text-2xl font-bold">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials removed for non‑SaaS landing simplification */}

      {/* Final CTA Section - Enhanced */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzZoLTJ6bTAgNGgtMnYyaDJWMzh6bS0yIDBoLTJ2Mmgydi0yem0yIDJoMnYtMmgtMnYyem0wIDJWNDBoMnYyaC0yem0tMnYtMmgtMnYyaDJ6bTQgMHYyaDJ2LTJoLTJ6bS0yIDJoMnYtMmgtMnYyem0tMiAwdjJoMnYtMmgtMnptMi0ydi0yaDJWNDBoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center text-primary-foreground"
          >
            <Badge className="mb-6 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
              <Zap className="w-3 h-3 mr-1" />
              Join Our Community
            </Badge>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-6 leading-tight">
              Ready to Get Started?
            </h2>
            
            <p className="text-lg sm:text-xl opacity-95 mb-10 leading-relaxed max-w-3xl mx-auto">
              Access your student portal, manage your classes, track performance, and stay connected with the OhmanFoundations community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Button 
                size="lg" 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl text-base h-12 px-8 w-full sm:w-auto"
                onClick={() => navigate('/signup')}
              >
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 text-base h-12 px-8 w-full sm:w-auto"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Secure Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>24/7 Availability</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Mobile Friendly</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="py-12 px-4 sm:px-6 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src={logo} alt="OhmanFoundations Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  OhmanFoundations
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Empowering education through innovative technology solutions.
              </p>
              <div className="flex gap-3">
                {/* Social Icons Placeholder */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#benefits" className="hover:text-primary transition-colors">Benefits</a></li>
                <li><a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} OhmanFoundations. All rights reserved.</p>
            <p>Made with ❤️ for educators worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  );
}