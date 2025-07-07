# Restaurant Management System

## Overview

This is a full-stack restaurant management system built with modern web technologies. The application provides a comprehensive solution for managing restaurant operations including menu management, order processing, table QR codes, sales tracking, and expense management. The system features both an admin dashboard for restaurant staff and a customer-facing menu interface accessible via QR codes.

## System Architecture

The application follows a monorepo structure with a clear separation between client-side and server-side code:

- **Frontend**: React-based single-page application with TypeScript
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **Build System**: Vite for development and production builds
- **Styling**: TailwindCSS with shadcn/ui component library

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL via Neon serverless with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Session Management**: PostgreSQL session store

### Database Schema
The system includes the following main entities:
- **Users**: Admin authentication and role management
- **Categories**: Product categorization
- **Products**: Menu items with pricing and availability
- **Tables**: Restaurant tables with QR code integration
- **Orders**: Customer orders with status tracking
- **Order Items**: Individual items within orders
- **Sales**: Sales transaction records
- **Expenses**: Business expense tracking

## Data Flow

1. **Customer Flow**: Customers scan QR codes → Access table-specific menu → Place orders → Payment processing
2. **Admin Flow**: Staff login → Manage products/categories → Process orders → Track sales/expenses
3. **Order Processing**: Order creation → Status updates (pending → preparing → ready → completed)
4. **Analytics**: Real-time dashboard with sales metrics and business insights

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe ORM
- **@tanstack/react-query**: Server state management
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication
- **qrcode**: QR code generation
- **date-fns**: Date manipulation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variants
- **react-hook-form**: Form management
- **zod**: Schema validation

## Deployment Strategy

The application is designed for deployment on Replit with the following configuration:

1. **Development**: 
   - Vite dev server with HMR
   - Express server with middleware
   - PostgreSQL database via Neon

2. **Production Build**:
   - Vite builds the frontend to `dist/public`
   - esbuild bundles the backend to `dist/index.js`
   - Static file serving in production mode

3. **Database Management**:
   - Drizzle Kit for schema migrations
   - Environment-based database URL configuration
   - Automatic schema synchronization

The system supports both development and production environments with proper environment variable configuration for database connections and JWT secrets.

## Changelog
```
Changelog:
- July 07, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```