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
- July 07, 2025. Integrated CFA franc (FCFA) as currency throughout the application
- July 07, 2025. Fixed validation schemas for products, expenses, and sales
- July 07, 2025. Added manual sales entry functionality
- July 07, 2025. Resolved authentication and form submission issues
- July 07, 2025. Added detailed order items display in orders section
- July 07, 2025. Implemented intelligent product archiving system
- July 07, 2025. Added expenses card to dashboard with 5-column layout
- July 07, 2025. Created PDF receipt generation system with jsPDF
- July 07, 2025. Fixed token expiration handling and order validation errors
- July 07, 2025. Added Mobile Money provider options (Orange Money, MTN MoMo, Moov, Wave)
- July 07, 2025. Added sales deletion functionality with confirmation dialog
- July 07, 2025. Implemented comprehensive payment configuration system
- July 07, 2025. Added environment variables configuration for Mobile Money providers
- July 07, 2025. Created payment service infrastructure with API endpoints
- July 07, 2025. Added configuration page for testing payment methods
- July 07, 2025. Implemented user management system with roles and permissions
- July 07, 2025. Added user creation, editing, and role assignment functionality
- July 07, 2025. Created granular permission system for fine-grained access control
- July 07, 2025. Fixed QR code order display issue with authentication system
- July 07, 2025. Added real-time notification system for client order status updates
- July 07, 2025. Created automatic admin user creation and improved error handling
- July 07, 2025. Optimized notification system to prevent DOM manipulation errors
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```