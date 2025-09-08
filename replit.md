# EduManage - School Management System

## Overview

EduManage is a comprehensive school management system built as a full-stack web application. The platform provides functionality for managing students, teachers, exams, payments, resources, and internal communications within an educational institution. The system features a modern React frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and Replit's authentication system for user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application uses **React 18** with TypeScript and modern development practices. Key architectural decisions include:

- **Routing**: Wouter for lightweight client-side routing with page-based organization
- **State Management**: TanStack Query for server state management, eliminating the need for complex global state solutions
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build System**: Vite for fast development and optimized production builds

The frontend follows a feature-based organization with dedicated pages for dashboard, students, exams, payments, messages, resources, and settings.

### Backend Architecture
The server-side application uses **Express.js** with TypeScript in ESM format. Core architectural patterns include:

- **Database Layer**: Drizzle ORM for type-safe database operations with PostgreSQL
- **Authentication**: Replit's OpenID Connect integration with session-based authentication
- **API Design**: RESTful endpoints organized by resource type (students, teachers, exams, etc.)
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Error Handling**: Centralized error handling middleware with structured error responses

The backend implements a storage abstraction layer that encapsulates all database operations, making the system easier to test and maintain.

### Database Design
The system uses **PostgreSQL** as the primary database with the following key entity relationships:

- **Users**: Central authentication table linked to specific roles (admin, teacher, student, parent)
- **Students**: Detailed student profiles with academic and personal information
- **Teachers**: Staff profiles with subject specializations and contact details
- **Exams**: Question banks organized by type (JAMB, WAEC, NECO, internal) and subject
- **Payments**: Financial transaction records with status tracking
- **Messages**: Internal communication system supporting different recipient types
- **Resources**: File and content management for educational materials
- **Attendance & Grades**: Academic tracking and performance management

The schema uses UUIDs for primary keys and maintains referential integrity through foreign key constraints.

### Authentication & Authorization
The system integrates with **Replit's authentication system** using OpenID Connect:

- **Session Management**: Secure session storage in PostgreSQL with configurable TTL
- **Role-Based Access**: Different user roles (admin, teacher, student, parent) with appropriate permissions
- **Security**: HTTP-only cookies, CSRF protection, and secure session configuration
- **User Provisioning**: Automatic user creation and profile management through OIDC claims

### UI/UX Architecture
The interface uses a **component-driven design** with consistent patterns:

- **Design System**: Custom theme built on Tailwind CSS with CSS custom properties
- **Responsive Layout**: Mobile-first approach with collapsible sidebar navigation
- **Component Library**: Reusable components following shadcn/ui patterns
- **Accessibility**: ARIA compliance and keyboard navigation support
- **Performance**: Code splitting and lazy loading for optimal bundle sizes

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations and migrations
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing library for React
- **express**: Web framework for the Node.js backend

### Authentication & Security
- **openid-client**: OpenID Connect client for Replit authentication integration
- **passport**: Authentication middleware framework
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store

### UI & Styling
- **@radix-ui/***: Unstyled, accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library with consistent design language

### Development & Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and developer experience
- **eslint & prettier**: Code quality and formatting
- **drizzle-kit**: Database migration and introspection tools

### Form Management & Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

The system is designed to be easily deployable on Replit's infrastructure while maintaining the flexibility to run in other environments with minimal configuration changes.