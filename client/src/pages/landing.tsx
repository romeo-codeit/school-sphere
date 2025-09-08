import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, Calculator, MessageCircle, Settings } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">EduManage</h1>
                <p className="text-sm text-muted-foreground">School Management System</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'} 
              className="bg-primary hover:bg-primary/90"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Modern School
            <span className="text-primary block">Management System</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your educational institution with our comprehensive platform 
            for student management, exams, payments, and communication.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            Everything You Need to Manage Your School
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-primary text-xl" />
                </div>
                <CardTitle>Student Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Complete student profiles, enrollment tracking, attendance monitoring, 
                  and academic progress management.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="text-secondary text-xl" />
                </div>
                <CardTitle>Exam Module</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  JAMB, WAEC, and NECO practice questions with auto-scoring, 
                  progress tracking, and detailed analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="text-accent text-xl" />
                </div>
                <CardTitle>Payment Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor fee payments, track overdue amounts, generate reports, 
                  and manage payment history efficiently.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="text-primary text-xl" />
                </div>
                <CardTitle>Communication Hub</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Secure messaging between teachers, students, and parents. 
                  Announcements and notification system.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="text-secondary text-xl" />
                </div>
                <CardTitle>Resource Library</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Digital library with e-books, videos, study guides, and 
                  educational materials for all subjects.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="text-accent text-xl" />
                </div>
                <CardTitle>Admin Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Role-based access control, system customization, reporting, 
                  and comprehensive administrative tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold text-foreground mb-6">
            Ready to Transform Your School Management?
          </h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of schools already using EduManage to streamline 
            their operations and improve educational outcomes.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
            data-testid="button-start-now"
          >
            Start Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="text-primary-foreground text-lg" />
            </div>
            <span className="font-bold text-foreground">EduManage</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 EduManage. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
