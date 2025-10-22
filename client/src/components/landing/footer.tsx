import { GraduationCap, Twitter, Linkedin, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-8 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  EduManage
                </h2>
                <p className="text-sm text-muted-foreground">
                  School Management System
                </p>
              </div>
            </div>
            <p className="text-muted-foreground">
              © 2025 EduManage. All rights reserved.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-primary">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#security" className="text-muted-foreground hover:text-primary">
                  Security
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-muted-foreground hover:text-primary">
                  About Us
                </a>
              </li>
              <li>
                <a href="#blog" className="text-muted-foreground hover:text-primary">
                  Blog
                </a>
              </li>
              <li>
                <a href="#careers" className="text-muted-foreground hover:text-primary">
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Connect With Us
            </h3>
            <div className="flex space-x-4">
              <a href="https://twitter.com/edumanage" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Twitter />
              </a>
              <a href="https://linkedin.com/company/edumanage" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Linkedin />
              </a>
              <a href="https://facebook.com/edumanage" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Facebook />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
