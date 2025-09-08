# EduManage - School Management System

## Overview

EduManage is a comprehensive school management system built as a full-stack web application. The platform provides functionality for managing students, teachers, exams, payments, resources, and internal communications within an educational institution.

This version of the application has been refactored to use **Appwrite** as its backend-as-a-service (BaaS), handling authentication, database, and storage.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend:** Appwrite (Cloud or self-hosted)
- **Language:** TypeScript

## Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- An active [Appwrite](https://appwrite.io/) project.

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

Install the necessary Node.js packages using `npm`:

```bash
npm install
```

> **A Note on Virtual Environments:**
> If you are coming from a Python background, you might be looking for a `venv`. In the Node.js ecosystem, dependencies are managed through the `package.json` file and installed locally into the `node_modules` directory by `npm` or `yarn`. This `node_modules` directory is the equivalent of a Python virtual environment, keeping all dependencies isolated to the project.

## Configuration

To connect the application to your Appwrite project, you need to configure your project ID and API endpoint in two places.

### 1. Frontend Configuration

Open the `client/src/lib/appwrite.ts` file and replace the placeholder values with your Appwrite project's credentials.

```typescript
// client/src/lib/appwrite.ts

// TODO: Replace with your Appwrite project credentials
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'; // Or your self-hosted endpoint
const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID'; // Replace with your Project ID
```

### 2. Seeding Script Configuration

The seeding script requires an API key with `users.write` permissions to create the demo users. Open `server/seed-appwrite.ts` and update the credentials.

**Important:** Treat your API key as a secret. Do not commit it to version control in a public repository.

```typescript
// server/seed-appwrite.ts

// TODO: Replace with your Appwrite project credentials
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'; // Must match the frontend endpoint
const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID'; // Replace with your Project ID
const APPWRITE_API_KEY = 'YOUR_API_KEY'; // Replace with your secret API Key
```

## Running the Application

### 1. Seed the Database (Optional)

To test the application with demo users for each role (Admin, Teacher, Student, Parent), run the seeding script:

```bash
npm run seed:appwrite
```

This will create four users with the password `password123`.

### 2. Start the Development Server

To run the application in development mode, use the following command:

```bash
npm run dev
```

The application will be available at the URL provided in the terminal (usually `http://localhost:5000` or a similar port).

Now you can open your browser and test the application by logging in with the demo users.
