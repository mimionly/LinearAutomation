# Venture

Venture is a modern project and venture management platform designed to help teams organize goals, track progress, manage projects, and collaborate effectively. The application provides a clean and intuitive interface for creating ventures, assigning ownership, monitoring project health, and tracking key objectives.

## Features

* Create and manage ventures
* Set targets and goals
* Track project progress
* Team collaboration and member management
* Real-time data synchronization using Convex
* Secure authentication and user management
* Responsive and modern user interface
* Dark mode support

## Tech Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* Lucide React

### Backend

* Convex

### Authentication

* Clerk

## Prerequisites

Before running the project, ensure you have:

* Node.js (v18 or later)
* npm
* A Convex account
* A Clerk account

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd LINEAR
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the root directory and add the required environment variables:

```env
VITE_CONVEX_URL=<your_convex_url>
VITE_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
CLERK_WEBHOOK_SECRET=<your_webhook_secret>
```

## Running the Application

### Start Convex Development Environment

```bash
npx convex dev
```

This command generates backend types and connects the application to the configured Convex deployment.

## Build for Production

```bash
npm run build
```

### Start the Frontend

Open a new terminal and run:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```



## Project Structure

```text
src/
├── components/
├── pages/
├── hooks/
├── lib/
├── services/

convex/
├── schema.ts
├── functions/
├── _generated/
```

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm run preview   # Preview production build
npx convex dev    # Start Convex development environment
```

